import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import * as admin from "firebase-admin";
import { requireAuthWithUser } from "../middleware/firebaseAuth";

const router: any = Router();

// Hardcoded admin credentials
const ADMIN_EMAIL = "sreyansusekharmohanty@gmail.com";
const ADMIN_PASSWORD = "Sreyansu@500";

// POST /api/auth/admin-login — Hardcoded admin sign-in
router.post(
  "/admin-login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        res.status(401).json({ success: false, error: "Invalid admin credentials" });
        return;
      }

      // Ensure admin user exists in Firebase
      let firebaseUid: string;
      try {
        const existingUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
        firebaseUid = existingUser.uid;
      } catch {
        // Create the Firebase user if it doesn't exist
        const newUser = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: "Platform Admin",
        });
        firebaseUid = newUser.uid;
      }

      // Ensure admin user exists in DB with ADMIN role
      await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: { role: "ADMIN" },
        create: {
          clerkId: firebaseUid,
          email: ADMIN_EMAIL,
          name: "Platform Admin",
          role: "ADMIN",
          walletBalance: 0,
        },
      });

      // Create a custom Firebase token for the admin
      const customToken = await admin.auth().createCustomToken(firebaseUid);

      res.json({ success: true, data: { token: customToken } });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/sync — Upsert Firebase user to database
router.post(
  "/sync",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, error: "Missing token" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decodedUser = await admin.auth().verifyIdToken(token);

      if (!decodedUser.email) {
        res.status(400).json({ success: false, error: "Token missing email" });
        return;
      }

      const { name, avatarUrl, role } = req.body;

      // Extract UID and treat it as clerkId (we'll keep the column name but store firebase uid)
      const firebaseUid = decodedUser.uid;

      const user = await prisma.user.upsert({
        where: { email: decodedUser.email },
        update: { 
          name: name || undefined,
          avatarUrl: avatarUrl || undefined,
        },
        create: {
          clerkId: firebaseUid, 
          email: decodedUser.email,
          name: name || decodedUser.name || "App User",
          role: role || "CLIENT",
          avatarUrl: avatarUrl || decodedUser.picture || null,
          walletBalance: 100000,
        },
      });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me — Get user profile securely
router.get(
  "/me",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // requireAuthWithUser already verified the token and attached dbUser
      res.json({ success: true, data: (req as any).dbUser });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/auth/make-admin — DEV ONLY: Promote current user to ADMIN
router.patch(
  "/make-admin",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).dbUser;
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
