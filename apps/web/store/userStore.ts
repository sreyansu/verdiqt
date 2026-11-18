import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Language {
  language: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native" | string;
}

export interface Employment {
  id: string;
  organization: string;
  jobTitle: string;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Freelance" | string;
  startDate: string;
  endDate?: string | null;
  currentlyWorking: boolean;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear?: string | null;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
}

export interface PortfolioItem {
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

export interface FreelancerWorkPreferences {
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

export interface ClientOrganization {
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

export interface ClientHiringPreferences {
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

export interface ContractExpectations {
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

export interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showPortfolioLinks: boolean;
  showEarnings: boolean;
}

export interface DbUser {
  id: string;
  _id?: string;
  clerkId: string;
  email: string;
  name: string;
  displayName?: string | null;
  role: "CLIENT" | "FREELANCER" | "ADMIN" | string;
  avatarUrl?: string | null;
  walletBalance: number;

  // General & Location
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
  languages?: Language[];

  // Freelancer Expertise
  professionalTitle?: string | null;
  primaryCategory?: string | null;
  specialization?: string | null;
  skills?: string[];
  experienceLevel?: string | null;
  experienceYears?: number | null;
  industriesServed?: string[];
  softwareTools?: string[];
  preferredProjectTypes?: string[];
  achievements?: string | null;

  // Repeatable Records
  employment?: Employment[];
  education?: Education[];
  certifications?: Certification[];
  portfolio?: PortfolioItem[];

  // Freelancer Preferences & Links
  availability?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  workPreferences?: FreelancerWorkPreferences;

  // Client Organization & Hiring
  organization?: ClientOrganization;
  hiringPreferences?: ClientHiringPreferences;
  contractExpectations?: ContractExpectations;

  // Privacy
  privacySettings?: PrivacySettings;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface UserState {
  dbUser: DbUser | null;
  setDbUser: (user: DbUser | null) => void;
  clearDbUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      dbUser: null,
      setDbUser: (user) => set({ dbUser: user }),
      clearDbUser: () => set({ dbUser: null }),
    }),
    {
      name: "verdiqt_user_storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
