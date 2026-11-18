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
    base.isDiscoverable = user.isDiscoverable !== false;

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

// GET /api/users/freelancers/facets — Get filter options (categories, top skills, experience levels)
router.get("/freelancers/facets", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const freelancers = await User.find({ role: "FREELANCER", isDiscoverable: { $ne: false } })
      .select("primaryCategory skills experienceLevel country languages")
      .lean();

    const categorySet = new Set<string>();
    const skillCountMap = new Map<string, number>();
    const countrySet = new Set<string>();

    freelancers.forEach((f: any) => {
      if (f.primaryCategory) categorySet.add(f.primaryCategory.trim());
      if (Array.isArray(f.skills)) {
        f.skills.forEach((s: string) => {
          if (s && s.trim()) {
            const clean = s.trim();
            skillCountMap.set(clean, (skillCountMap.get(clean) || 0) + 1);
          }
        });
      }
      if (f.country && f.country.trim()) countrySet.add(f.country.trim());
    });

    const topSkills = Array.from(skillCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([skill]) => skill);

    res.json({
      success: true,
      data: {
        categories: Array.from(categorySet).sort(),
        skills: topSkills,
        experienceLevels: ["Beginner", "Intermediate", "Experienced", "Expert"],
        availabilityOptions: ["Available", "Busy", "Unavailable"],
        countries: Array.from(countrySet).sort(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/freelancers — Browse & search public freelancer marketplace directory
router.get(
  "/freelancers",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        q,
        category,
        skill,
        experienceLevel,
        availability,
        country,
        language,
        sort = "recent",
        limit = "12",
        page = "1",
      } = req.query;

      // Base query: Must be Freelancer and discoverable
      const query: any = {
        role: "FREELANCER",
        isDiscoverable: { $ne: false },
      };

      // Full text / keyword search
      if (q && typeof q === "string" && q.trim()) {
        const keyword = q.trim();
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [
          { name: regex },
          { displayName: regex },
          { professionalTitle: regex },
          { primaryCategory: regex },
          { specialization: regex },
          { skills: { $in: [regex] } },
          { industriesServed: { $in: [regex] } },
          { bio: regex },
          { "portfolio.title": regex },
          { "portfolio.technologies": { $in: [regex] } },
        ];
      }

      // Specific Category filter
      if (category && typeof category === "string" && category.trim()) {
        const catRegex = new RegExp(category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ primaryCategory: catRegex }, { specialization: catRegex }],
        });
      }

      // Specific Skill filter
      if (skill && typeof skill === "string" && skill.trim()) {
        const skillRegex = new RegExp(skill.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.skills = { $in: [skillRegex] };
      }

      // Experience Level filter
      if (experienceLevel && typeof experienceLevel === "string" && experienceLevel.trim()) {
        query.experienceLevel = new RegExp(`^${experienceLevel.trim()}$`, "i");
      }

      // Availability filter
      if (availability && typeof availability === "string" && availability.trim()) {
        const availRegex = new RegExp(`^${availability.trim()}$`, "i");
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { "workPreferences.availability": availRegex },
            { availability: availRegex },
          ],
        });
      }

      // Country filter
      if (country && typeof country === "string" && country.trim()) {
        query.country = new RegExp(`^${country.trim()}$`, "i");
      }

      // Language filter
      if (language && typeof language === "string" && language.trim()) {
        const langRegex = new RegExp(language.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { preferredLanguage: langRegex },
            { "languages.language": langRegex },
          ],
        });
      }

      // Sorting
      let sortDoc: any = { updatedAt: -1 };
      if (sort === "experience_desc") {
        sortDoc = { experienceYears: -1, updatedAt: -1 };
      } else if (sort === "name_asc") {
        sortDoc = { name: 1 };
      } else if (sort === "recent") {
        sortDoc = { updatedAt: -1 };
      }

      const pageSize = Math.min(Math.max(Number(limit) || 12, 1), 50);
      const pageNum = Math.max(Number(page) || 1, 1);
      const skip = (pageNum - 1) * pageSize;

      const [users, total] = await Promise.all([
        User.find(query).sort(sortDoc).skip(skip).limit(pageSize),
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
