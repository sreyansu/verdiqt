import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import * as crypto from "crypto";
import { Evidence, Dispute, Contract } from "../models";
import { cloudinary } from "../lib/cloudinary";
import { requireAuthWithUser } from "../middleware/firebaseAuth";

const router: any = Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Multer config — store in memory for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// POST /api/evidence/upload — Upload single or multiple files to Cloudinary concurrently
router.post(
  "/upload",
  requireAuthWithUser,
  upload.any(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = user._id || user.id;
      const rawFiles = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const { disputeId, description } = req.body;

      if (!rawFiles || rawFiles.length === 0) {
        res.status(400).json({ success: false, error: "No file provided" });
        return;
      }

      // Verify dispute exists and is in valid state
      const dispute = await Dispute.findById(disputeId);

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      if (!["OPEN", "EVIDENCE_COLLECTION"].includes(dispute.status)) {
        res.status(400).json({
          success: false,
          error: "Evidence can only be uploaded during open or evidence collection phase",
        });
        return;
      }

      // Upload all files to Cloudinary concurrently in parallel
      const uploadPromises = rawFiles.map(async (file, idx) => {
        // Sanitize filename for Cloudinary public_id (only alphanumeric, _, -, .)
        const sanitizedName = file.originalname
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_{2,}/g, "_");

        const sha256Hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
        const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
        const nameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, "");

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `verdiqt/evidence/${disputeId}`,
              resource_type: "auto",
              public_id: `${Date.now()}_${idx}_${nameWithoutExt}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });

        // Save evidence record in DB
        const evidence = await Evidence.create({
          disputeId,
          uploadedById: userId,
          fileName: file.originalname,
          fileUrl: uploadResult.secure_url,
          fileType: file.mimetype || (isPdf ? "application/pdf" : "application/octet-stream"),
          publicId: uploadResult.public_id,
          bytes: file.size || uploadResult.bytes || 0,
          sha256Hash,
          mimeType: file.mimetype,
          description: description || undefined,
        });

        return evidence;
      });

      const createdEvidence = await Promise.all(uploadPromises);

      // Section 12 Reopening Condition: If new evidence is added after either party marked ready,
      // invalidate previous readiness and bump version so parties re-verify evidence completeness.
      if (dispute.clientReady || dispute.freelancerReady) {
        await Dispute.findByIdAndUpdate(disputeId, {
          $inc: { version: 1 },
          $set: { clientReady: false, freelancerReady: false, status: "EVIDENCE_COLLECTION" },
          $push: {
            auditTrail: {
              action: "EVIDENCE_ADDED_READINESS_REOPENED",
              actorId: userId,
              timestamp: new Date(),
              details: {
                newFilesCount: createdEvidence.length,
                newVersion: (dispute.version || 1) + 1,
              },
            },
          },
        });
      }

      const populated = await Evidence.find({
        _id: { $in: createdEvidence.map((e) => e._id) },
      }).populate("uploadedBy");

      res.status(201).json({
        success: true,
        data: populated.length === 1 ? populated[0] : populated,
        items: populated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Secure Evidence Streaming & Preview ──────────────────────────────────────

async function serveEvidenceFile(req: Request, res: Response, isDownload: boolean) {
  try {
    const user = (req as any).dbUser;
    const userId = (user?._id || user?.id)?.toString();

    const evidence: any = await Evidence.findById(req.params.id).populate({
      path: "dispute",
      populate: { path: "contract" },
    });

    if (!evidence) {
      res.status(404).json({ success: false, error: "Evidence record not found" });
      return;
    }

    const dispute = evidence.dispute;
    const contract = dispute?.contract;

    if (!contract) {
      res.status(404).json({ success: false, error: "Associated dispute contract not found" });
      return;
    }

    const isClient = contract.clientId?.toString() === userId;
    const isFreelancer = contract.freelancerId?.toString() === userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isFreelancer && !isAdmin) {
      res.status(403).json({
        success: false,
        error: "Access denied. Only dispute participants and reviewers may view evidence files.",
      });
      return;
    }

    let buffer: Buffer | null = null;
    let ext = "";
    if (evidence.fileName && evidence.fileName.includes(".")) {
      ext = evidence.fileName.split(".").pop()?.toLowerCase() || "";
    }
    const isPdf = ext === "pdf" || evidence.fileType?.includes("pdf") || evidence.fileName?.toLowerCase().endsWith(".pdf");
    let contentType = isPdf ? "application/pdf" : evidence.fileType || evidence.mimeType || "application/octet-stream";

    // Strategy 1: Cloudinary private signed download URL
    if (evidence.publicId) {
      const resourceTypesToTry = [isPdf ? "image" : "auto", "image", "raw"];
      const uniqueResourceTypes = Array.from(new Set(resourceTypesToTry));

      for (const rType of uniqueResourceTypes) {
        if (buffer) break;
        const formatsToTry = ext ? [ext, ""] : [""];
        for (const fmt of formatsToTry) {
          try {
            const privUrl = cloudinary.utils.private_download_url(evidence.publicId, fmt, {
              resource_type: rType === "auto" ? "image" : rType,
              type: "upload",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            });
            const resp = await fetch(privUrl);
            if (resp.ok) {
              buffer = Buffer.from(await resp.arrayBuffer());
              const detectedType = resp.headers.get("content-type");
              if (detectedType && detectedType !== "application/octet-stream") {
                contentType = detectedType;
              }
              break;
            }
          } catch (privErr) {
            console.warn(`[Cloudinary evidence private download error for ${rType}/${fmt}]:`, privErr);
          }
        }
      }
    }

    // Strategy 2: Direct fileUrl fallback
    if (!buffer && evidence.fileUrl) {
      try {
        const directResp = await fetch(evidence.fileUrl);
        if (directResp.ok) {
          buffer = Buffer.from(await directResp.arrayBuffer());
          const detectedType = directResp.headers.get("content-type");
          if (detectedType && detectedType !== "application/octet-stream") {
            contentType = detectedType;
          }
        }
      } catch (directErr) {
        console.warn("[Cloudinary direct evidence fetch failed]:", directErr);
      }
    }

    if (!buffer) {
      res.status(502).json({
        success: false,
        error: "Unable to retrieve evidence deliverable from storage.",
      });
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(evidence.fileName || "evidence")}"`
    );
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(buffer);
  } catch (error) {
    console.error("serveEvidenceFile error:", error);
    res.status(500).json({ success: false, error: "Failed to serve evidence file" });
  }
}

// GET /api/evidence/:id/preview — Securely view/preview evidence
router.get("/:id/preview", requireAuthWithUser, (req: Request, res: Response) =>
  serveEvidenceFile(req, res, false)
);

// GET /api/evidence/:id/download — Securely download evidence
router.get("/:id/download", requireAuthWithUser, (req: Request, res: Response) =>
  serveEvidenceFile(req, res, true)
);

// GET /api/evidence/:disputeId — List all evidence for a dispute
router.get(
  "/:disputeId",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evidence = await Evidence.find({ disputeId: req.params.disputeId as string })
        .populate("uploadedBy")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: evidence });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/evidence/:id — Delete own evidence
router.delete(
  "/:id",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();

      const evidence: any = await Evidence.findById(req.params.id).populate("dispute");

      if (!evidence) {
        res.status(404).json({ success: false, error: "Evidence not found" });
        return;
      }

      if (evidence.uploadedById?.toString() !== userId) {
        res.status(403).json({ success: false, error: "Can only delete your own evidence" });
        return;
      }

      if (evidence.dispute?.status !== "OPEN") {
        res.status(400).json({ success: false, error: "Can only delete evidence in open disputes" });
        return;
      }

      await Evidence.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: "Evidence deleted" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
