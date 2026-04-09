import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { runMediationEngine } from "../services/mediationEngine";
import { getIO } from "../lib/socket";

const router = Router();

const raiseDisputeSchema = z.object({
  contractId: z.string(),
  title: z.string().min(5).max(200),
  clientStatement: z.string().min(20),
});

const respondDisputeSchema = z.object({
  freelancerStatement: z.string().min(20),
});

// GET /api/disputes — List disputes for user
router.get(
  "/",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;

      const disputes = await prisma.dispute.findMany({
        where: {
          contract: {
            OR: [{ clientId: user.id }, { freelancerId: user.id }],
          },
        },
        include: {
          contract: { include: { client: true, freelancer: true } },
          raisedBy: true,
          verdict: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: disputes });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/disputes — Raise a new dispute
router.post(
  "/",
  requireAuthWithUser,
  validate(raiseDisputeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const { contractId, title, clientStatement } = req.body;

      // Check contract exists and is active
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { dispute: true },
      });

      if (!contract) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      if (contract.status !== "ACTIVE") {
        res.status(400).json({ success: false, error: "Can only dispute active contracts" });
        return;
      }

      if (contract.dispute) {
        res.status(400).json({ success: false, error: "Contract already has an active dispute" });
        return;
      }

      // Create dispute + freeze escrow + update contract status
      const dispute = await prisma.dispute.create({
        data: {
          contractId,
          raisedById: user.id,
          title,
          clientStatement,
          status: "OPEN",
        },
        include: {
          contract: { include: { client: true, freelancer: true } },
          raisedBy: true,
        },
      });

      // Freeze escrow
      await prisma.escrowWallet.update({
        where: { contractId },
        data: { status: "FROZEN" },
      });

      // Update contract status
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: "DISPUTED" },
      });

      res.status(201).json({ success: true, data: dispute });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/disputes/:id — Get dispute detail
router.get(
  "/:id",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id },
        include: {
          contract: {
            include: {
              client: true,
              freelancer: true,
              milestones: { orderBy: { dueDate: "asc" } },
              escrowWallet: true,
            },
          },
          raisedBy: true,
          evidence: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
          verdict: true,
        },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      res.json({ success: true, data: dispute });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/disputes/:id/respond — Freelancer submits response
router.patch(
  "/:id/respond",
  requireAuthWithUser,
  validate(respondDisputeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const { freelancerStatement } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id },
        include: { contract: true },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      if (dispute.contract.freelancerId !== user.id) {
        res.status(403).json({ success: false, error: "Only the freelancer can respond" });
        return;
      }

      const updated = await prisma.dispute.update({
        where: { id: req.params.id },
        data: {
          freelancerStatement,
          status: "EVIDENCE_COLLECTION",
        },
      });

      // Emit realtime update
      const io = getIO();
      io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
        disputeId: dispute.id,
        status: "EVIDENCE_COLLECTION",
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/disputes/:id/analyze — Trigger AI mediation
router.post(
  "/:id/analyze",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id },
        include: {
          contract: { include: { milestones: true } },
          evidence: true,
        },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      if (!dispute.freelancerStatement) {
        res.status(400).json({
          success: false,
          error: "Both parties must submit statements before analysis",
        });
        return;
      }

      // Update status to analyzing
      await prisma.dispute.update({
        where: { id: req.params.id },
        data: { status: "AI_ANALYZING" },
      });

      const io = getIO();
      io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
        disputeId: dispute.id,
        status: "AI_ANALYZING",
      });

      // Run AI mediation
      try {
        const verdict = await runMediationEngine({
          contractTitle: dispute.contract.title,
          contractDescription: dispute.contract.description,
          totalAmount: dispute.contract.totalAmount,
          milestones: dispute.contract.milestones.map((m: any) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            status: m.status,
            dueDate: m.dueDate.toISOString(),
          })),
          clientStatement: dispute.clientStatement,
          freelancerStatement: dispute.freelancerStatement,
          evidenceSummaries: dispute.evidence.map(
            (e: any) => `${e.fileName} (${e.fileType}): ${e.description || "No description"}`
          ),
          disputeTitle: dispute.title,
        });

        // Save verdict
        const savedVerdict = await prisma.verdict.create({
          data: {
            disputeId: dispute.id,
            ...verdict,
            modelUsed: process.env.NODE_ENV === "production" ? "claude-3-7-sonnet-20250219" : "claude-3-5-haiku-20241022",
          },
        });

        // Update dispute status
        await prisma.dispute.update({
          where: { id: req.params.id },
          data: { status: "VERDICT_READY" },
        });

        io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
          disputeId: dispute.id,
          status: "VERDICT_READY",
        });

        res.json({ success: true, data: savedVerdict });
      } catch (mediationError: any) {
        console.error("AI Mediation Engine failed:", mediationError);

        // Fallback to ESCALATED status
        await prisma.dispute.update({
          where: { id: req.params.id },
          data: { status: "ESCALATED" },
        });

        io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
          disputeId: dispute.id,
          status: "ESCALATED",
        });

        res.status(500).json({
          success: false,
          error: "AI Mediation failed. The dispute has been escalated for human review.",
          details: mediationError.message
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
