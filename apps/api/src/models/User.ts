import mongoose, { Document, Schema, Model } from "mongoose";

// --- Subdocument Interfaces ---

export interface ILanguage {
  language: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native" | string;
}

export interface IEmployment {
  id: string;
  organization: string;
  jobTitle: string;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Freelance" | string;
  startDate: string;
  endDate?: string | null;
  currentlyWorking: boolean;
  description?: string;
}

export interface IEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear?: string | null;
  description?: string;
}

export interface ICertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
}

export interface IPortfolioItem {
  id: string;
  title: string;
  description: string;
  role?: string;
  technologies: string[];
  startDate?: string | null;
  endDate?: string | null;
  projectUrl?: string | null;
  images: string[];
  supportingDocs?: string[];
}

export interface IFreelancerWorkPreferences {
  availability: "Available" | "Busy" | "Unavailable" | string;
  preferredEngagement: "Fixed-price" | "Hourly" | "Both" | string;
  preferredProjectDuration?: string;
  workingDays: string[];
  workingHours?: string;
  timezone?: string;
  expectedResponseTime?: string;
  preferredCommunicationMethod?: string;
  minimumBudget?: number;
  revisionPolicy?: string;
}

export interface IClientOrganization {
  companyName?: string;
  companyLogo?: string | null;
  industry?: string;
  companySize?: string;
  companyWebsite?: string;
  companyTagline?: string;
  companyDescription?: string;
  businessLocation?: string;
  businessEmail?: string;
  businessPhone?: string;
  userDesignation?: string;
}

export interface IClientHiringPreferences {
  primaryHiringCategories: string[];
  preferredExpertise: string[];
  typicalBudgetRange?: string;
  preferredEngagement: "Fixed-price" | "Hourly" | "Both" | string;
  preferredProjectDuration?: string;
  preferredExperienceLevel?: string;
  preferredLocation?: string;
  preferredLanguages: string[];
  preferredCommunicationMethod?: string;
  preferredCommunicationHours?: string;
}

export interface IContractExpectations {
  expectedTurnaroundTime?: string;
  standardReviewPeriod?: string;
  preferredRevisionRounds?: string;
  preferredMilestoneStructure?: string;
  preferredDeliverableFormats: string[];
  communicationFrequency?: string;
  requirementDocPreference?: string;
  authorizedApprover?: string;
  scopeChangeAuthority?: string;
  preferredEscalationMethod?: string;
}

export interface IPrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showPortfolioLinks: boolean;
  showEarnings: boolean;
}

// --- Main User Interface ---

export interface IUser extends Document {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  displayName?: string | null;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  avatarUrl?: string | null;
  walletBalance: number;

  // Base Profile & Location
  company?: string | null;
  designation?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  accountType?: "INDIVIDUAL" | "ORGANIZATION" | null;
  bio?: string | null;
  languages: ILanguage[];
  isDiscoverable?: boolean;

  // Freelancer Professional Expertise
  professionalTitle?: string | null;
  primaryCategory?: string | null;
  specialization?: string | null;
  skills: string[];
  experienceLevel?: string | null;
  experienceYears?: number | null;
  industriesServed: string[];
  softwareTools: string[];
  preferredProjectTypes: string[];
  achievements?: string | null;

  // Repeatable Professional History
  employment: IEmployment[];
  education: IEducation[];
  certifications: ICertification[];
  portfolio: IPortfolioItem[];

  // Work & Hiring Preferences
  availability?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  workPreferences?: IFreelancerWorkPreferences;

  // Client Organization & Hiring
  organization?: IClientOrganization;
  hiringPreferences?: IClientHiringPreferences;
  contractExpectations?: IContractExpectations;

  // Privacy & Access Control
  privacySettings?: IPrivacySettings;

  createdAt: Date;
  updatedAt: Date;
}

// --- Sub-Schemas ---

const LanguageSchema = new Schema(
  {
    language: { type: String, required: true },
    proficiency: { type: String, default: "Conversational" },
  },
  { _id: false }
);

const EmploymentSchema = new Schema(
  {
    id: { type: String, required: true },
    organization: { type: String, required: true },
    jobTitle: { type: String, required: true },
    employmentType: { type: String, default: "Full-time" },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    id: { type: String, required: true },
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startYear: { type: String, required: true },
    endYear: { type: String, default: null },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    issuingOrganization: { type: String, required: true },
    issueDate: { type: String, required: true },
    expiryDate: { type: String, default: null },
    credentialId: { type: String, default: null },
    credentialUrl: { type: String, default: null },
  },
  { _id: false }
);

const PortfolioSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    role: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    projectUrl: { type: String, default: null },
    images: { type: [String], default: [] },
    supportingDocs: { type: [String], default: [] },
  },
  { _id: false }
);

const WorkPreferencesSchema = new Schema(
  {
    availability: { type: String, default: "Available" },
    preferredEngagement: { type: String, default: "Both" },
    preferredProjectDuration: { type: String, default: "1_TO_3_MONTHS" },
    workingDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    workingHours: { type: String, default: "Flexible" },
    timezone: { type: String, default: "UTC+05:30 (IST)" },
    expectedResponseTime: { type: String, default: "Within a few hours" },
    preferredCommunicationMethod: { type: String, default: "Platform Messages" },
    minimumBudget: { type: Number, default: 0 },
    revisionPolicy: { type: String, default: "Up to 2 rounds of minor revisions per milestone included." },
  },
  { _id: false }
);

const OrganizationSchema = new Schema(
  {
    companyName: { type: String, default: null },
    companyLogo: { type: String, default: null },
    industry: { type: String, default: null },
    companySize: { type: String, default: "1-10" },
    companyWebsite: { type: String, default: null },
    companyTagline: { type: String, default: null },
    companyDescription: { type: String, default: null },
    businessLocation: { type: String, default: null },
    businessEmail: { type: String, default: null },
    businessPhone: { type: String, default: null },
    userDesignation: { type: String, default: null },
  },
  { _id: false }
);

const HiringPreferencesSchema = new Schema(
  {
    primaryHiringCategories: { type: [String], default: [] },
    preferredExpertise: { type: [String], default: [] },
    typicalBudgetRange: { type: String, default: "50K_TO_200K" },
    preferredEngagement: { type: String, default: "Both" },
    preferredProjectDuration: { type: String, default: "1_TO_3_MONTHS" },
    preferredExperienceLevel: { type: String, default: "Intermediate" },
    preferredLocation: { type: String, default: null },
    preferredLanguages: { type: [String], default: ["English"] },
    preferredCommunicationMethod: { type: String, default: "Platform Messages" },
    preferredCommunicationHours: { type: String, default: "Business hours (IST)" },
  },
  { _id: false }
);

const ContractExpectationsSchema = new Schema(
  {
    expectedTurnaroundTime: { type: String, default: "Within 24 hours" },
    standardReviewPeriod: { type: String, default: "3 business days" },
    preferredRevisionRounds: { type: String, default: "2 rounds" },
    preferredMilestoneStructure: { type: String, default: "Milestone-by-feature deliverable" },
    preferredDeliverableFormats: { type: [String], default: ["GitHub Repository", "Live Staging URL"] },
    communicationFrequency: { type: String, default: "Milestone check-ins" },
    requirementDocPreference: { type: String, default: "Detailed PRD with acceptance criteria" },
    authorizedApprover: { type: String, default: null },
    scopeChangeAuthority: { type: String, default: null },
    preferredEscalationMethod: { type: String, default: "Direct platform negotiation before AI tribunal" },
  },
  { _id: false }
);

const PrivacySettingsSchema = new Schema(
  {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showPortfolioLinks: { type: Boolean, default: true },
    showEarnings: { type: Boolean, default: false },
  },
  { _id: false }
);

// --- Main Schema ---

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, default: null },
    role: {
      type: String,
      enum: ["CLIENT", "FREELANCER", "ADMIN"],
      default: "FREELANCER",
    },
    avatarUrl: { type: String, default: null },
    walletBalance: { type: Number, default: 0 },

    // Location & General Details
    company: { type: String, default: null },
    designation: { type: String, default: null },
    country: { type: String, default: null },
    state: { type: String, default: null },
    city: { type: String, default: null },
    phone: { type: String, default: null },
    preferredLanguage: { type: String, default: "English" },
    timezone: { type: String, default: "UTC+05:30 (IST)" },
    accountType: { type: String, enum: ["INDIVIDUAL", "ORGANIZATION", null], default: "INDIVIDUAL" },
    bio: { type: String, default: null },
    languages: { type: [LanguageSchema], default: [] },
    isDiscoverable: { type: Boolean, default: true, index: true },

    // Freelancer Expertise
    professionalTitle: { type: String, default: null },
    primaryCategory: { type: String, default: null },
    specialization: { type: String, default: null },
    skills: { type: [String], default: [] },
    experienceLevel: { type: String, default: null },
    experienceYears: { type: Number, default: 0 },
    industriesServed: { type: [String], default: [] },
    softwareTools: { type: [String], default: [] },
    preferredProjectTypes: { type: [String], default: [] },
    achievements: { type: String, default: null },

    // Repeatable Arrays
    employment: { type: [EmploymentSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    portfolio: { type: [PortfolioSchema], default: [] },

    // Links & Preferences
    availability: { type: String, default: "Available" },
    portfolioUrl: { type: String, default: null },
    githubUrl: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    workPreferences: { type: WorkPreferencesSchema, default: () => ({}) },

    // Client Organization & Hiring
    organization: { type: OrganizationSchema, default: () => ({}) },
    hiringPreferences: { type: HiringPreferencesSchema, default: () => ({}) },
    contractExpectations: { type: ContractExpectationsSchema, default: () => ({}) },

    // Privacy Settings
    privacySettings: { type: PrivacySettingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
