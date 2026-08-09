import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Dispute, Contract, EscrowWallet, Verdict } from "../models";
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
      const userId = user._id || user.id;

      const userContracts = await Contract.find({
        $or: [{ clientId: userId }, { freelancerId: userId }],
      }).select("_id");
      const contractIds = userContracts.map((c) => c._id);

      const disputes = await Dispute.find({
        contractId: { $in: contractIds },
      })
        .populate({
          path: "contract",
          populate: [{ path: "client" }, { path: "freelancer" }],
        })
        .populate("raisedBy")
        .populate("verdict")
        .sort({ createdAt: -1 });

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
      const userId = user._id || user.id;
      const { contractId, title, statement } = req.body;

      // Check contract exists and is active
      const contract: any = await Contract.findById(contractId).populate("dispute");

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

      const isClient = contract.clientId.toString() === userId.toString();

      // Create dispute + freeze escrow + update contract status
      const dispute = await Dispute.create({
        contractId,
        raisedById: userId,
        title,
        clientStatement: isClient ? statement : null,
        freelancerStatement: !isClient ? statement : null,
        status: "OPEN",
      });

      // Freeze escrow
      await EscrowWallet.findOneAndUpdate(
        { contractId },
        { status: "FROZEN" }
      );

      // Update contract status
      await Contract.findByIdAndUpdate(contractId, { status: "DISPUTED" });

      const populatedDispute = await Dispute.findById(dispute._id)
        .populate({
          path: "contract",
          populate: [{ path: "client" }, { path: "freelancer" }],
        })
        .populate("raisedBy");

      res.status(201).json({ success: true, data: populatedDispute });
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
      const dispute = await Dispute.findById(req.params.id)
        .populate({
          path: "contract",
          populate: [
            { path: "client" },
            { path: "freelancer" },
            { path: "milestones", options: { sort: { dueDate: 1 } } },
            { path: "escrowWallet" },
          ],
        })
        .populate("raisedBy")
        .populate({
          path: "evidence",
          populate: { path: "uploadedBy" },
          options: { sort: { createdAt: -1 } },
        })
        .populate("verdict");

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
      const userId = (user._id || user.id).toString();
      const { statement } = req.body;

      const dispute: any = await Dispute.findById(req.params.id).populate("contract");

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      const contract = dispute.contract;
      const isClient = contract?.clientId?.toString() === userId;
      const isFreelancer = contract?.freelancerId?.toString() === userId;

      if (!isClient && !isFreelancer) {
        res.status(403).json({ success: false, error: "Only contract parties can respond" });
        return;
      }

      // Prevent the party who raised the dispute from responding to it
      if (dispute.raisedById?.toString() === userId) {
        res.status(400).json({ success: false, error: "You cannot respond to your own dispute" });
        return;
      }

      const updated = await Dispute.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            ...(isClient ? { clientStatement: statement } : { freelancerStatement: statement }),
            status: "EVIDENCE_COLLECTION",
          },
        },
        { new: true }
      );

      // Emit realtime update
      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
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
      const userId = (user._id || user.id).toString();
      const { challengeReason } = req.body;

      if (!challengeReason || challengeReason.length < 20) {
        res.status(400).json({
          success: false,
          error: "Challenge reason must be at least 20 characters",
        });
        return;
      }

      const dispute: any = await Dispute.findById(req.params.id)
        .populate("contract")
        .populate("verdict");

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      // Only parties to the contract can challenge
      const isClient = dispute.contract?.clientId?.toString() === userId;
      const isFreelancer = dispute.contract?.freelancerId?.toString() === userId;
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

      if (!dispute.verdict) {
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
      await Verdict.findOneAndDelete({ disputeId: dispute._id });

      // Update dispute
      const updated = await Dispute.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "CHALLENGED",
            challengeReason,
            challengedById: user._id || user.id,
          },
          $inc: { challengeCount: 1 },
        },
        { new: true }
      );

      // Emit realtime update
      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
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
      const userId = (user._id || user.id).toString();

      const dispute: any = await Dispute.findById(req.params.id).populate("contract");

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      // Only parties to the contract can mark ready
      const isClient = dispute.contract?.clientId?.toString() === userId;
      const isFreelancer = dispute.contract?.freelancerId?.toString() === userId;
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

      const updated = await Dispute.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );

      // Emit realtime update
      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      if (otherReady) {
        // Both ready — notify everyone including admin
        io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
          disputeId: disputeIdStr,
          status: "AWAITING_AI",
        });
        io.emit("adminNotification", {
          type: "DISPUTE_READY_FOR_AI",
          disputeId: disputeIdStr,
          message: `Dispute "${dispute.title}" is ready for AI analysis — both parties have submitted evidence.`,
        });
      } else {
        // One party ready — notify the dispute room
        io.to(`dispute:${disputeIdStr}`).emit("disputeReadyUpdate", {
          disputeId: disputeIdStr,
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

