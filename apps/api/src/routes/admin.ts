import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Dispute, Contract, EscrowWallet, User, Verdict, Milestone } from "../models";
import { requireAuthWithUser, requireAdmin } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { getIO } from "../lib/socket";
import { runMediationEngine } from "../services/mediationEngine";

const router: any = Router();

// All admin routes require authentication + admin role
router.use(requireAuthWithUser, requireAdmin);

// GET /api/admin/stats — Admin dashboard stats
router.get(
  "/stats",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [totalDisputes, escalated, openDisputes, resolved, awaitingAI, challenged] =
        await Promise.all([
          Dispute.countDocuments(),
          Dispute.countDocuments({ status: "ESCALATED" }),
          Dispute.countDocuments({
            status: { $in: ["OPEN", "EVIDENCE_COLLECTION", "AI_ANALYZING", "VERDICT_READY"] },
          }),
          Dispute.countDocuments({ status: "RESOLVED" }),
          Dispute.countDocuments({ status: "AWAITING_AI" }),
          Dispute.countDocuments({ status: "CHALLENGED" }),
        ]);

      res.json({
        success: true,
        data: { totalDisputes, escalated, openDisputes, resolved, awaitingAI, challenged },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/disputes — List all disputes (escalated first)
router.get(
  "/disputes",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      const where: any = statusFilter ? { status: statusFilter } : {};

      const disputes = await Dispute.find(where)
        .populate({
          path: "contract",
          populate: [{ path: "client" }, { path: "freelancer" }, { path: "escrowWallet" }],
        })
        .populate("raisedBy")
        .populate("evidence")
        .populate("verdict")
        .sort({ createdAt: -1 });

      // Sort: ESCALATED first, then by createdAt desc
      const sorted = disputes.sort((a, b) => {
        if (a.status === "ESCALATED" && b.status !== "ESCALATED") return -1;
        if (a.status !== "ESCALATED" && b.status === "ESCALATED") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json({ success: true, data: sorted });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/disputes/:id — Get full dispute details for admin review
router.get(
  "/disputes/:id",
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

const resolveSchema = z.object({
  clientRefundPercent: z.number().min(0).max(100),
  freelancerReleasePercent: z.number().min(0).max(100),
  reasoning: z.string().min(10),
});

// POST /api/admin/disputes/:id/resolve — Admin manually resolves a dispute
router.post(
  "/disputes/:id/resolve",
  validate(resolveSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUser = (req as any).dbUser;
      const { clientRefundPercent, freelancerReleasePercent, reasoning } = req.body;

      // Validate percentages sum to 100
      if (clientRefundPercent + freelancerReleasePercent !== 100) {
        res.status(400).json({
          success: false,
          error: "clientRefundPercent + freelancerReleasePercent must equal 100",
        });
        return;
      }

      const dispute: any = await Dispute.findById(req.params.id)
        .populate({
          path: "contract",
          populate: { path: "escrowWallet" },
        })
        .populate("verdict");

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      if (dispute.status === "RESOLVED") {
        res.status(400).json({ success: false, error: "Dispute is already resolved" });
        return;
      }

      const wallet = dispute.contract?.escrowWallet;
      if (!wallet) {
        res.status(400).json({ success: false, error: "No escrow wallet found" });
        return;
      }

      // Calculate amounts
      const freelancerAmount = (wallet.heldAmount * freelancerReleasePercent) / 100;
      const clientRefund = (wallet.heldAmount * clientRefundPercent) / 100;

      // Create or update the verdict (admin override)
      await Verdict.findOneAndUpdate(
        { disputeId: dispute._id },
        {
          $set: {
            disputeId: dispute._id,
            clientFaultPercent: clientRefundPercent,
            freelancerFaultPercent: freelancerReleasePercent,
            clientRefundPercent,
            freelancerReleasePercent,
            reasoning,
            contractAnalysis: "Resolved by platform administrator.",
            evidenceSummary: "Admin manual review.",
            confidenceScore: 1.0,
            escalatedToHuman: false,
            modelUsed: `admin:${adminUser.email}`,
            acceptedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

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

      // Credit user wallets
      if (dispute.contract?.freelancerId) {
        await User.findByIdAndUpdate(dispute.contract.freelancerId, {
          $inc: { walletBalance: freelancerAmount },
        });
      }

      if (dispute.contract?.clientId) {
        await User.findByIdAndUpdate(dispute.contract.clientId, {
          $inc: { walletBalance: clientRefund },
        });
      }

      // Update dispute + contract status
      await Dispute.findByIdAndUpdate(req.params.id, {
        $set: { status: "RESOLVED", resolvedAt: new Date() },
      });

      if (dispute.contractId) {
        await Contract.findByIdAndUpdate(dispute.contractId, {
          $set: { status: "COMPLETED" },
        });
      }

      // Emit realtime update
      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: "RESOLVED",
      });

      res.json({
        success: true,
        data: {
          freelancerAmount,
          clientRefund,
          message: "Dispute resolved by admin. Escrow funds distributed.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/users — List all platform users (clients & freelancers)
router.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleFilter = req.query.role as string | undefined;

      const where: any = { role: { $ne: "ADMIN" } };
      if (roleFilter && ["CLIENT", "FREELANCER"].includes(roleFilter)) {
        where.role = roleFilter;
      }

      const users = await User.find(where).sort({ createdAt: -1 });
      const userIds = users.map((u) => u._id);

      const [clientContractCounts, freelancerContractCounts, disputeCounts] = await Promise.all([
        Contract.aggregate([
          { $match: { clientId: { $in: userIds } } },
          { $group: { _id: "$clientId", count: { $sum: 1 } } },
        ]),
        Contract.aggregate([
          { $match: { freelancerId: { $in: userIds } } },
          { $group: { _id: "$freelancerId", count: { $sum: 1 } } },
        ]),
        Dispute.aggregate([
          { $match: { raisedById: { $in: userIds } } },
          { $group: { _id: "$raisedById", count: { $sum: 1 } } },
        ]),
      ]);

      const ccMap = Object.fromEntries(clientContractCounts.map((c) => [c._id.toString(), c.count]));
      const fcMap = Object.fromEntries(freelancerContractCounts.map((c) => [c._id.toString(), c.count]));
      const dMap = Object.fromEntries(disputeCounts.map((c) => [c._id.toString(), c.count]));

      const formattedUsers = users.map((u) => {
        const uObj: any = u.toJSON();
        uObj._count = {
          clientContracts: ccMap[u._id.toString()] || 0,
          freelancerContracts: fcMap[u._id.toString()] || 0,
          raisedDisputes: dMap[u._id.toString()] || 0,
        };
        return uObj;
      });

      res.json({ success: true, data: formattedUsers });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/admin/disputes/:id/analyze — Admin triggers AI mediation
router.post(
  "/disputes/:id/analyze",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dispute: any = await Dispute.findById(req.params.id)
        .populate({
          path: "contract",
          populate: { path: "milestones" },
        })
        .populate("evidence");

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

      // Cannot analyze if already analyzing
      if (dispute.status === "AI_ANALYZING") {
        res.status(400).json({
          success: false,
          error: "AI analysis is already in progress",
        });
        return;
      }

      // Update status to analyzing
      await Dispute.findByIdAndUpdate(req.params.id, {
        $set: { status: "AI_ANALYZING" },
      });

      const io = getIO();
      const disputeIdStr = (dispute._id || dispute.id).toString();
      io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
        disputeId: disputeIdStr,
        status: "AI_ANALYZING",
      });

      // Delete any existing verdict (re-analysis or seeded data)
      await Verdict.findOneAndDelete({ disputeId: dispute._id });

      // Build challenge context if re-analyzing after a challenge
      const challengeCtx = dispute.challengeCount > 0 && dispute.challengeReason
        ? { reason: dispute.challengeReason, count: dispute.challengeCount }
        : undefined;

      // Run AI mediation
      try {
        const contract = dispute.contract || {};
        const milestones = contract.milestones || [];
        const evidence = dispute.evidence || [];

        const verdict = await runMediationEngine(
          {
            contractTitle: contract.title || "",
            contractDescription: contract.description || "",
            totalAmount: contract.totalAmount || 0,
            milestones: milestones.map((m: any) => ({
              title: m.title,
              description: m.description,
              amount: m.amount,
              status: m.status,
              dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : "",
            })),
            clientStatement: dispute.clientStatement || "",
            freelancerStatement: dispute.freelancerStatement || "",
            evidenceItems: evidence.map((e: any) => ({
              id: (e._id || e.id).toString(),
              fileName: e.fileName,
              fileUrl: e.fileUrl,
              fileType: e.fileType,
              description: e.description,
              uploadedByRole: e.uploadedById?.toString() === contract.clientId?.toString() ? "CLIENT" : "FREELANCER",
            })),
            evidenceSummaries: evidence.map(
              (e: any) => `${e.fileName} (${e.fileType}): ${e.description || "No description"}`
            ),
            disputeTitle: dispute.title,
          },
          challengeCtx
        );

        // Save verdict
        const savedVerdict = await Verdict.create({
          disputeId: dispute._id,
          clientFaultPercent: verdict.clientFaultPercent,
          freelancerFaultPercent: verdict.freelancerFaultPercent,
          clientRefundPercent: verdict.clientRefundPercent,
          freelancerReleasePercent: verdict.freelancerReleasePercent,
          reasoning: verdict.reasoning,
          contractAnalysis: verdict.contractAnalysis,
          evidenceSummary: verdict.evidenceSummary,
          legalBasis: verdict.legalBasis,
          escalationReason: verdict.escalationReason,
          confidenceScore: verdict.confidenceScore,
          escalatedToHuman: verdict.escalatedToHuman,
          clientAdvocateReport: verdict.clientAdvocateReport,
          freelancerDefenseReport: verdict.freelancerDefenseReport,
          forensicAuditReport: verdict.forensicAuditReport,
          quantumMeruitCalculation: verdict.quantumMeruitCalculation as any,
          awardHash: verdict.awardHash,
          modelUsed: "gemini-2.5-flash (Multi-Agent ODR)",
        });

        // Update dispute status
        await Dispute.findByIdAndUpdate(req.params.id, {
          $set: { status: "VERDICT_READY" },
        });

        io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
          disputeId: disputeIdStr,
          status: "VERDICT_READY",
        });

        res.json({ success: true, data: savedVerdict });
      } catch (mediationError: any) {
        console.error("AI Mediation Engine failed:", mediationError);

        // Fallback to ESCALATED status
        await Dispute.findByIdAndUpdate(req.params.id, {
          $set: { status: "ESCALATED" },
        });

        io.to(`dispute:${disputeIdStr}`).emit("disputeStatusChange", {
          disputeId: disputeIdStr,
          status: "ESCALATED",
        });

        res.status(500).json({
          success: false,
          error: "AI Mediation failed. The dispute has been escalated for human review.",
          details: mediationError.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
