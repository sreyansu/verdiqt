import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { getIO } from "../lib/socket";

const router: any = Router();

const raiseDisputeSchema = z.object({
  contractId: z.string(),
  title: z.string().min(5).max(200),
  statement: z.string().min(20),
});

const respondDisputeSchema = z.object({
  statement: z.string().min(20),
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
      const { contractId, title, statement } = req.body;

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

      const isClient = contract.clientId === user.id;

      // Create dispute + freeze escrow + update contract status
      const dispute = await prisma.dispute.create({
        data: {
          contractId,
          raisedById: user.id,
          title,
          clientStatement: isClient ? statement : null,
          freelancerStatement: !isClient ? statement : null,
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
        where: { id: req.params.id as string },
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
      const { statement } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id as string },
        include: { contract: true },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      const contract = (dispute as any).contract;
      const isClient = contract.clientId === user.id;
      const isFreelancer = contract.freelancerId === user.id;

      if (!isClient && !isFreelancer) {
        res.status(403).json({ success: false, error: "Only contract parties can respond" });
        return;
      }

      // Prevent the party who raised the dispute from responding to it
      if (dispute.raisedById === user.id) {
        res.status(400).json({ success: false, error: "You cannot respond to your own dispute" });
        return;
      }

      const updated = await prisma.dispute.update({
        where: { id: req.params.id as string },
        data: {
          ...(isClient ? { clientStatement: statement } : { freelancerStatement: statement }),
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

// PATCH /api/disputes/:id/challenge — Client or Freelancer challenges a verdict
router.patch(
  "/:id/challenge",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const { challengeReason } = req.body;

      if (!challengeReason || challengeReason.length < 20) {
        res.status(400).json({
          success: false,
          error: "Challenge reason must be at least 20 characters",
        });
        return;
      }

      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id as string },
        include: {
          contract: true,
          verdict: true,
        },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      // Only parties to the contract can challenge
      const isClient = (dispute as any).contract.clientId === user.id;
      const isFreelancer = (dispute as any).contract.freelancerId === user.id;
      if (!isClient && !isFreelancer) {
        res.status(403).json({
          success: false,
          error: "Only parties to this dispute can challenge the verdict",
        });
        return;
      }

      // Can only challenge when verdict is ready
      if (dispute.status !== "VERDICT_READY") {
        res.status(400).json({
          success: false,
          error: "Can only challenge a verdict when status is VERDICT_READY",
        });
        return;
      }

      if (!(dispute as any).verdict) {
        res.status(400).json({
          success: false,
          error: "No verdict exists to challenge",
        });
        return;
      }

      // Max 2 challenges allowed
      if (dispute.challengeCount >= 2) {
        res.status(400).json({
          success: false,
          error: "Maximum number of challenges (2) has been reached. This dispute must be resolved by an administrator.",
        });
        return;
      }

      // Delete old verdict so admin can re-analyze
      await prisma.verdict.delete({
        where: { id: (dispute as any).verdict.id },
      });

      // Update dispute
      const updated = await prisma.dispute.update({
        where: { id: req.params.id as string },
        data: {
          status: "CHALLENGED",
          challengeReason,
          challengedById: user.id,
          challengeCount: { increment: 1 },
        },
      });

      // Emit realtime update
      const io = getIO();
      io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
        disputeId: dispute.id,
        status: "CHALLENGED",
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/disputes/:id/ready — User marks themselves as "ready for review"
router.patch(
  "/:id/ready",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;

      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id as string },
        include: { contract: true },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      // Only parties to the contract can mark ready
      const isClient = (dispute as any).contract.clientId === user.id;
      const isFreelancer = (dispute as any).contract.freelancerId === user.id;
      if (!isClient && !isFreelancer) {
        res.status(403).json({
          success: false,
          error: "Only parties to this dispute can mark ready",
        });
        return;
      }

      // Can only mark ready during evidence collection or open (after both statements)
      if (!["OPEN", "EVIDENCE_COLLECTION"].includes(dispute.status)) {
        res.status(400).json({
          success: false,
          error: "Can only mark ready during evidence collection phase",
        });
        return;
      }

      // Both statements must exist before marking ready
      if (!dispute.freelancerStatement) {
        res.status(400).json({
          success: false,
          error: "Both parties must submit statements before marking ready",
        });
        return;
      }

      // Set the appropriate ready flag
      const updateData: any = {};
      if (isClient) updateData.clientReady = true;
      if (isFreelancer) updateData.freelancerReady = true;

      // Check if the other party is already ready
      const otherReady = isClient ? dispute.freelancerReady : dispute.clientReady;

      // If both are now ready, transition to AWAITING_AI
      if (otherReady) {
        updateData.status = "AWAITING_AI";
      }

      const updated = await prisma.dispute.update({
        where: { id: req.params.id as string },
        data: updateData,
      });

      // Emit realtime update
      const io = getIO();
      if (otherReady) {
        // Both ready — notify everyone including admin
        io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
          disputeId: dispute.id,
          status: "AWAITING_AI",
        });
        io.emit("adminNotification", {
          type: "DISPUTE_READY_FOR_AI",
          disputeId: dispute.id,
          message: `Dispute "${dispute.title}" is ready for AI analysis — both parties have submitted evidence.`,
        });
      } else {
        // One party ready — notify the dispute room
        io.to(`dispute:${dispute.id}`).emit("disputeReadyUpdate", {
          disputeId: dispute.id,
          clientReady: isClient ? true : dispute.clientReady,
          freelancerReady: isFreelancer ? true : dispute.freelancerReady,
        });
      }

      res.json({
        success: true,
        data: updated,
        message: otherReady
          ? "Both parties ready — dispute sent for AI analysis review."
          : `You've marked ready. Waiting for the other party.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

