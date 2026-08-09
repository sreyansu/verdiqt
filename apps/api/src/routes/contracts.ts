import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Contract, Milestone, EscrowWallet, User } from "../models";
import { requireAuthWithUser } from "../middleware/firebaseAuth";
import { validate } from "../middleware/validate";

const router: any = Router();

// Accept any ISO 8601 datetime string (with or without milliseconds/offset)
const isoDatetime = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid datetime string" }
);

const createContractSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  totalAmount: z.number().positive(),
  currency: z.string().default("INR"),
  startDate: isoDatetime,
  endDate: isoDatetime,
  freelancerEmail: z.string().email(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        amount: z.number().positive(),
        dueDate: isoDatetime,
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
      const userId = user._id || user.id;

      const contracts = await Contract.find({
        $or: [{ clientId: userId }, { freelancerId: userId }],
      })
        .populate("client")
        .populate("freelancer")
        .populate("milestones")
        .populate("escrowWallet")
        .sort({ createdAt: -1 });

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
      const freelancer = await User.findOne({ email: freelancerEmail.toLowerCase() });

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

      const userId = user._id || user.id;
      const freelancerId = freelancer._id || freelancer.id;

      const contract = await Contract.create({
        title,
        description,
        totalAmount,
        currency,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        clientId: userId,
        freelancerId: freelancerId,
      });

      if (milestones && milestones.length > 0) {
        await Milestone.insertMany(
          milestones.map((m: any) => ({
            contractId: contract._id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            dueDate: new Date(m.dueDate),
          }))
        );
      }

      const populatedContract = await Contract.findById(contract._id)
        .populate("client")
        .populate("freelancer")
        .populate("milestones");

      res.status(201).json({ success: true, data: populatedContract });
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
      const contract = await Contract.findById(req.params.id)
        .populate("client")
        .populate("freelancer")
        .populate({ path: "milestones", options: { sort: { dueDate: 1 } } })
        .populate("escrowWallet")
        .populate({
          path: "dispute",
          populate: { path: "verdict" },
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
      const existing = await Contract.findById(req.params.id);

      if (!existing) {
        res.status(404).json({ success: false, error: "Contract not found" });
        return;
      }

      if (existing.status !== "DRAFT") {
        res.status(400).json({ success: false, error: "Can only edit draft contracts" });
        return;
      }

      const updated = await Contract.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).populate("milestones");

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
      const userId = (user._id || user.id).toString();

      const contract = await Contract.findById(req.params.id);

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
        if (userId !== contract.freelancerId.toString()) {
          res.status(403).json({ success: false, error: "Only the assigned freelancer can accept and activate the contract" });
          return;
        }
      }

      if (status === "CANCELLED" && contract.status === "DRAFT") {
        if (userId !== contract.clientId.toString()) {
          res.status(403).json({ success: false, error: "Only the client can cancel a draft contract" });
          return;
        }
      }

      // Auto-create escrow wallet on activation
      if (status === "ACTIVE") {
        await EscrowWallet.findOneAndUpdate(
          { contractId: contract._id },
          {
            $setOnInsert: {
              contractId: contract._id,
              totalAmount: contract.totalAmount,
              heldAmount: contract.totalAmount,
            },
          },
          { upsert: true, new: true }
        );

        // Deduct from client wallet
        await User.findByIdAndUpdate(contract.clientId, {
          $inc: { walletBalance: -contract.totalAmount },
        });
      }

      const updated = await Contract.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      )
        .populate("milestones")
        .populate("escrowWallet");

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
