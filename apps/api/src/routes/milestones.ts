import { Router, Request, Response, NextFunction } from "express";
import multer = require("multer");
import { z } from "zod";
import { Milestone, Contract, EscrowWallet, User } from "../models";
import { cloudinary } from "../lib/cloudinary";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";

const router: any = Router();

// Accept any ISO 8601 datetime string
const isoDatetime = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid datetime string" }
);

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
  dueDate: isoDatetime,
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
      const { status } = req.body;
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
        }
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
                folder: `verdiqt/milestones/${milestone._id || milestone.id}`,
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

      const updated = await Milestone.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "SUBMITTED",
            submissionNote: submissionNote?.trim() || null,
            submissionFiles: uploadedFiles.length ? uploadedFiles : null,
            submittedAt: new Date(),
          },
        },
        { new: true }
      );

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
