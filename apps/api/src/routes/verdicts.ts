import { Router, Request, Response, NextFunction } from "express";
import { Verdict, Dispute, Contract, EscrowWallet, User } from "../models";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { getIO } from "../lib/socket";
import { createInAppNotification } from "../services/notificationService";

const router: any = Router();

// GET /api/verdicts/:disputeId — Get verdict for dispute
router.get(
  "/:disputeId",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const verdict = await Verdict.findOne({ disputeId: req.params.disputeId as string });

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
      const verdict: any = await Verdict.findById(req.params.id).populate({
        path: "dispute",
        populate: {
          path: "contract",
          populate: { path: "escrowWallet" },
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

      const wallet = verdict.dispute?.contract?.escrowWallet;
      if (!wallet) {
        res.status(400).json({ success: false, error: "No escrow wallet found" });
        return;
      }

      // Calculate splits
      const freelancerAmount = (wallet.heldAmount * verdict.freelancerReleasePercent) / 100;
      const clientRefund = (wallet.heldAmount * verdict.clientRefundPercent) / 100;

      // Execute escrow split
      await EscrowWallet.findByIdAndUpdate(wallet._id || wallet.id, {
        $set: {
          heldAmount: 0,
          status: "FULLY_RELEASED",
        },
        $inc: {
          releasedToFreelancer: freelancerAmount,
          refundedToClient: clientRefund,
        },
      });

      // Update user wallets
      const contract = verdict.dispute?.contract;
      if (contract?.freelancerId) {
        await User.findByIdAndUpdate(contract.freelancerId, {
          $inc: { walletBalance: freelancerAmount },
        });
      }

      if (contract?.clientId) {
        await User.findByIdAndUpdate(contract.clientId, {
          $inc: { walletBalance: clientRefund },
        });
      }

      // Mark verdict as accepted
      await Verdict.findByIdAndUpdate(req.params.id, {
        $set: { acceptedAt: new Date() },
      });

      // Resolve dispute
      const disputeIdStr = (verdict.disputeId || verdict.dispute?._id).toString();
      await Dispute.findByIdAndUpdate(disputeIdStr, {
        $set: { status: "RESOLVED", resolvedAt: new Date() },
      });

      // Update contract
      if (verdict.dispute?.contractId) {
        await Contract.findByIdAndUpdate(verdict.dispute.contractId, {
          $set: { status: "COMPLETED" },
        });
      }

      const io = getIO();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: "RESOLVED",
      });

      if (contract?.freelancerId) {
        createInAppNotification({
          recipientId: contract.freelancerId,
          type: "DISPUTE_RESOLVED",
          title: "Verdict Executed & Dispute Resolved",
          message: `Verdict accepted: ₹${freelancerAmount.toLocaleString("en-IN")} credited to your wallet.`,
          relatedEntity: { entityType: "Dispute", entityId: disputeIdStr },
          targetRoute: `/disputes/${disputeIdStr}`,
        }).catch(console.error);
      }
      if (contract?.clientId) {
        createInAppNotification({
          recipientId: contract.clientId,
          type: "DISPUTE_RESOLVED",
          title: "Verdict Executed & Dispute Resolved",
          message: `Verdict accepted: ₹${clientRefund.toLocaleString("en-IN")} refunded to your wallet.`,
          relatedEntity: { entityType: "Dispute", entityId: disputeIdStr },
          targetRoute: `/disputes/${disputeIdStr}`,
        }).catch(console.error);
      }

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
      const verdict = await Verdict.findByIdAndUpdate(
        req.params.id,
        { $set: { escalatedToHuman: true } },
        { new: true }
      );

      if (!verdict) {
        res.status(404).json({ success: false, error: "Verdict not found" });
        return;
      }

      const disputeIdStr = verdict.disputeId.toString();
      await Dispute.findByIdAndUpdate(disputeIdStr, {
        $set: { status: "ESCALATED" },
      });

      const io = getIO();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: "ESCALATED",
      });

      res.json({ success: true, data: verdict });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
