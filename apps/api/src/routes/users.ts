import { Router, Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/User";
import mongoose from "mongoose";

const router: any = Router();

/**
 * Helper: Sanitizes a user document into a safe public profile
 * Enforces privacy rules and strips internal identifiers, passwords, and sensitive fields.
 */
function sanitizePublicProfile(user: IUser) {
  const isFreelancer = user.role === "FREELANCER";
  const isClient = user.role === "CLIENT";
  const privacy = user.privacySettings || {
    showEmail: false,
    showPhone: false,
    showPortfolioLinks: true,
    showEarnings: false,
  };

  const base: any = {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    displayName: user.displayName || user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    country: user.country,
    state: user.state,
    city: user.city,
    timezone: user.timezone,
    preferredLanguage: user.preferredLanguage,
    languages: user.languages || [],
    bio: user.bio,
    createdAt: user.createdAt,
  };

  if (privacy.showEmail) {
    base.email = user.email;
  }
  if (privacy.showPhone && user.phone) {
    base.phone = user.phone;
  }

  if (isFreelancer) {
    base.professionalTitle = user.professionalTitle;
    base.primaryCategory = user.primaryCategory;
    base.specialization = user.specialization;
    base.skills = user.skills || [];
    base.experienceLevel = user.experienceLevel;
    base.experienceYears = user.experienceYears || 0;
    base.industriesServed = user.industriesServed || [];
    base.softwareTools = user.softwareTools || [];
    base.preferredProjectTypes = user.preferredProjectTypes || [];
    base.achievements = user.achievements;
    base.employment = user.employment || [];
    base.education = user.education || [];
    base.certifications = user.certifications || [];
    base.availability = user.workPreferences?.availability || user.availability || "Available";

    base.portfolio = (user.portfolio || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      role: item.role,
      technologies: item.technologies || [],
      startDate: item.startDate,
      endDate: item.endDate,
      projectUrl: privacy.showPortfolioLinks ? item.projectUrl : undefined,
      images: item.images || [],
      supportingDocs: item.supportingDocs || [],
    }));

    if (privacy.showPortfolioLinks) {
      base.portfolioUrl = user.portfolioUrl;
      base.githubUrl = user.githubUrl;
      base.linkedinUrl = user.linkedinUrl;
    }

    base.workPreferences = {
      availability: user.workPreferences?.availability || user.availability || "Available",
      preferredEngagement: user.workPreferences?.preferredEngagement || "Both",
      preferredProjectDuration: user.workPreferences?.preferredProjectDuration,
      workingDays: user.workPreferences?.workingDays || [],
      workingHours: user.workPreferences?.workingHours,
      timezone: user.workPreferences?.timezone || user.timezone,
      expectedResponseTime: user.workPreferences?.expectedResponseTime,
      preferredCommunicationMethod: user.workPreferences?.preferredCommunicationMethod,
      minimumBudget: user.workPreferences?.minimumBudget,
      revisionPolicy: user.workPreferences?.revisionPolicy,
    };
  }

  if (isClient) {
    base.accountType = user.accountType || "INDIVIDUAL";
    base.designation = user.designation;

    if (user.accountType === "ORGANIZATION" && user.organization) {
      base.organization = {
        companyName: user.organization.companyName || user.company,
        companyLogo: user.organization.companyLogo,
        industry: user.organization.industry,
        companySize: user.organization.companySize,
        companyWebsite: privacy.showPortfolioLinks ? user.organization.companyWebsite : undefined,
        companyTagline: user.organization.companyTagline,
        companyDescription: user.organization.companyDescription,
        businessLocation: user.organization.businessLocation || `${user.city || ""}, ${user.country || ""}`.trim(),
        userDesignation: user.organization.userDesignation || user.designation,
        businessEmail: privacy.showEmail ? user.organization.businessEmail : undefined,
        businessPhone: privacy.showPhone ? user.organization.businessPhone : undefined,
      };
    }

    base.hiringPreferences = user.hiringPreferences || {
      primaryHiringCategories: [],
      preferredExpertise: [],
      preferredEngagement: "Both",
      preferredLanguages: ["English"],
    };

    base.contractExpectations = user.contractExpectations || {
      expectedTurnaroundTime: "Within 24 hours",
      standardReviewPeriod: "3 business days",
      preferredRevisionRounds: "2 rounds",
      preferredDeliverableFormats: ["GitHub Repository", "Live Staging URL"],
    };
  }

  return base;
}

// GET /api/users/:id/profile — Public Profile View
router.get(
  "/:id/profile",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);

      let user = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      }
      if (!user) {
        user = await User.findOne({ clerkId: id });
      }

      if (!user) {
        res.status(404).json({ success: false, error: "User profile not found" });
        return;
      }

      const publicProfile = sanitizePublicProfile(user);
      res.json({ success: true, data: publicProfile });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/freelancers — Browse/search public freelancer directory
router.get(
  "/freelancers",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, skill, limit = "20", page = "1" } = req.query;
      const query: any = { role: "FREELANCER" };

      if (category && typeof category === "string") {
        query.primaryCategory = new RegExp(category.trim(), "i");
      }
      if (skill && typeof skill === "string") {
        query.skills = { $in: [new RegExp(skill.trim(), "i")] };
      }

      const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 50);
      const pageNum = Math.max(Number(page) || 1, 1);
      const skip = (pageNum - 1) * pageSize;

      const [users, total] = await Promise.all([
        User.find(query).sort({ updatedAt: -1 }).skip(skip).limit(pageSize),
        User.countDocuments(query),
      ]);

      const data = users.map(sanitizePublicProfile);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: pageNum,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
