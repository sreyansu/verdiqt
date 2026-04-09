import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { prisma } from "../lib/prisma";

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

export const requireAuthWithUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
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

    const user = await prisma.user.findUnique({
      where: { email: decodedToken.email },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not fully registered in database" });
      return;
    }

    (req as any).dbUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
