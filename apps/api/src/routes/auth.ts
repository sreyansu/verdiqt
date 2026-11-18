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

      // Create a Firebase custom token for client-side authentication
      const customToken = await admin.auth().createCustomToken(firebaseUid, {
        role: "ADMIN",
      });

      res.json({
        success: true,
        data: {
          token: customToken,
          role: "ADMIN",
          email: ADMIN_EMAIL,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/sync — Sync Firebase user to MongoDB
router.post(
  "/sync",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decodedUser = (req as any).firebaseUser;
      const { name, avatarUrl, role } = req.body;

      // Extract UID and treat it as clerkId (we'll keep the column name but store firebase uid)
      const firebaseUid = decodedUser.uid;

      const updateDoc: any = {};
      if (name) updateDoc.name = name;
      if (avatarUrl) updateDoc.avatarUrl = avatarUrl;

      // Only allow setting role on insert (default to FREELANCER if not provided)
      const validRole = ["CLIENT", "FREELANCER"].includes(role) ? role : "FREELANCER";

      const setOnInsertDoc: any = {
        clerkId: firebaseUid,
        email: decodedUser.email.toLowerCase(),
        role: validRole,
        walletBalance: 0,
      };
      if (!name) {
        setOnInsertDoc.name = decodedUser.name || "App User";
      }

      const user = await User.findOneAndUpdate(
        { email: decodedUser.email.toLowerCase() },
        {
          $set: updateDoc,
          $setOnInsert: setOnInsertDoc,
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        data: user,
      });
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
      const body = req.body;

      const updateFields: any = {};

      // Personal Information
      if (typeof body.name === "string" && body.name.trim()) updateFields.name = body.name.trim();
      if (body.displayName !== undefined) updateFields.displayName = body.displayName ? String(body.displayName).trim() : null;
      if (body.company !== undefined) updateFields.company = body.company ? String(body.company).trim() : null;
      if (body.designation !== undefined) updateFields.designation = body.designation ? String(body.designation).trim() : null;
      if (body.country !== undefined) updateFields.country = body.country ? String(body.country).trim() : null;
      if (body.state !== undefined) updateFields.state = body.state ? String(body.state).trim() : null;
      if (body.city !== undefined) updateFields.city = body.city ? String(body.city).trim() : null;
      if (body.phone !== undefined) updateFields.phone = body.phone ? String(body.phone).trim() : null;
      if (body.preferredLanguage !== undefined) updateFields.preferredLanguage = body.preferredLanguage ? String(body.preferredLanguage).trim() : "English";
      if (body.timezone !== undefined) updateFields.timezone = body.timezone ? String(body.timezone).trim() : "UTC+05:30 (IST)";
      if (body.accountType !== undefined && ["INDIVIDUAL", "ORGANIZATION"].includes(body.accountType)) {
        updateFields.accountType = body.accountType;
      }
      if (body.bio !== undefined) updateFields.bio = body.bio ? String(body.bio).trim() : null;

      // Languages array
      if (Array.isArray(body.languages)) {
        updateFields.languages = body.languages.map((l: any) => ({
          language: String(l.language || "").trim(),
          proficiency: String(l.proficiency || "Conversational").trim(),
        })).filter((l: any) => l.language.length > 0);
      }

      // Freelancer Professional Expertise
      if (body.professionalTitle !== undefined) updateFields.professionalTitle = body.professionalTitle ? String(body.professionalTitle).trim() : null;
      if (body.primaryCategory !== undefined) updateFields.primaryCategory = body.primaryCategory ? String(body.primaryCategory).trim() : null;
      if (body.specialization !== undefined) updateFields.specialization = body.specialization ? String(body.specialization).trim() : null;
      if (Array.isArray(body.skills)) {
        updateFields.skills = body.skills.map((s: any) => String(s).trim()).filter(Boolean);
      }
      if (body.experienceLevel !== undefined) updateFields.experienceLevel = body.experienceLevel ? String(body.experienceLevel).trim() : null;
      if (body.experienceYears !== undefined) updateFields.experienceYears = Number(body.experienceYears) || 0;
      if (Array.isArray(body.industriesServed)) {
        updateFields.industriesServed = body.industriesServed.map((s: any) => String(s).trim()).filter(Boolean);
      }
      if (Array.isArray(body.softwareTools)) {
        updateFields.softwareTools = body.softwareTools.map((s: any) => String(s).trim()).filter(Boolean);
      }
      if (Array.isArray(body.preferredProjectTypes)) {
        updateFields.preferredProjectTypes = body.preferredProjectTypes.map((s: any) => String(s).trim()).filter(Boolean);
      }
      if (body.achievements !== undefined) updateFields.achievements = body.achievements ? String(body.achievements).trim() : null;

      // Repeatable: Employment
      if (Array.isArray(body.employment)) {
        updateFields.employment = body.employment.map((emp: any) => ({
          id: emp.id || new Date().getTime().toString(),
          organization: String(emp.organization || "").trim(),
          jobTitle: String(emp.jobTitle || "").trim(),
          employmentType: String(emp.employmentType || "Full-time").trim(),
          startDate: String(emp.startDate || "").trim(),
          endDate: emp.currentlyWorking ? null : (emp.endDate ? String(emp.endDate).trim() : null),
          currentlyWorking: Boolean(emp.currentlyWorking),
          description: emp.description ? String(emp.description).trim() : "",
        })).filter((emp: any) => emp.organization && emp.jobTitle);
      }

      // Repeatable: Education
      if (Array.isArray(body.education)) {
        updateFields.education = body.education.map((edu: any) => ({
          id: edu.id || new Date().getTime().toString(),
          institution: String(edu.institution || "").trim(),
          degree: String(edu.degree || "").trim(),
          fieldOfStudy: String(edu.fieldOfStudy || "").trim(),
          startYear: String(edu.startYear || "").trim(),
          endYear: edu.endYear ? String(edu.endYear).trim() : null,
          description: edu.description ? String(edu.description).trim() : "",
        })).filter((edu: any) => edu.institution && edu.degree);
      }

      // Repeatable: Certifications
      if (Array.isArray(body.certifications)) {
        updateFields.certifications = body.certifications.map((cert: any) => ({
          id: cert.id || new Date().getTime().toString(),
          name: String(cert.name || "").trim(),
          issuingOrganization: String(cert.issuingOrganization || "").trim(),
          issueDate: String(cert.issueDate || "").trim(),
          expiryDate: cert.expiryDate ? String(cert.expiryDate).trim() : null,
          credentialId: cert.credentialId ? String(cert.credentialId).trim() : null,
          credentialUrl: cert.credentialUrl ? String(cert.credentialUrl).trim() : null,
        })).filter((cert: any) => cert.name && cert.issuingOrganization);
      }

      // Repeatable: Portfolio
      if (Array.isArray(body.portfolio)) {
        updateFields.portfolio = body.portfolio.map((port: any) => ({
          id: port.id || new Date().getTime().toString(),
          title: String(port.title || "").trim(),
          description: String(port.description || "").trim(),
          role: port.role ? String(port.role).trim() : "",
          technologies: Array.isArray(port.technologies) ? port.technologies.map((t: any) => String(t).trim()).filter(Boolean) : [],
          startDate: port.startDate ? String(port.startDate).trim() : null,
          endDate: port.endDate ? String(port.endDate).trim() : null,
          projectUrl: port.projectUrl ? String(port.projectUrl).trim() : null,
          images: Array.isArray(port.images) ? port.images.map((img: any) => String(img).trim()).filter(Boolean) : [],
          supportingDocs: Array.isArray(port.supportingDocs) ? port.supportingDocs.map((doc: any) => String(doc).trim()).filter(Boolean) : [],
        })).filter((port: any) => port.title && port.description);
      }

      // Links & General Freelancer Preferences
      if (body.availability !== undefined) updateFields.availability = body.availability ? String(body.availability).trim() : "Available";
      if (body.portfolioUrl !== undefined) updateFields.portfolioUrl = body.portfolioUrl ? String(body.portfolioUrl).trim() : null;
      if (body.githubUrl !== undefined) updateFields.githubUrl = body.githubUrl ? String(body.githubUrl).trim() : null;
      if (body.linkedinUrl !== undefined) updateFields.linkedinUrl = body.linkedinUrl ? String(body.linkedinUrl).trim() : null;

      // Work Preferences Object
      if (body.workPreferences && typeof body.workPreferences === "object") {
        updateFields.workPreferences = {
          availability: body.workPreferences.availability || "Available",
          preferredEngagement: body.workPreferences.preferredEngagement || "Both",
          preferredProjectDuration: body.workPreferences.preferredProjectDuration,
          workingDays: Array.isArray(body.workPreferences.workingDays) ? body.workPreferences.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          workingHours: body.workPreferences.workingHours || "Flexible",
          timezone: body.workPreferences.timezone || updateFields.timezone || "UTC+05:30 (IST)",
          expectedResponseTime: body.workPreferences.expectedResponseTime || "Within a few hours",
          preferredCommunicationMethod: body.workPreferences.preferredCommunicationMethod || "Platform Messages",
          minimumBudget: Number(body.workPreferences.minimumBudget) || 0,
          revisionPolicy: body.workPreferences.revisionPolicy || "Up to 2 rounds of minor revisions per milestone included.",
        };
      }

      // Client Organization Object
      if (body.organization && typeof body.organization === "object") {
        updateFields.organization = {
          companyName: body.organization.companyName ? String(body.organization.companyName).trim() : (body.company ? String(body.company).trim() : null),
          companyLogo: body.organization.companyLogo ? String(body.organization.companyLogo).trim() : null,
          industry: body.organization.industry ? String(body.organization.industry).trim() : null,
          companySize: body.organization.companySize ? String(body.organization.companySize).trim() : "1-10",
          companyWebsite: body.organization.companyWebsite ? String(body.organization.companyWebsite).trim() : null,
          companyTagline: body.organization.companyTagline ? String(body.organization.companyTagline).trim() : null,
          companyDescription: body.organization.companyDescription ? String(body.organization.companyDescription).trim() : null,
          businessLocation: body.organization.businessLocation ? String(body.organization.businessLocation).trim() : null,
          businessEmail: body.organization.businessEmail ? String(body.organization.businessEmail).trim() : null,
          businessPhone: body.organization.businessPhone ? String(body.organization.businessPhone).trim() : null,
          userDesignation: body.organization.userDesignation ? String(body.organization.userDesignation).trim() : (body.designation ? String(body.designation).trim() : null),
        };
        // Keep top-level company/designation synced for backwards compatibility
        if (updateFields.organization.companyName) updateFields.company = updateFields.organization.companyName;
        if (updateFields.organization.userDesignation) updateFields.designation = updateFields.organization.userDesignation;
      }

      // Client Hiring Preferences Object
      if (body.hiringPreferences && typeof body.hiringPreferences === "object") {
        updateFields.hiringPreferences = {
          primaryHiringCategories: Array.isArray(body.hiringPreferences.primaryHiringCategories) ? body.hiringPreferences.primaryHiringCategories : [],
          preferredExpertise: Array.isArray(body.hiringPreferences.preferredExpertise) ? body.hiringPreferences.preferredExpertise : [],
          typicalBudgetRange: body.hiringPreferences.typicalBudgetRange || "50K_TO_200K",
          preferredEngagement: body.hiringPreferences.preferredEngagement || "Both",
          preferredProjectDuration: body.hiringPreferences.preferredProjectDuration || "1_TO_3_MONTHS",
          preferredExperienceLevel: body.hiringPreferences.preferredExperienceLevel || "Intermediate",
          preferredLocation: body.hiringPreferences.preferredLocation ? String(body.hiringPreferences.preferredLocation).trim() : null,
          preferredLanguages: Array.isArray(body.hiringPreferences.preferredLanguages) ? body.hiringPreferences.preferredLanguages : ["English"],
          preferredCommunicationMethod: body.hiringPreferences.preferredCommunicationMethod || "Platform Messages",
          preferredCommunicationHours: body.hiringPreferences.preferredCommunicationHours || "Business hours (IST)",
        };
      }

      // Contract & Project Expectations Object (ODR Ambiguity Prevention)
      if (body.contractExpectations && typeof body.contractExpectations === "object") {
        updateFields.contractExpectations = {
          expectedTurnaroundTime: body.contractExpectations.expectedTurnaroundTime || "Within 24 hours",
          standardReviewPeriod: body.contractExpectations.standardReviewPeriod || "3 business days",
          preferredRevisionRounds: body.contractExpectations.preferredRevisionRounds || "2 rounds",
          preferredMilestoneStructure: body.contractExpectations.preferredMilestoneStructure || "Milestone-by-feature deliverable",
          preferredDeliverableFormats: Array.isArray(body.contractExpectations.preferredDeliverableFormats) ? body.contractExpectations.preferredDeliverableFormats : ["GitHub Repository", "Live Staging URL"],
          communicationFrequency: body.contractExpectations.communicationFrequency || "Milestone check-ins",
          requirementDocPreference: body.contractExpectations.requirementDocPreference || "Detailed PRD with acceptance criteria",
          authorizedApprover: body.contractExpectations.authorizedApprover ? String(body.contractExpectations.authorizedApprover).trim() : null,
          scopeChangeAuthority: body.contractExpectations.scopeChangeAuthority ? String(body.contractExpectations.scopeChangeAuthority).trim() : null,
          preferredEscalationMethod: body.contractExpectations.preferredEscalationMethod || "Direct platform negotiation before AI tribunal",
        };
      }

      // Privacy Settings Object
      if (body.privacySettings && typeof body.privacySettings === "object") {
        updateFields.privacySettings = {
          showEmail: Boolean(body.privacySettings.showEmail),
          showPhone: Boolean(body.privacySettings.showPhone),
          showPortfolioLinks: body.privacySettings.showPortfolioLinks !== false,
          showEarnings: Boolean(body.privacySettings.showEarnings),
        };
      }

      // Note: role change and walletBalance changes are intentionally protected
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

// POST /api/auth/profile-image — Upload profile picture or company logo using ImgBB (with fallback)
router.post(
  "/profile-image",
  requireAuthWithUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).dbUser;
      const { image, target = "avatar" } = req.body;

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
          const folder = target === "companyLogo" ? "verdiqt/logos" : target === "portfolio" ? "verdiqt/portfolio" : "verdiqt/avatars";
          const result = await cloudinary.uploader.upload(formatted, {
            folder,
            transformation: target === "avatar" ? [{ width: 400, height: 400, crop: "fill", gravity: "face" }] : undefined,
          });
          imageUrl = result.secure_url;
        } catch (cloudErr) {
          console.error("[Image Upload] Cloudinary fallback failed:", cloudErr);
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          success: false,
          error: "Failed to upload image to storage provider. Please try again.",
        });
        return;
      }

      // If target is portfolio, return imageUrl directly without mutating user doc
      if (target === "portfolio") {
        res.json({
          success: true,
          data: {
            imageUrl,
          },
        });
        return;
      }

      // Save to user model based on target
      const updateData: any = {};
      if (target === "companyLogo") {
        updateData["organization.companyLogo"] = imageUrl;
      } else {
        updateData.avatarUrl = imageUrl;
      }

      const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        { $set: updateData },
        { new: true }
      );

      res.json({
        success: true,
        data: {
          imageUrl,
          avatarUrl: updatedUser?.avatarUrl,
          companyLogo: updatedUser?.organization?.companyLogo,
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
