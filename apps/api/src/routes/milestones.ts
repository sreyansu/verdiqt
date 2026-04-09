import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { cloudinary } from "../lib/cloudinary";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";

const router = Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
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
  dueDate: z.string().datetime(),
});

const updateMilestoneSchema = z.object({
  status: z.enum(["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "DISPUTED"]),
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

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract || contract.status !== "DRAFT") {
        res.status(400).json({
          success: false,
          error: "Can only add milestones to draft contracts",
        });
        return;
      }

      const milestone = await prisma.milestone.create({
        data: {
          contractId,
          title,
          description,
          amount,
          dueDate: new Date(dueDate),
        },
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
      const { status } = req.body;
      const user = (req as any).dbUser;

      const milestone = await prisma.milestone.findUnique({
        where: { id: req.params.id },
        include: { contract: true },
      });

      if (!milestone) {
        res.status(404).json({ success: false, error: "Milestone not found" });
        return;
      }

      // Role-based status update rules
      const isClient = milestone.contract.clientId === user.id;
      const isFreelancer = milestone.contract.freelancerId === user.id;

      if (status === "SUBMITTED" && !isFreelancer) {
        res.status(403).json({ success: false, error: "Only freelancer can submit milestones" });
        return;
      }

      if ((status === "APPROVED" || status === "REJECTED") && !isClient) {
        res.status(403).json({ success: false, error: "Only client can approve/reject milestones" });
        return;
      }

      const updated = await prisma.milestone.update({
        where: { id: req.params.id },
        data: {
          status,
          completedAt: status === "APPROVED" ? new Date() : undefined,
        },
      });

      // If approved, release milestone amount from escrow
      if (status === "APPROVED") {
        await prisma.escrowWallet.update({
          where: { contractId: milestone.contractId },
          data: {
            heldAmount: { decrement: milestone.amount },
            releasedToFreelancer: { increment: milestone.amount },
            status: "PARTIALLY_RELEASED",
          },
        });

        await prisma.user.update({
          where: { id: milestone.contract.freelancerId },
          data: { walletBalance: { increment: milestone.amount } },
        });
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
      const milestone = await prisma.milestone.findUnique({
        where: { id: req.params.id },
        include: { contract: true },
      });

      if (!milestone) {
        res.status(404).json({ success: false, error: "Milestone not found" });
        return;
      }

      if (milestone.contract.freelancerId !== user.id) {
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
      const uploadedFiles: Array<{ fileName: string; fileUrl: string; fileType: string; publicId: string }> = [];

      if (files?.length) {
        for (const file of files) {
          // Sanitize filename for Cloudinary public_id (only alphanumeric, _, -, .)
          const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
            .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

          const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `verdiqt/milestones/${milestone.id}`,
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

          uploadedFiles.push({
            fileName: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: file.mimetype,
            publicId: uploadResult.public_id,
          });
        }
      }

      if (!submissionNote?.trim() && uploadedFiles.length === 0) {
        res.status(400).json({
          success: false,
          error: "Please provide a work summary or upload at least one file before submitting.",
        });
        return;
      }

      const updated = await prisma.milestone.update({
        where: { id: req.params.id },
        data: {
          status: "SUBMITTED",
          submissionNote: submissionNote?.trim() || null,
          submissionFiles: uploadedFiles.length ? uploadedFiles : null,
          submittedAt: new Date(),
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
