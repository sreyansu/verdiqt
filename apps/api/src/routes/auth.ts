import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import * as admin from "firebase-admin";
import { requireAuthWithUser } from "../middleware/firebaseAuth";

const router: any = Router();

// Admin credentials from environment variables with fallback for local development
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "sreyansusekharmohanty@gmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Sreyansu@500";

// POST /api/auth/admin-login — Admin sign-in
router.post(
  "/admin-login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password || email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
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

// PUT /api/auth/profile — Update user profile (role change prohibited)
router.put(
  "/profile",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).dbUser;
      const {
        name,
        company,
        designation,
        country,
        state,
        city,
        phone,
        preferredLanguage,
        timezone,
        accountType,
        bio,
        professionalTitle,
        skills,
        specialization,
        experienceLevel,
        experienceYears,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
        availability,
      } = req.body;

      const updateFields: any = {};
      if (typeof name === "string" && name.trim()) updateFields.name = name.trim();
      if (company !== undefined) updateFields.company = company ? String(company).trim() : null;
      if (designation !== undefined) updateFields.designation = designation ? String(designation).trim() : null;
      if (country !== undefined) updateFields.country = country ? String(country).trim() : null;
      if (state !== undefined) updateFields.state = state ? String(state).trim() : null;
      if (city !== undefined) updateFields.city = city ? String(city).trim() : null;
      if (phone !== undefined) updateFields.phone = phone ? String(phone).trim() : null;
      if (preferredLanguage !== undefined) updateFields.preferredLanguage = preferredLanguage ? String(preferredLanguage).trim() : "English";
      if (timezone !== undefined) updateFields.timezone = timezone ? String(timezone).trim() : "UTC+05:30 (IST)";
      if (accountType !== undefined && ["INDIVIDUAL", "ORGANIZATION"].includes(accountType)) {
        updateFields.accountType = accountType;
      }
      if (bio !== undefined) updateFields.bio = bio ? String(bio).trim() : null;
      if (professionalTitle !== undefined) updateFields.professionalTitle = professionalTitle ? String(professionalTitle).trim() : null;
      if (Array.isArray(skills)) {
        updateFields.skills = skills.map((s: any) => String(s).trim()).filter(Boolean);
      }
      if (specialization !== undefined) updateFields.specialization = specialization ? String(specialization).trim() : null;
      if (experienceLevel !== undefined) updateFields.experienceLevel = experienceLevel ? String(experienceLevel).trim() : null;
      if (experienceYears !== undefined) updateFields.experienceYears = Number(experienceYears) || 0;
      if (portfolioUrl !== undefined) updateFields.portfolioUrl = portfolioUrl ? String(portfolioUrl).trim() : null;
      if (githubUrl !== undefined) updateFields.githubUrl = githubUrl ? String(githubUrl).trim() : null;
      if (linkedinUrl !== undefined) updateFields.linkedinUrl = linkedinUrl ? String(linkedinUrl).trim() : null;
      if (availability !== undefined) updateFields.availability = availability ? String(availability).trim() : "Full-time";

      // Note: role change is intentionally forbidden
      const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        { $set: updateFields },
        { new: true }
      );

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/profile-image — Upload profile picture using ImgBB (with fallback)
router.post(
  "/profile-image",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).dbUser;
      const { image } = req.body;

      if (!image || typeof image !== "string") {
        res.status(400).json({ success: false, error: "Image data is required (base64 string)" });
        return;
      }

      // Check approximate size (max ~5MB: base64 string length <= 7MB)
      if (image.length > 7 * 1024 * 1024) {
        res.status(400).json({ success: false, error: "Image exceeds maximum allowed size (5MB)" });
        return;
      }

      // Validate image format
      const isMatch = image.match(/^data:image\/(jpeg|png|webp|jpg);base64,/i) ||
                      image.startsWith("/9j/") || // JPEG
                      image.startsWith("iVBORw") || // PNG
                      image.startsWith("UklGR"); // WebP

      if (!isMatch) {
        res.status(400).json({ success: false, error: "Invalid image format. Supported formats: JPEG, PNG, WebP" });
        return;
      }

      let imageUrl: string | null = null;
      const cleanBase64 = image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

      // 1. Try ImgBB upload
      const imgbbKey = process.env.IMGBB_API_KEY || "0953cd87e4a6cc0ca3e54584d0e10e3a";
      if (imgbbKey) {
        try {
          const formData = new URLSearchParams();
          formData.append("image", cleanBase64);

          const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            body: formData.toString(),
          });

          const json: any = await imgbbRes.json();
          if (imgbbRes.ok && (json?.data?.url || json?.data?.display_url)) {
            imageUrl = json.data.display_url || json.data.url;
          }
        } catch (imgbbErr) {
          console.warn("[ImgBB Upload] Primary upload failed, attempting fallback:", imgbbErr);
        }
      }

      // 2. Fallback to Cloudinary if ImgBB fails/blocks
      if (!imageUrl) {
        try {
          const { cloudinary } = await import("../lib/cloudinary");
          const formatted = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
          const result = await cloudinary.uploader.upload(formatted, {
            folder: "verdiqt/avatars",
            transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
          });
          imageUrl = result.secure_url;
        } catch (cloudErr) {
          console.error("[Avatar Upload] Cloudinary fallback failed:", cloudErr);
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          success: false,
          error: "Failed to upload image to storage provider. Please try again.",
        });
        return;
      }

      // Save to user model
      const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        { $set: { avatarUrl: imageUrl } },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          avatarUrl: imageUrl,
          user: updatedUser,
        },
      });
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
