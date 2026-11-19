import {
  ContractualObligation,
  CriterionAssessment,
  CriterionStatus,
  ValuationResult,
  AppliedAdjustment,
} from "../types/tribunalTypes";

export interface MilestoneContractData {
  id?: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  dueDate: string;
}

/**
 * Stage 6.1: Deterministically extracts or structures contractual obligations from milestones.
 * Preserves contractual weights and milestone values without hallucination.
 */
export function extractContractualObligations(
  contractTitle: string,
  contractDescription: string,
  milestones: MilestoneContractData[]
): ContractualObligation[] {
  const obligations: ContractualObligation[] = [];

  for (let idx = 0; idx < milestones.length; idx++) {
    const m = milestones[idx];
    const obligationId = `OBL-${idx + 1}`;
    const milestoneId = m.id || `MS-${idx + 1}`;

    // Extract acceptance criteria from description
    const criteriaList: string[] = [];
    const descLines = m.description.split(/\n|\. /);
    for (const line of descLines) {
      const trimmed = line.trim();
      if (trimmed.length > 5) {
        criteriaList.push(trimmed);
      }
    }
    if (criteriaList.length === 0) {
      criteriaList.push(`Satisfactory delivery of ${m.title} in accordance with scope`);
    }

    obligations.push({
      obligationId,
      milestoneId,
      description: m.description,
      acceptanceCriteria: criteriaList,
      deliverables: [`Deliverables for ${m.title}`],
      dueDate: m.dueDate,
      contractualValue: m.amount,
      weight: Math.round((m.amount / Math.max(1, milestones.reduce((acc, cur) => acc + cur.amount, 0))) * 100),
      sourceReference: `Contract "${contractTitle}" - Milestone #${idx + 1}: ${m.title}`,
    });
  }

  return obligations;
}

/**
 * Standard rubric mapping status to completion percentage ranges:
 * - VERIFIED_MET: [100%, 100%] (Demonstrably delivered and compliant)
 * - PARTIALLY_MET_WITH_DEFECTS: [40%, 60%] (Delivered with rectifiable defects; quantum meruit assessed)
 * - UNVERIFIED: [0%, 0%] (Inconclusive; cannot establish contractual or quantum meruit entitlement without proof)
 * - NOT_MET: [0%, 0%] (Unfulfilled or breached)
 */
export const RUBRIC_COMPLETION_BOUNDS: Record<CriterionStatus, [number, number]> = {
  VERIFIED_MET: [100, 100],
  PARTIALLY_MET_WITH_DEFECTS: [40, 60],
  UNVERIFIED: [0, 0],
  NOT_MET: [0, 0],
};

/**
 * Stage 6.4: Deterministic TypeScript Neuro-Symbolic Valuation Engine
 * Consumes validated criterion assessments and contractual escrow figures.
 *
 * Enforces strict safeguards:
 * 1. Financial Invariants:
 *    - When recommendation is supported, release + refund === disputedEscrowAmount and sum of % === 100.
 *    - Never exceeds available escrow balance; non-negative values.
 * 2. Evidence Sufficiency Safeguard (Section 5):
 *    - Never fabricates a midpoint (e.g. 15%) from unverified/inconclusive evidence.
 *    - If substantive criteria are UNVERIFIED or evidence is inconclusive, returns NO_FINANCIAL_RECOMMENDATION
 *      with explicit missing evidence requirements and human review escalation.
 * 3. Separate Entitlements:
 *    - Tracks contractual milestone entitlement vs. Section 70 Quantum Meruit vs. Section 73 liquidated deductions.
 */
export function calculateDeterministicValuation(params: {
  disputeId: string;
  disputedEscrowAmount: number;
  obligations: ContractualObligation[];
  assessments: CriterionAssessment[];
  currency?: string;
  contractualDelayPenaltyRate?: number;
  hasUnexcusedDelay?: boolean;
}): ValuationResult {
  const {
    disputeId,
    disputedEscrowAmount,
    obligations,
    assessments,
    currency = "INR",
    contractualDelayPenaltyRate = 0,
    hasUnexcusedDelay = false,
  } = params;

  const breakdown: string[] = [];
  breakdown.push(`Disputed escrow balance verified: ₹${disputedEscrowAmount.toLocaleString("en-IN")}`);

  if (disputedEscrowAmount <= 0) {
    return {
      disputeId,
      currency,
      disputedEscrowAmount: 0,
      supportedCompletionLowerBound: 0,
      supportedCompletionUpperBound: 0,
      estimatedValueLowerBound: 0,
      estimatedValueUpperBound: 0,
      hasFinancialRecommendation: false,
      financialRecommendationStatus: "NO_FINANCIAL_RECOMMENDATION",
      missingEvidenceForValuation: [],
      contractualEntitlementAmount: 0,
      quantumMeruitEntitlementAmount: 0,
      recommendedReleaseAmount: 0,
      recommendedRefundAmount: 0,
      recommendedReleasePercent: 0,
      recommendedRefundPercent: 100,
      appliedAdjustments: [],
      unverifiedCriteria: [],
      requiresHumanReview: false,
      abstentionReason: "Disputed escrow balance is zero or not held.",
      calculationBreakdown: ["Disputed escrow balance is zero."],
      calculationVersion: "NS-QME-v2.1-safeguarded",
    };
  }

  // 1. Calculate weighted completion bounds across obligations
  let totalWeight = 0;
  let weightedLowerBound = 0;
  let weightedUpperBound = 0;
  let verifiedMetWeight = 0;
  let unverifiedWeight = 0;
  const unverifiedList: string[] = [];
  const missingEvidenceList: string[] = [];

  for (const obligation of obligations) {
    const matchingAssessments = assessments.filter(
      (a) => a.contractualObligationId === obligation.obligationId
    );

    const oblWeight = obligation.weight || (1 / Math.max(1, obligations.length)) * 100;
    totalWeight += oblWeight;

    if (matchingAssessments.length === 0) {
      unverifiedList.push(`${obligation.obligationId}: Entire obligation unassessed`);
      missingEvidenceList.push(`Substantive deliverable proof for ${obligation.description}`);
      unverifiedWeight += oblWeight;
      continue;
    }

    let oblCritLowerSum = 0;
    let oblCritUpperSum = 0;

    for (const ca of matchingAssessments) {
      const bounds = RUBRIC_COMPLETION_BOUNDS[ca.status] || RUBRIC_COMPLETION_BOUNDS.UNVERIFIED;
      oblCritLowerSum += bounds[0];
      oblCritUpperSum += bounds[1];

      if (ca.status === "VERIFIED_MET") {
        verifiedMetWeight += (oblWeight / matchingAssessments.length);
      } else if (ca.status === "UNVERIFIED") {
        unverifiedWeight += (oblWeight / matchingAssessments.length);
        const reason = ca.uncertaintyReason || "Substantive verification proof missing";
        unverifiedList.push(`${ca.criterionId}: ${ca.description} (${reason})`);
        missingEvidenceList.push(`${ca.description} [${reason}]`);
      }
    }

    const oblLowerAvg = oblCritLowerSum / matchingAssessments.length;
    const oblUpperAvg = oblCritUpperSum / matchingAssessments.length;

    weightedLowerBound += (oblLowerAvg * oblWeight) / 100;
    weightedUpperBound += (oblUpperAvg * oblWeight) / 100;

    breakdown.push(
      `Obligation [${obligation.obligationId}]: Completion bound [${oblLowerAvg.toFixed(1)}% - ${oblUpperAvg.toFixed(1)}%] at contractual weight ${oblWeight.toFixed(1)}%`
    );
  }

  const normFactor = totalWeight > 0 ? 100 / totalWeight : 1;
  const completionLowerPercent = Math.max(0, Math.min(100, weightedLowerBound * normFactor));
  const completionUpperPercent = Math.max(0, Math.min(100, weightedUpperBound * normFactor));
  const unverifiedRatio = totalWeight > 0 ? unverifiedWeight / totalWeight : 0;

  breakdown.push(
    `Aggregate completion bounds: [${completionLowerPercent.toFixed(1)}% - ${completionUpperPercent.toFixed(1)}%], unverified ratio: ${(unverifiedRatio * 100).toFixed(1)}%`
  );

  // 2. Identify Mandatory or High-Impact Uncertainties
  const hasMandatoryUnverified = assessments.some(
    (a) => a.status === "UNVERIFIED" && a.importance === "MANDATORY"
  );
  const hasExplicitReviewRequest = assessments.some(
    (a) => a.requiresHumanReview === true || a.reviewerRequired === true
  );

  // Evidence Sufficiency Safeguard (Section 5):
  // When evidence is insufficient (e.g. unverified ratio >= 40% or all unverified or mandatory unverified),
  // DO NOT fabricate a midpoint or precise percentage. Return NO_FINANCIAL_RECOMMENDATION.
  const isInconclusive =
    unverifiedRatio >= 0.4 ||
    hasMandatoryUnverified ||
    (assessments.length > 0 && assessments.every((a) => a.status === "UNVERIFIED"));

  if (isInconclusive) {
    const abstentionReason = `Substantive contractual criteria remain unverified due to inconclusive digital evidence (${unverifiedList.length} criteria unverified). In accordance with Verdiqt Financial Safeguards, no speculative financial allocation is fabricated. Escrow funds remain held pending party evidence exchange or human panel review.`;
    breakdown.push(`Financial Safeguard Triggered: ${abstentionReason}`);

    return {
      disputeId,
      currency,
      disputedEscrowAmount,
      supportedCompletionLowerBound: Math.round(completionLowerPercent),
      supportedCompletionUpperBound: Math.round(completionUpperPercent),
      estimatedValueLowerBound: 0,
      estimatedValueUpperBound: 0,
      hasFinancialRecommendation: false,
      financialRecommendationStatus: "NO_FINANCIAL_RECOMMENDATION",
      missingEvidenceForValuation: Array.from(new Set(missingEvidenceList)),
      contractualEntitlementAmount: 0,
      quantumMeruitEntitlementAmount: 0,
      recommendedReleaseAmount: 0,
      recommendedRefundAmount: 0,
      recommendedReleasePercent: 0,
      recommendedRefundPercent: 0,
      appliedAdjustments: [],
      unverifiedCriteria: unverifiedList,
      requiresHumanReview: true,
      abstentionReason,
      calculationBreakdown: breakdown,
      calculationVersion: "NS-QME-v2.1-safeguarded",
    };
  }

  // 3. Evidence is Sufficient: Compute Deterministic Contractual & Quantum Meruit Entitlements
  const contractualEntitlementAmount = Math.round((disputedEscrowAmount * verifiedMetWeight * normFactor) / 100);
  let valLower = Math.round((disputedEscrowAmount * completionLowerPercent) / 100);
  let valUpper = Math.round((disputedEscrowAmount * completionUpperPercent) / 100);

  // Contractually supported liquidated damages / delay penalties (Section 73 / Section 55)
  const appliedAdjustments: AppliedAdjustment[] = [];
  if (hasUnexcusedDelay && contractualDelayPenaltyRate > 0) {
    const penaltyAmount = Math.round(disputedEscrowAmount * contractualDelayPenaltyRate);
    appliedAdjustments.push({
      type: "DELAY_PENALTY",
      amount: penaltyAmount,
      contractualBasis: "Indian Contract Act Section 55 / Section 74 - Liquidated compensation for unexcused delay",
      evidenceIds: [],
    });
    valLower = Math.max(0, valLower - penaltyAmount);
    valUpper = Math.max(0, valUpper - penaltyAmount);
    breakdown.push(`Contractual delay penalty adjustment applied: -₹${penaltyAmount.toLocaleString("en-IN")}`);
  }

  // Quantum Meruit valuation point for verified partial performance
  const rawRelease = Math.round((valLower + valUpper) / 2);
  const recommendedReleaseAmount = Math.max(0, Math.min(disputedEscrowAmount, rawRelease));
  const recommendedRefundAmount = Math.max(0, disputedEscrowAmount - recommendedReleaseAmount);
  const recommendedReleasePercent = Math.round((recommendedReleaseAmount / disputedEscrowAmount) * 100);
  const recommendedRefundPercent = 100 - recommendedReleasePercent;

  breakdown.push(
    `Supported financial allocation: Freelancer Release ₹${recommendedReleaseAmount.toLocaleString("en-IN")} (${recommendedReleasePercent}%), Client Refund ₹${recommendedRefundAmount.toLocaleString("en-IN")} (${recommendedRefundPercent}%)`
  );

  const requiresHumanReview =
    hasExplicitReviewRequest ||
    completionUpperPercent - completionLowerPercent > 35;
  const abstentionReason = requiresHumanReview
    ? `Evidentiary variance of ${(completionUpperPercent - completionLowerPercent).toFixed(1)}% detected across partial deliverables. Recommended for human reviewer validation.`
    : null;

  return {
    disputeId,
    currency,
    disputedEscrowAmount,
    supportedCompletionLowerBound: Math.round(completionLowerPercent),
    supportedCompletionUpperBound: Math.round(completionUpperPercent),
    estimatedValueLowerBound: valLower,
    estimatedValueUpperBound: valUpper,
    hasFinancialRecommendation: true,
    financialRecommendationStatus: "RECOMMENDED",
    missingEvidenceForValuation: Array.from(new Set(missingEvidenceList)),
    contractualEntitlementAmount,
    quantumMeruitEntitlementAmount: recommendedReleaseAmount,
    recommendedReleaseAmount,
    recommendedRefundAmount,
    recommendedReleasePercent,
    recommendedRefundPercent,
    appliedAdjustments,
    unverifiedCriteria: unverifiedList,
    requiresHumanReview,
    abstentionReason,
    calculationBreakdown: breakdown,
    calculationVersion: "NS-QME-v2.1-safeguarded",
  };
}
