// ============================================================
// Verdiqt — Shared TypeScript Types
// ============================================================

// --- Enums ---

export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export type MilestoneStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "DISPUTED";

export type WalletStatus =
  | "HOLDING"
  | "PARTIALLY_RELEASED"
  | "FULLY_RELEASED"
  | "REFUNDED"
  | "FROZEN";

export type DisputeStatus =
  | "OPEN"
  | "EVIDENCE_COLLECTION"
  | "AI_ANALYZING"
  | "VERDICT_READY"
  | "ESCALATED"
  | "RESOLVED";

// --- Subdocument Interfaces ---

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

// --- Models ---

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  walletBalance: number;
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
  employment?: Employment[];
  education?: Education[];
  certifications?: Certification[];
  portfolio?: PortfolioItem[];
  availability?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  workPreferences?: FreelancerWorkPreferences;
  organization?: ClientOrganization;
  hiringPreferences?: ClientHiringPreferences;
  contractExpectations?: ContractExpectations;
  privacySettings?: PrivacySettings;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  totalAmount: number;
  currency: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  scopeDocument?: string;
  clientId: string;
  freelancerId: string;
  createdAt: Date;
  updatedAt: Date;
  client?: User;
  freelancer?: User;
  milestones?: Milestone[];
  dispute?: Dispute;
  escrowWallet?: EscrowWallet;
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: MilestoneStatus;
  completedAt?: Date;
  createdAt: Date;
}

export interface EscrowWallet {
  id: string;
  contractId: string;
  totalAmount: number;
  heldAmount: number;
  releasedToFreelancer: number;
  refundedToClient: number;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dispute {
  id: string;
  contractId: string;
  raisedById: string;
  title: string;
  clientStatement: string;
  freelancerStatement?: string;
  status: DisputeStatus;
  createdAt: Date;
  resolvedAt?: Date;
  contract?: Contract;
  raisedBy?: User;
  evidence?: Evidence[];
  verdict?: Verdict;
}

export interface Evidence {
  id: string;
  disputeId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  createdAt: Date;
  uploadedBy?: User;
}

export interface Verdict {
  id: string;
  disputeId: string;
  clientFaultPercent: number;
  freelancerFaultPercent: number;
  clientRefundPercent: number;
  freelancerReleasePercent: number;
  reasoning: string;
  contractAnalysis: string;
  evidenceSummary: string;
  confidenceScore: number;
  escalatedToHuman: boolean;
  modelUsed: string;
  createdAt: Date;
  acceptedAt?: Date;
}

// --- API Request/Response Types ---

export interface CreateContractInput {
  title: string;
  description: string;
  totalAmount: number;
  currency?: string;
  startDate: string;
  endDate: string;
  freelancerEmail: string;
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  }[];
}

export interface RaiseDisputeInput {
  contractId: string;
  title: string;
  clientStatement: string;
}

export interface MediationVerdict {
  clientFaultPercent: number;
  freelancerFaultPercent: number;
  clientRefundPercent: number;
  freelancerReleasePercent: number;
  reasoning: string;
  contractAnalysis: string;
  evidenceSummary: string;
  confidenceScore: number;
  escalatedToHuman: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  activeContracts: number;
  openDisputes: number;
  walletBalance: number;
  resolvedCases: number;
}
