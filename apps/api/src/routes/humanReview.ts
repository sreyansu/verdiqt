import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { HumanReview, Dispute, Verdict, Contract, User } from "../models";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { getIO } from "../lib/socket";
import { createInAppNotification } from "../services/notificationService";

const router: any = Router();

const requestReviewSchema = z.object({
  requestReason: z.string().min(15, "Please provide at least 15 characters explaining why human review is requested."),
  reviewType: z.enum(["TECHNICAL", "EVIDENCE", "LEGAL", "FULL"]).default("FULL"),
});

const assignReviewerSchema = z.object({
  reviewerId: z.string(),
  conflictCheckStatus: z.enum(["CLEARED", "FLAGGED", "PENDING"]).default("CLEARED"),
});

const completeReviewSchema = z.object({
  reviewerFindings: z.string().min(20, "Findings must be at least 20 characters"),
  outcome: z.enum([
    "CONFIRM_RECOMMENDATION",
    "MODIFY_RECOMMENDATION",
    "REQUEST_MORE_EVIDENCE",
    "UNABLE_TO_DETERMINE",
    "RECOMMEND_NEGOTIATION",
  ]),
  modifiedRefundPercent: z.number().min(0).max(100).optional(),
  modifiedReleasePercent: z.number().min(0).max(100).optional(),
  outcomeReason: z.string().min(10, "Please provide rationale for the review outcome"),
  reviewerEvidenceReferences: z.array(z.string()).optional(),
});

// POST /api/disputes/:id/human-review — Either party can directly request human review (Section 13.B)
router.post(
  "/:id/human-review",
  requireAuthWithUser,
  validate(requestReviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();
      const { requestReason, reviewType } = req.body;

      const dispute: any = await Dispute.findById(req.params.id).populate("contract");
      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      const contract = dispute.contract;
      const isClient = contract?.clientId?.toString() === userId;
      const isFreelancer = contract?.freelancerId?.toString() === userId;
      const isAdmin = user.role === "ADMIN";

      if (!isClient && !isFreelancer && !isAdmin) {
        res.status(403).json({ success: false, error: "Only contract parties can request human review" });
        return;
      }

      // Existing active review check
      const existing = await HumanReview.findOne({
        disputeId: dispute._id,
        status: { $in: ["REQUESTED", "ASSIGNED", "IN_PROGRESS"] },
      });
      if (existing) {
        res.status(400).json({ success: false, error: "A human review is already pending or in progress for this dispute" });
        return;
      }

      const requestedByRole = isAdmin
        ? "ADMIN"
        : isClient
        ? "CLIENT"
        : "FREELANCER";

      // 1. Create HumanReview record
      const review = await HumanReview.create({
        disputeId: dispute._id,
        sourceAnalysisRunId: dispute.activeAnalysisRunId || null,
        reviewVersion: (dispute.version || 1),
        requestedBy: user._id || user.id,
        requestedByRole,
        requestReason,
        reviewType,
        status: "REQUESTED",
        conflictCheckStatus: "PENDING",
      });

      // 2. Freeze dispute settlement execution (Section 13.B)
      await Dispute.findByIdAndUpdate(dispute._id, {
        $set: {
          status: "ESCALATED",
          humanReviewRequested: true,
          humanReviewId: review._id,
        },
        $push: {
          auditTrail: {
            action: "PARTY_REQUESTED_HUMAN_REVIEW",
            actorId: userId,
            actorRole: requestedByRole,
            timestamp: new Date(),
            details: { reviewId: review._id.toString(), reviewType, requestReason },
          },
        },
      });

      // 3. Emit realtime socket update
      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: "ESCALATED",
        humanReviewRequested: true,
      });

      // 4. Notify other party and administrators
      const respondentId = isClient ? contract.freelancerId : contract.clientId;
      if (respondentId) {
        createInAppNotification({
          recipientId: respondentId,
          type: "DISPUTE_ESCALATED",
          title: "Human Review Requested",
          message: `${user.name} has requested independent human review for dispute "${dispute.title}". Automated settlement is paused.`,
          relatedEntity: { entityType: "Dispute", entityId: disputeIdStr },
          targetRoute: `/disputes/${disputeIdStr}`,
        }).catch(console.error);
      }

      res.status(201).json({
        success: true,
        data: review,
        message: "Independent human review initiated. Settlement execution is safely paused pending qualified reviewer findings.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/disputes/:id/human-review — List human reviews for dispute
router.get(
  "/:id/human-review",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviews = await HumanReview.find({ disputeId: req.params.id })
        .populate("reviewer", "name email role")
        .populate("requestedBy", "name email role")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/human-review/:id/assign — Assign reviewer & record conflict clearance (Section 13.C)
router.patch(
  "/assign/:id",
  requireAuthWithUser,
  validate(assignReviewerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUser = (req as any).dbUser;
      if (adminUser.role !== "ADMIN") {
        res.status(403).json({ success: false, error: "Only administrators can assign dispute reviewers" });
        return;
      }

      const { reviewerId, conflictCheckStatus } = req.body;
      const reviewer = await User.findById(reviewerId);
      if (!reviewer) {
        res.status(404).json({ success: false, error: "Reviewer user not found" });
        return;
      }

      const review: any = await HumanReview.findById(req.params.id);
      if (!review) {
        res.status(404).json({ success: false, error: "Review record not found" });
        return;
      }

      const updated = await HumanReview.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            reviewerId: reviewer._id,
            reviewerName: reviewer.name,
            conflictCheckStatus,
            status: "IN_PROGRESS",
          },
        },
        { new: true }
      );

      // Audit log on dispute
      await Dispute.findByIdAndUpdate(review.disputeId, {
        $push: {
          auditTrail: {
            action: "REVIEWER_ASSIGNED",
            actorId: adminUser._id || adminUser.id,
            actorRole: "ADMIN",
            timestamp: new Date(),
            details: { reviewerId, reviewerName: reviewer.name, conflictCheckStatus },
          },
        },
      });

      res.json({ success: true, data: updated, message: `Reviewer ${reviewer.name} assigned with status ${conflictCheckStatus}` });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/human-review/:id/complete — Reviewer submits findings and versioned outcome (Section 13)
router.patch(
  "/complete/:id",
  requireAuthWithUser,
  validate(completeReviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const userId = (user._id || user.id).toString();
      const {
        reviewerFindings,
        outcome,
        modifiedRefundPercent,
        modifiedReleasePercent,
        outcomeReason,
        reviewerEvidenceReferences,
      } = req.body;

      const review: any = await HumanReview.findById(req.params.id);
      if (!review) {
        res.status(404).json({ success: false, error: "Human review record not found" });
        return;
      }

      // Invariant check if modification provided
      if (outcome === "MODIFY_RECOMMENDATION") {
        if (
          modifiedRefundPercent === undefined ||
          modifiedReleasePercent === undefined ||
          modifiedRefundPercent + modifiedReleasePercent !== 100
        ) {
          res.status(400).json({
            success: false,
            error: "Modified allocations must both be provided and sum exactly to 100%",
          });
          return;
        }
      }

      const updatedReview = await HumanReview.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "COMPLETED",
            reviewerFindings,
            outcome,
            modifiedRefundPercent: modifiedRefundPercent ?? null,
            modifiedReleasePercent: modifiedReleasePercent ?? null,
            outcomeReason,
            reviewerEvidenceReferences: reviewerEvidenceReferences || [],
            completedAt: new Date(),
          },
        },
        { new: true }
      );

      // Update Verdict if modified or confirmed
      const disputeId = review.disputeId;
      const dispute: any = await Dispute.findById(disputeId);

      let nextDisputeStatus = "VERDICT_READY";

      if (outcome === "CONFIRM_RECOMMENDATION") {
        await Verdict.findOneAndUpdate(
          { disputeId },
          {
            $set: {
              escalatedToHuman: false,
              escalationReason: "Confirmed by independent human reviewer.",
            },
          }
        );
      } else if (outcome === "MODIFY_RECOMMENDATION") {
        await Verdict.findOneAndUpdate(
          { disputeId },
          {
            $set: {
              clientRefundPercent: modifiedRefundPercent,
              freelancerReleasePercent: modifiedReleasePercent,
              clientFaultPercent: modifiedRefundPercent,
              freelancerFaultPercent: modifiedReleasePercent,
              escalatedToHuman: false,
              reasoning: `[HUMAN REVIEWER DETERMINATION]: ${reviewerFindings}\n\nRationale: ${outcomeReason}`,
            },
          }
        );
      } else if (outcome === "REQUEST_MORE_EVIDENCE") {
        nextDisputeStatus = "EVIDENCE_COLLECTION";
        await Dispute.findByIdAndUpdate(disputeId, {
          $set: { clientReady: false, freelancerReady: false },
        });
      }

      await Dispute.findByIdAndUpdate(disputeId, {
        $set: {
          status: nextDisputeStatus,
          humanReviewRequested: false,
        },
        $push: {
          auditTrail: {
            action: "HUMAN_REVIEW_COMPLETED",
            actorId: userId,
            actorRole: user.role,
            timestamp: new Date(),
            details: { outcome, outcomeReason },
          },
        },
      });

      const io = getIO();
      const disputeIdStr = disputeId.toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: nextDisputeStatus,
        reviewOutcome: outcome,
      });

      res.json({
        success: true,
        data: updatedReview,
        message: "Human review outcome recorded successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

