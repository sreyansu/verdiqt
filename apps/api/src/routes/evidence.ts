import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import { prisma } from "../lib/prisma";
import { cloudinary } from "../lib/cloudinary";
import { requireAuthWithUser } from "../middleware/firebaseAuth";

const router = Router();

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

// POST /api/evidence/upload — Upload file to Cloudinary
router.post(
  "/upload",
  requireAuthWithUser,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const file = req.file;
      const { disputeId, description } = req.body;

      if (!file) {
        res.status(400).json({ success: false, error: "No file provided" });
        return;
      }

      // Verify dispute exists and is in valid state
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
      });

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

      // Sanitize filename for Cloudinary public_id (only alphanumeric, _, -, .)
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
        .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

      // Upload to Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `verdiqt/evidence/${disputeId}`,
            resource_type: "auto",
            public_id: `${Date.now()}_${sanitizedName}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      // Save record
      const evidence = await prisma.evidence.create({
        data: {
          disputeId,
          uploadedById: user.id,
          fileName: file.originalname,
          fileUrl: uploadResult.secure_url,
          fileType: file.mimetype,
          description,
        },
        include: { uploadedBy: true },
      });

      res.status(201).json({ success: true, data: evidence });
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
      const evidence = await prisma.evidence.findMany({
        where: { disputeId: req.params.disputeId },
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      });

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

      const evidence = await prisma.evidence.findUnique({
        where: { id: req.params.id },
        include: { dispute: true },
      });

      if (!evidence) {
        res.status(404).json({ success: false, error: "Evidence not found" });
        return;
      }

      if (evidence.uploadedById !== user.id) {
        res.status(403).json({ success: false, error: "Can only delete your own evidence" });
        return;
      }

      if (evidence.dispute.status !== "OPEN") {
        res.status(400).json({ success: false, error: "Can only delete evidence in open disputes" });
        return;
      }

      await prisma.evidence.delete({ where: { id: req.params.id } });

      res.json({ success: true, message: "Evidence deleted" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
