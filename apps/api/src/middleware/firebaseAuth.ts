import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { User } from "../models/User";

export function initFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
      } else {
        console.warn("WARNING: Firebase Admin SDK requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_BASE64 to be set in .env");
        admin.initializeApp(); // fallback attempt
      }
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
    }
  }
}

/**
 * Validates a Firebase ID Token and maps it to a database user.
 */
/**
 * Middleware that requires the authenticated user to have ADMIN role.
 * Must be used AFTER requireAuthWithUser in the middleware chain.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).dbUser;
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
};

/**
 * Validates a Firebase ID Token without requiring the user document to exist in MongoDB.
 * Required for registration, initial profile sync, and onboarding bootstrap endpoints.
 */
export const requireFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (typeof req.query.token === "string" && req.query.token.trim()) {
      token = req.query.token.trim();
    }

    if (!token) {
      res.status(401).json({ success: false, error: "Missing or invalid authorization credentials" });
      return;
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      res.status(401).json({ success: false, error: "Invalid Firebase ID token. " + String(err) });
      return;
    }

    if (!decodedToken.email) {
      res.status(400).json({ success: false, error: "Token missing email" });
      return;
    }

    (req as any).firebaseUser = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuthWithUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (typeof req.query.token === "string" && req.query.token.trim()) {
      token = req.query.token.trim();
    }

    if (!token) {
      res.status(401).json({ success: false, error: "Missing or invalid authorization credentials" });
      return;
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      res.status(401).json({ success: false, error: "Invalid Firebase ID token. " + String(err) });
      return;
    }

    if (!decodedToken.email) {
      res.status(400).json({ success: false, error: "Token missing email" });
      return;
    }

    let user = await User.findOne({ email: decodedToken.email.toLowerCase() });

    if (!user) {
      // If hitting /auth/me or bootstrapping, auto-provision from valid Firebase credentials
      if (req.originalUrl?.includes("/api/auth/me")) {
        try {
          user = await User.findOneAndUpdate(
            { email: decodedToken.email.toLowerCase() },
            {
              $setOnInsert: {
                clerkId: decodedToken.uid,
                email: decodedToken.email.toLowerCase(),
                name: decodedToken.name || decodedToken.email.split("@")[0] || "User",
                avatarUrl: decodedToken.picture || null,
                role: "FREELANCER",
                walletBalance: 0,
              },
            },
            { upsert: true, new: true }
          );
        } catch {
          user = await User.findOne({ email: decodedToken.email.toLowerCase() });
        }
      }

      if (!user) {
        res.status(404).json({ success: false, error: "User not fully registered in database" });
        return;
      }
    }

    (req as any).dbUser = user;
    (req as any).firebaseUser = decodedToken;

    // Enforce email verification for protected API endpoints (bypass for /auth/me, /auth/sync and ADMIN users)
    const isAuthBootstrap = req.originalUrl?.includes("/api/auth/me") || req.originalUrl?.includes("/api/auth/sync");
    if (!isAuthBootstrap && user.role !== "ADMIN" && !decodedToken.email_verified) {
      res.status(403).json({
        success: false,
        error: "Email verification required. Please verify your email to access this resource.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
