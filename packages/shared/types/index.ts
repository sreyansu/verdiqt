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

// --- Models ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  walletBalance: number;
  createdAt: Date;
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
