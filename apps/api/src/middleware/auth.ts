import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Global Clerk middleware — initializes Clerk for all routes
export { clerkMiddleware };

// Require authentication — rejects unauthenticated requests
export { requireAuth };

// Extended middleware: require auth + attach DB user to req
export async function requireAuthWithUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User profile not found. Please complete onboarding.",
      });
      return;
    }

    // Attach user to request
    (req as any).dbUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
