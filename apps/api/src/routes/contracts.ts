import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";

const router = Router();

const createContractSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  totalAmount: z.number().positive(),
  currency: z.string().default("INR"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  freelancerEmail: z.string().email(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        amount: z.number().positive(),
        dueDate: z.string().datetime(),
      })
    )
    .min(1),
});

// GET /api/contracts — List contracts for authenticated user
router.get(
  "/",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;

      const contracts = await prisma.contract.findMany({
        where: {
          OR: [{ clientId: user.id }, { freelancerId: user.id }],
        },
        include: {
          client: true,
          freelancer: true,
          milestones: true,
          escrowWallet: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({ success: true, data: contracts });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/contracts — Create new contract
router.post(
  "/",
  requireAuthWithUser,
  validate(createContractSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;

      if (user.role !== "CLIENT") {
        res.status(403).json({ success: false, error: "Only clients can create contracts" });
        return;
      }

      const { title, description, totalAmount, currency, startDate, endDate, freelancerEmail, milestones } = req.body;

      // Find freelancer
      const freelancer = await prisma.user.findUnique({
        where: { email: freelancerEmail },
      });

      if (!freelancer) {
        res.status(404).json({ success: false, error: "Freelancer not found" });
        return;
      }

      // Validate milestone amounts sum
      const milestoneSum = milestones.reduce((sum: number, m: any) => sum + m.amount, 0);
      if (Math.abs(milestoneSum - totalAmount) > 0.01) {
        res.status(400).json({
          success: false,
          error: `Milestone amounts (₹${milestoneSum}) must equal total amount (₹${totalAmount})`,
        });
        return;
      }

      const contract = await prisma.contract.create({
        data: {
          title,
          description,
          totalAmount,
          currency,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          clientId: user.id,
          freelancerId: freelancer.id,
          milestones: {
            create: milestones.map((m: any) => ({
              title: m.title,
              description: m.description,
              amount: m.amount,
              dueDate: new Date(m.dueDate),
            })),
          },
        },
        include: {
          milestones: true,
          client: true,
          freelancer: true,
        },
      });

      res.status(201).json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/contracts/:id — Get contract detail
router.get(
  "/:id",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id: req.params.id },
        include: {
          client: true,
          freelancer: true,
          milestones: { orderBy: { dueDate: "asc" } },
          escrowWallet: true,
          dispute: { include: { verdict: true } },
        },
      });

      if (!contract) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/contracts/:id — Update contract (DRAFT only)
router.put(
  "/:id",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.contract.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      if (existing.status !== "DRAFT") {
        res.status(400).json({ success: false, error: "Can only edit draft contracts" });
        return;
      }

      const updated = await prisma.contract.update({
        where: { id: req.params.id },
        data: req.body,
        include: { milestones: true },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/contracts/:id/status — Activate / complete / cancel
router.patch(
  "/:id/status",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const user = (req as any).dbUser;

      const contract = await prisma.contract.findUnique({
        where: { id: req.params.id },
      });

      if (!contract) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["ACTIVE", "CANCELLED"],
        ACTIVE: ["COMPLETED", "DISPUTED", "CANCELLED"],
        DISPUTED: ["ACTIVE", "CANCELLED"],
      };

      if (!validTransitions[contract.status]?.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Cannot transition from ${contract.status} to ${status}`,
        });
        return;
      }

      // Authorization checks for transitions
      if (status === "ACTIVE" && contract.status === "DRAFT") {
        if (user.id !== contract.freelancerId) {
          res.status(403).json({ success: false, error: "Only the assigned freelancer can accept and activate the contract" });
          return;
        }
      }

      if (status === "CANCELLED" && contract.status === "DRAFT") {
        if (user.id !== contract.clientId) {
          res.status(403).json({ success: false, error: "Only the client can cancel a draft contract" });
          return;
        }
      }

      // Auto-create escrow wallet on activation
      if (status === "ACTIVE") {
        await prisma.escrowWallet.create({
          data: {
            contractId: contract.id,
            totalAmount: contract.totalAmount,
            heldAmount: contract.totalAmount,
          },
        });

        // Deduct from client wallet
        await prisma.user.update({
          where: { id: contract.clientId },
          data: { walletBalance: { decrement: contract.totalAmount } },
        });
      }

      const updated = await prisma.contract.update({
        where: { id: req.params.id },
        data: { status },
        include: { milestones: true, escrowWallet: true },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
