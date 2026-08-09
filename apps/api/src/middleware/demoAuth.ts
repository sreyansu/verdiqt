import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

/**
 * Demo-mode middleware: skips Clerk auth entirely.
 * Finds or creates a demo user and attaches it to req.dbUser.
 */
export async function demoAuthWithUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Find or create a demo user
    let user = await User.findOne({ email: "demo@verdiqt.app" });

    if (!user) {
      user = await User.create({
        clerkId: "demo-001",
        email: "demo@verdiqt.app",
        name: "Demo User",
        role: "CLIENT",
        walletBalance: 100000,
      });
    }

    (req as any).dbUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
