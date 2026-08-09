import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/User";
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
      await User.findOneAndUpdate(
        { email: ADMIN_EMAIL.toLowerCase() },
        {
          $set: {
            role: "ADMIN",
          },
          $setOnInsert: {
            clerkId: firebaseUid,
            email: ADMIN_EMAIL.toLowerCase(),
            name: "Platform Admin",
            walletBalance: 0,
          },
        },
        { upsert: true, new: true }
      );

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

      const updateDoc: any = {};
      if (name) updateDoc.name = name;
      if (avatarUrl) updateDoc.avatarUrl = avatarUrl;

      const setOnInsertDoc: any = {
        clerkId: firebaseUid,
        email: decodedUser.email.toLowerCase(),
        role: role || "CLIENT",
        walletBalance: 100000,
      };

      if (!name) {
        setOnInsertDoc.name = decodedUser.name || "App User";
      }
      if (!avatarUrl) {
        setOnInsertDoc.avatarUrl = (decodedUser as any).picture || null;
      }

      const updateQuery: any = {
        $setOnInsert: setOnInsertDoc,
      };

      if (Object.keys(updateDoc).length > 0) {
        updateQuery.$set = updateDoc;
      }

      const user = await User.findOneAndUpdate(
        { email: decodedUser.email.toLowerCase() },
        updateQuery,
        { upsert: true, new: true }
      );

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
      const updated = await User.findByIdAndUpdate(
        user._id || user.id,
        { role: "ADMIN" },
        { new: true }
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
