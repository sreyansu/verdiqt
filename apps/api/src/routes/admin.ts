import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuthWithUser, requireAdmin } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";
import { getIO } from "../lib/socket";

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuthWithUser, requireAdmin);

// GET /api/admin/stats — Admin dashboard stats
router.get(
  "/stats",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [totalDisputes, escalated, openDisputes, resolved] =
        await Promise.all([
          prisma.dispute.count(),
          prisma.dispute.count({ where: { status: "ESCALATED" } }),
          prisma.dispute.count({
            where: {
              status: { in: ["OPEN", "EVIDENCE_COLLECTION", "AI_ANALYZING", "VERDICT_READY"] },
            },
          }),
          prisma.dispute.count({ where: { status: "RESOLVED" } }),
        ]);

      res.json({
        success: true,
        data: { totalDisputes, escalated, openDisputes, resolved },
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

      const where = statusFilter ? { status: statusFilter } : {};

      const disputes = await prisma.dispute.findMany({
        where,
        include: {
          contract: { include: { client: true, freelancer: true, escrowWallet: true } },
          raisedBy: true,
          evidence: true,
          verdict: true,
        },
        orderBy: [
          // ESCALATED disputes bubble to the top via manual sort below
          { createdAt: "desc" },
        ],
      });

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

      const dispute = await prisma.dispute.findUnique({
        where: { id: req.params.id },
        include: {
          contract: { include: { escrowWallet: true } },
          verdict: true,
        },
      });

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      if (dispute.status === "RESOLVED") {
        res.status(400).json({ success: false, error: "Dispute is already resolved" });
        return;
      }

      const wallet = dispute.contract.escrowWallet;
      if (!wallet) {
        res.status(400).json({ success: false, error: "No escrow wallet found" });
        return;
      }

      // Calculate amounts
      const freelancerAmount = (wallet.heldAmount * freelancerReleasePercent) / 100;
      const clientRefund = (wallet.heldAmount * clientRefundPercent) / 100;

      // Create or update the verdict (admin override)
      if (dispute.verdict) {
        await prisma.verdict.update({
          where: { id: dispute.verdict.id },
          data: {
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
        });
      } else {
        await prisma.verdict.create({
          data: {
            disputeId: dispute.id,
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
        });
      }

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

      // Credit user wallets
      await prisma.user.update({
        where: { id: dispute.contract.freelancerId },
        data: { walletBalance: { increment: freelancerAmount } },
      });

      await prisma.user.update({
        where: { id: dispute.contract.clientId },
        data: { walletBalance: { increment: clientRefund } },
      });

      // Update dispute + contract status
      await prisma.dispute.update({
        where: { id: req.params.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });

      await prisma.contract.update({
        where: { id: dispute.contractId },
        data: { status: "COMPLETED" },
      });

      // Emit realtime update
      const io = getIO();
      io.to(`dispute:${dispute.id}`).emit("disputeStatusChange", {
        disputeId: dispute.id,
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

      const where: any = { role: { not: "ADMIN" } };
      if (roleFilter && ["CLIENT", "FREELANCER"].includes(roleFilter)) {
        where.role = roleFilter;
      }

      const users = await prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              clientContracts: true,
              freelancerContracts: true,
              raisedDisputes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
