// ============================================================
// Verdiqt — Tribunal & NS-QME Types
// ============================================================

export type CriterionStatus =
  | "VERIFIED_MET"
  | "PARTIALLY_MET_WITH_DEFECTS"
  | "UNVERIFIED"
  | "NOT_MET";

export type FinancialRecommendationStatus =
  | "RECOMMENDED"
  | "NO_FINANCIAL_RECOMMENDATION";

export interface StructuredAgentFinding {
  findingId: string;
  agentRole:
    | "CONTRACT_ANALYST"
    | "FORENSIC_AUDITOR"
    | "CLIENT_ADVOCATE"
    | "FREELANCER_ADVOCATE"
    | "LEGAL_REVIEWER"
    | "NEUTRAL_REVIEWER"
    | "CHIEF_ARBITRATOR";
  shortConclusion: string;
  relatedObligationIds: string[];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  confidenceClassification: "HIGH" | "MODERATE" | "LOW" | "INCONCLUSIVE";
  missingEvidence: string[];
  reviewerRequired: boolean;
}

export interface ContractualObligation {
  obligationId: string;
  milestoneId: string;
  description: string;
  acceptanceCriteria: string[];
  deliverables: string[];
  dueDate?: string;
  contractualValue?: number;
  weight?: number;
  revisionPolicy?: string;
  sourceReference: string;
}

export interface CriterionAssessment {
  criterionId: string;
  contractualObligationId: string;
  milestoneId?: string;
  description: string;
  importance?: "MANDATORY" | "OPTIONAL" | "TECHNICAL_SPEC";
  contractualWeight?: number;
  preAgreedWeight?: number;
  status: CriterionStatus;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  evidenceIdsReferenced?: string[];
  conciseExplanation?: string;
  uncertaintyReason?: string;
  defectSeverity?: "CRITICAL" | "MAJOR" | "MINOR" | "NONE";
  evaluatorNotes?: string;
  reasoning: string;
  confidenceScore?: number;
  reviewerRequired: boolean;
  requiresHumanReview?: boolean;
  rubricVersion: string;
}

export interface AppliedAdjustment {
  type: string;
  amount: number;
  contractualBasis: string;
  evidenceIds: string[];
}

export interface ValuationResult {
  disputeId: string;
  currency: string;
  disputedEscrowAmount: number;
  supportedCompletionLowerBound: number;
  supportedCompletionUpperBound: number;
  estimatedValueLowerBound: number;
  estimatedValueUpperBound: number;
  hasFinancialRecommendation: boolean;
  financialRecommendationStatus: FinancialRecommendationStatus;
  missingEvidenceForValuation: string[];
  contractualEntitlementAmount: number;
  quantumMeruitEntitlementAmount: number;
  recommendedReleaseAmount: number;
  recommendedRefundAmount: number;
  recommendedReleasePercent: number;
  recommendedRefundPercent: number;
  appliedAdjustments: AppliedAdjustment[];
  unverifiedCriteria: string[];
  requiresHumanReview: boolean;
  abstentionReason?: string | null;
  calculationBreakdown: string[];
  calculationVersion: string;
}

export interface LegalSourceMetadata {
  sourceId: string;
  jurisdiction: string;
  statute: string;
  section?: string;
  officialSourceUrl: string;
  sourceVersion: string;
  effectiveDate?: string;
  contentHash: string;
  keyPrinciples: string[];
  verificationStatus: "VERIFIED" | "PENDING_REVIEW";
}

// ─── 8-Section Standard Tribunal User-Facing Report ───────────────────────────

export interface TribunalCaseSummary {
  projectName: string;
  clientName: string;
  freelancerName: string;
  disputedMilestoneTitle: string;
  disputedMilestoneAmount: number;
  disputedEscrowAmount: number;
  currency: string;
}

export interface EstablishedFactItem {
  id: string;
  statement: string;
  evidenceReferences: string[];
  source: "MUTUAL_AGREEMENT" | "VERIFIED_DELIVERABLE" | "CONTRACT_RECORD";
}

export interface UncertaintyItem {
  id: string;
  issue: string;
  impact: string;
  missingEvidence: string[];
}

export interface NextStepAction {
  targetParty: "CLIENT" | "FREELANCER" | "HUMAN_REVIEWER" | "BOTH";
  action: string;
  deadlineDays?: number;
  purpose: string;
}

export interface TribunalReport {
  caseSummary: TribunalCaseSummary;
  tribunalAssessment: string; // 100-150 words plain language
  whatWasEstablished: EstablishedFactItem[];
  whatRemainsUncertain: UncertaintyItem[];
  contractualRequirements: CriterionAssessment[];
  recommendation: {
    type: "SETTLEMENT_ALLOCATION" | "HOLD_IN_ESCROW_FOR_REVISION" | "ESCALATE_TO_HUMAN_TRIBUNAL";
    financialRecommendationStatus: FinancialRecommendationStatus;
    freelancerReleaseAmount: number | null;
    clientRefundAmount: number | null;
    freelancerReleasePercent: number | null;
    clientRefundPercent: number | null;
    conciseSummary: string;
    justification: string;
  };
  nextSteps: NextStepAction[];
  limitations: {
    isAdvisory: boolean;
    disclaimerText: string;
    simulatedEscrowNote: string;
    governingPrinciples: string;
  };
}
