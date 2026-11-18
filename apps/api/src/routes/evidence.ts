import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import { Evidence, Dispute } from "../models";
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

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `verdiqt/evidence/${disputeId}`,
              resource_type: "auto",
              public_id: `${Date.now()}_${idx}_${sanitizedName}`,
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
          fileType: file.mimetype,
          description: description || undefined,
        });

        return evidence;
      });

      const createdEvidence = await Promise.all(uploadPromises);
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
