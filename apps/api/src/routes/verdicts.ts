import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { getIO } from "../lib/socket";

const router: any = Router();

// GET /api/verdicts/:disputeId — Get verdict for dispute
router.get(
  "/:disputeId",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verdict = await prisma.verdict.findUnique({
        where: { disputeId: req.params.disputeId as string },
      });

      if (!verdict) {
        res.status(404).json({ success: false, error: "Verdict not found" });
        return;
      }

      res.json({ success: true, data: verdict });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/verdicts/:id/accept — Accept verdict, trigger escrow execution
router.post(
  "/:id/accept",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verdict: any = await prisma.verdict.findUnique({
        where: { id: req.params.id as string },
        include: {
          dispute: {
            include: {
              contract: { include: { escrowWallet: true } },
            },
          },
        },
      });

      if (!verdict) {
        res.status(404).json({ success: false, error: "Verdict not found" });
        return;
      }

      if (verdict.acceptedAt) {
        res.status(400).json({ success: false, error: "Verdict already accepted" });
        return;
      }

      const wallet = verdict.dispute.contract.escrowWallet;
      if (!wallet) {
        res.status(400).json({ success: false, error: "No escrow wallet found" });
        return;
      }

      // Calculate splits
      const freelancerAmount = (wallet.heldAmount * verdict.freelancerReleasePercent) / 100;
      const clientRefund = (wallet.heldAmount * verdict.clientRefundPercent) / 100;

      // Execute escrow split
      await prisma.escrowWallet.update({
        where: { id: wallet.id },
        data: {
          heldAmount: 0,
          releasedToFreelancer: { increment: freelancerAmount },
          refundedToClient: { increment: clientRefund },
          status: "FULLY_RELEASED",
        },
      });

      // Update user wallets
      await prisma.user.update({
        where: { id: verdict.dispute.contract.freelancerId },
        data: { walletBalance: { increment: freelancerAmount } },
      });

      await prisma.user.update({
        where: { id: verdict.dispute.contract.clientId },
        data: { walletBalance: { increment: clientRefund } },
      });

      // Mark verdict as accepted
      await prisma.verdict.update({
        where: { id: req.params.id as string },
        data: { acceptedAt: new Date() },
      });

      // Resolve dispute
      await prisma.dispute.update({
        where: { id: verdict.disputeId },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });

      // Update contract
      await prisma.contract.update({
        where: { id: verdict.dispute.contractId },
        data: { status: "COMPLETED" },
      });

      const io = getIO();
      io.to(`dispute:${verdict.disputeId}`).emit("disputeStatusChange", {
        disputeId: verdict.disputeId,
        status: "RESOLVED",
      });

      res.json({
        success: true,
        data: {
          freelancerAmount,
          clientRefund,
          message: "Escrow split executed successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/verdicts/:id/escalate — Escalate to human review
router.post(
  "/:id/escalate",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verdict = await prisma.verdict.update({
        where: { id: req.params.id as string },
        data: { escalatedToHuman: true },
      });

      await prisma.dispute.update({
        where: { id: verdict.disputeId },
        data: { status: "ESCALATED" },
      });

      const io = getIO();
      io.to(`dispute:${verdict.disputeId}`).emit("disputeStatusChange", {
        disputeId: verdict.disputeId,
        status: "ESCALATED",
      });

      res.json({ success: true, data: verdict });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
