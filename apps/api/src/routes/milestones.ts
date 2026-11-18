import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import { z } from "zod";
import { Milestone, Contract, EscrowWallet, User } from "../models";
import { cloudinary } from "../lib/cloudinary";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { createInAppNotification } from "../services/notificationService";

const router: any = Router();

// Accept any ISO 8601 datetime string
const isoDatetime = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid datetime string" }
);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 20 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
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

const createMilestoneSchema = z.object({
  contractId: z.string(),
  title: z.string().min(3),
  description: z.string().min(5),
  amount: z.number().positive(),
  dueDate: isoDatetime,
});

const updateMilestoneSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "DISPUTED"]),
  rejectionReason: z.string().max(1000).optional(),
});

const submitMilestoneSchema = z.object({
  submissionNote: z.string().max(1000).optional(),
});

// POST /api/milestones — Add milestone to contract
router.post(
  "/",
  requireAuthWithUser,
  validate(createMilestoneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractId, title, description, amount, dueDate } = req.body;

      const contract = await Contract.findById(contractId);

      if (!contract || contract.status !== "DRAFT") {
        res.status(400).json({
          success: false,
          error: "Can only add milestones to draft contracts",
        });
        return;
      }

      const milestone = await Milestone.create({
        contractId,
        title,
        description,
        amount,
        dueDate: new Date(dueDate),
      });

      res.status(201).json({ success: true, data: milestone });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/milestones/:id — Update milestone status
router.patch(
  "/:id",
  requireAuthWithUser,
  validate(updateMilestoneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, rejectionReason } = req.body;
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();

      const milestone: any = await Milestone.findById(req.params.id).populate("contract");

      if (!milestone) {
        res.status(404).json({ success: false, error: "Milestone not found" });
        return;
      }

      // Role-based status update rules
      const isClient = milestone.contract?.clientId?.toString() === userId;
      const isFreelancer = milestone.contract?.freelancerId?.toString() === userId;

      if (status === "SUBMITTED" && !isFreelancer) {
        res.status(403).json({ success: false, error: "Only freelancer can submit milestones" });
        return;
      }

      if ((status === "APPROVED" || status === "REJECTED") && !isClient) {
        res.status(403).json({ success: false, error: "Only client can approve/reject milestones" });
        return;
      }

      const updateData: any = { status };
      if (status === "APPROVED") {
        updateData.completedAt = new Date();
      } else if (status === "REJECTED") {
        updateData.rejectionReason = rejectionReason?.trim() || "Revision requested by client";
      }

      const updated = await Milestone.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      // If approved, release milestone amount from escrow
      if (status === "APPROVED") {
        await EscrowWallet.findOneAndUpdate(
          { contractId: milestone.contractId },
          {
            $inc: {
              heldAmount: -milestone.amount,
              releasedToFreelancer: milestone.amount,
            },
            status: "PARTIALLY_RELEASED",
          }
        );

        if (milestone.contract?.freelancerId) {
          await User.findByIdAndUpdate(milestone.contract.freelancerId, {
            $inc: { walletBalance: milestone.amount },
          });

          createInAppNotification({
            recipientId: milestone.contract.freelancerId,
            type: "MILESTONE_APPROVED",
            title: "Milestone Approved",
            message: `Your milestone "${milestone.title}" was approved. ₹${milestone.amount.toLocaleString("en-IN")} released to your wallet.`,
            relatedEntity: { entityType: "Milestone", entityId: milestone._id.toString() },
            targetRoute: `/contracts/${milestone.contractId}`,
          }).catch(console.error);
        }
      } else if (status === "REJECTED" && milestone.contract?.freelancerId) {
        createInAppNotification({
          recipientId: milestone.contract.freelancerId,
          type: "MILESTONE_REJECTED",
          title: "Milestone Rejected",
          message: `Your milestone "${milestone.title}" was rejected and requires revision.`,
          relatedEntity: { entityType: "Milestone", entityId: milestone._id.toString() },
          targetRoute: `/contracts/${milestone.contractId}`,
        }).catch(console.error);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/milestones/:id/submit — Submit work with optional files and notes
router.post(
  "/:id/submit",
  requireAuthWithUser,
  upload.array("files"),
  validate(submitMilestoneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();

      const milestone: any = await Milestone.findById(req.params.id).populate("contract");

      if (!milestone) {
        res.status(404).json({ success: false, error: "Milestone not found" });
        return;
      }

      if (milestone.contract?.freelancerId?.toString() !== userId) {
        res.status(403).json({ success: false, error: "Only the assigned freelancer can submit this milestone" });
        return;
      }

      if (!["PENDING", "REJECTED"].includes(milestone.status)) {
        res.status(400).json({
          success: false,
          error: "Milestone can only be submitted when pending or after rejection",
        });
        return;
      }

      if (milestone.contract.status !== "ACTIVE") {
        res.status(400).json({ success: false, error: "Can only submit work for active contracts" });
        return;
      }

      const { submissionNote } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;
      const uploadedFiles: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
        publicId: string;
        resourceType?: string;
        bytes?: number;
      }> = [];

      if (files?.length) {
        const uploadPromises = files.map(async (file, fIdx) => {
          // Sanitize filename for Cloudinary public_id (only alphanumeric, _, -, .)
          const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
            .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

          const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
          // Strip extension from public_id to avoid doubled extensions like .pdf.pdf in Cloudinary
          const nameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, "");

          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `verdiqt/milestones/${milestone._id || milestone.id}`,
                resource_type: "auto",
                public_id: `${Date.now()}_${fIdx}_${nameWithoutExt}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          return {
            fileName: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: file.mimetype || (isPdf ? "application/pdf" : "application/octet-stream"),
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type || (isPdf ? "image" : "auto"),
            bytes: file.size || uploadResult.bytes || 0,
          };
        });

        const parallelUploadResults = await Promise.all(uploadPromises);
        uploadedFiles.push(...parallelUploadResults);
      }

      if (!submissionNote?.trim() && uploadedFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: "Please provide a work summary or upload at least one file before submitting.",
        });
        return;
      }

      // If resubmitting, archive the prior submission to submissionHistory so work history is preserved
      const previousSubmission = (milestone.submissionFiles?.length || milestone.submissionNote)
        ? {
            submissionNote: milestone.submissionNote,
            submissionFiles: milestone.submissionFiles,
            submittedAt: milestone.submittedAt || new Date(),
            rejectionReason: milestone.rejectionReason || null,
          }
        : null;

      const updateOps: any = {
        $set: {
          status: "SUBMITTED",
          submissionNote: submissionNote?.trim() || null,
          submissionFiles: uploadedFiles.length ? uploadedFiles : null,
          submittedAt: new Date(),
          rejectionReason: null, // Reset rejection reason on new submission
        },
      };

      if (previousSubmission) {
        updateOps.$push = {
          submissionHistory: previousSubmission,
        };
      }

      const updated = await Milestone.findByIdAndUpdate(
        req.params.id,
        updateOps,
        { new: true }
      );

      if (milestone.contract?.clientId) {
        createInAppNotification({
          recipientId: milestone.contract.clientId,
          type: "MILESTONE_SUBMITTED",
          title: "Milestone Submitted for Review",
          message: `${user.name} submitted work for milestone: "${milestone.title}"`,
          relatedEntity: { entityType: "Milestone", entityId: milestone._id.toString() },
          targetRoute: `/contracts/${milestone.contractId}`,
        }).catch(console.error);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to serve milestone submission files securely
async function serveMilestoneFile(
  req: Request,
  res: Response,
  next: NextFunction,
  isDownload: boolean
) {
  try {
    const user = (req as any).dbUser;
    const userId = user._id ? user._id.toString() : user.id;
    const id = String(req.params.id);
    const fileIndexStr = String(req.params.fileIndex);
    const index = parseInt(fileIndexStr, 10) || 0;

    const milestone: any = await Milestone.findById(id).populate("contract");
    if (!milestone) {
      res.status(404).json({ success: false, error: "Milestone not found" });
      return;
    }

    const contract = milestone.contract;
    if (!contract) {
      res.status(404).json({ success: false, error: "Contract not found" });
      return;
    }

    const isClient = contract.clientId?.toString() === userId;
    const isFreelancer = contract.freelancerId?.toString() === userId;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isFreelancer && !isAdmin) {
      res.status(403).json({ success: false, error: "Access denied. Only contract participants may view deliverables." });
      return;
    }

    const historyIndexStr = req.query.historyIndex as string | undefined;
    let files: any[] = [];

    if (historyIndexStr !== undefined && historyIndexStr !== "") {
      const hIdx = parseInt(historyIndexStr, 10);
      const historyItem = milestone.submissionHistory?.[hIdx];
      files = Array.isArray(historyItem?.submissionFiles) ? historyItem.submissionFiles : [];
    } else {
      files = Array.isArray(milestone.submissionFiles) ? milestone.submissionFiles : [];
    }

    let file = files[index];

    // Fallback: If not found at index, search across all submissionFiles and history
    if (!file) {
      const allFiles = [
        ...(Array.isArray(milestone.submissionFiles) ? milestone.submissionFiles : []),
        ...(Array.isArray(milestone.submissionHistory)
          ? milestone.submissionHistory.flatMap((h: any) => h.submissionFiles || [])
          : []),
      ];
      file = allFiles[index] || allFiles[0];
    }

    if (!file) {
      res.status(404).json({ success: false, error: "Submission deliverable file not found" });
      return;
    }

    let buffer: Buffer | null = null;
    let ext = "";
    if (file.fileName && file.fileName.includes(".")) {
      ext = file.fileName.split(".").pop()?.toLowerCase() || "";
    }
    const isPdf = ext === "pdf" || file.fileType?.includes("pdf") || file.fileName?.toLowerCase().endsWith(".pdf");
    let contentType = isPdf ? "application/pdf" : file.fileType || "application/octet-stream";

    // Strategy 1: Cloudinary authenticated private download API (bypasses ACL / deny restrictions)
    if (file.publicId) {
      const resourceTypesToTry = [
        file.resourceType && file.resourceType !== "auto" ? file.resourceType : isPdf ? "image" : "auto",
        "image",
        "raw",
      ];
      const uniqueResourceTypes = Array.from(new Set(resourceTypesToTry));

      for (const rType of uniqueResourceTypes) {
        if (buffer) break;
        const formatsToTry = ext ? [ext, ""] : [""];
        for (const fmt of formatsToTry) {
          try {
            const privUrl = cloudinary.utils.private_download_url(file.publicId, fmt, {
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
            console.warn(`[Cloudinary private download url error for ${rType}/${fmt}]:`, privErr);
          }
        }
      }
    }

    // Strategy 2: Direct public fileUrl
    if (!buffer && file.fileUrl) {
      try {
        const directResp = await fetch(file.fileUrl);
        if (directResp.ok) {
          buffer = Buffer.from(await directResp.arrayBuffer());
          const detectedType = directResp.headers.get("content-type");
          if (detectedType && detectedType !== "application/octet-stream") {
            contentType = detectedType;
          }
        }
      } catch (directErr) {
        console.warn("[Cloudinary direct fetch failed]:", directErr);
      }
    }

    // Strategy 3: Cloudinary Admin API resource fetch
    if (!buffer && file.publicId) {
      try {
        const resource = await cloudinary.api.resource(file.publicId, {
          resource_type: file.resourceType || "image",
        });
        if (resource && resource.secure_url) {
          const resResp = await fetch(resource.secure_url);
          if (resResp.ok) {
            buffer = Buffer.from(await resResp.arrayBuffer());
          }
        }
      } catch (resErr) {
        console.warn("[Cloudinary Admin API fetch failed]:", resErr);
      }
    }

    if (!buffer) {
      res.status(502).json({
        success: false,
        error: "Unable to retrieve milestone deliverable from Cloudinary storage.",
      });
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(file.fileName || "deliverable")}"`
    );
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

// GET /api/milestones/:id/files/:fileIndex/preview — Stream deliverable for in-browser preview
router.get("/:id/files/:fileIndex/preview", requireAuthWithUser, (req: Request, res: Response, next: NextFunction) => {
  serveMilestoneFile(req, res, next, false);
});

// GET /api/milestones/:id/files/:fileIndex/download — Download deliverable attachment
router.get("/:id/files/:fileIndex/download", requireAuthWithUser, (req: Request, res: Response, next: NextFunction) => {
  serveMilestoneFile(req, res, next, true);
});

export default router;
