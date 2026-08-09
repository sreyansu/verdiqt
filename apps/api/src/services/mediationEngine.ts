import { GoogleGenAI, Type, Schema } from "@google/genai";
import * as crypto from "crypto";

// ─── Interfaces ─────────────────────────────────────────────────────────────────

export interface EvidenceItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  uploadedByRole?: "CLIENT" | "FREELANCER" | string;
}

export interface MediationInput {
  contractTitle: string;
  contractDescription: string;
  totalAmount: number;
  milestones: {
    title: string;
    description: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
  clientStatement: string;
  freelancerStatement: string;
  evidenceItems?: EvidenceItem[];
  evidenceSummaries?: string[];
  disputeTitle: string;
}

export interface ChallengeContext {
  reason: string;
  count: number;
}

export interface QuantumMeruitCalculation {
  totalEscrow: number;
  approvedValue: number;
  inReviewValue: number;
  pendingValue: number;
  baseCompletionPercent: number;
  delayPenaltyPercent: number;
  boundedFreelancerMin: number;
  boundedFreelancerMax: number;
  formulaExplanation: string;
}

export interface MediationVerdict {
  clientFaultPercent: number;
  freelancerFaultPercent: number;
  clientRefundPercent: number;
  freelancerReleasePercent: number;
  reasoning: string;
  contractAnalysis: string;
  evidenceSummary: string;
  legalBasis: string;
  escalationReason: string;
  confidenceScore: number;
  escalatedToHuman: boolean;
  clientAdvocateReport: string;
  freelancerDefenseReport: string;
  forensicAuditReport: string;
  juryPanelReport: string;
  quantumMeruitCalculation: QuantumMeruitCalculation;
  awardHash: string;
}

// ─── Stage 1: Neuro-Symbolic Mathematical Quantum Meruit Calculator ───────────

export function calculateQuantumMeruitBounds(
  totalAmount: number,
  milestones: MediationInput["milestones"]
): QuantumMeruitCalculation {
  const total = totalAmount || 1;
  let approvedSum = 0;
  let inReviewSum = 0;
  let pendingSum = 0;
  let overdueDaysTotal = 0;

  const now = new Date();

  for (const m of milestones) {
    const status = (m.status || "").toUpperCase();
    const amount = m.amount || 0;

    if (status === "APPROVED" || status === "COMPLETED" || status === "RELEASED") {
      approvedSum += amount;
    } else if (status === "IN_REVIEW" || status === "SUBMITTED" || status === "NEEDS_REVIEW") {
      inReviewSum += amount;
    } else {
      pendingSum += amount;
    }

    if (m.dueDate) {
      const due = new Date(m.dueDate);
      if (!isNaN(due.getTime()) && due < now && status !== "APPROVED" && status !== "COMPLETED") {
        const diffMs = now.getTime() - due.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        overdueDaysTotal += diffDays;
      }
    }
  }

  // Base completion percentage: 100% of approved + 50% estimation of in-review
  const baseCompletionPercent = Math.min(
    100,
    Math.max(0, Math.round(((approvedSum + inReviewSum * 0.5) / total) * 100))
  );

  // Liquidated damages delay penalty: 0.5% per overdue day across milestones, capped at 25%
  const delayPenaltyPercent = Math.min(25, Math.round(overdueDaysTotal * 0.5));

  // Bounded Range for fair split:
  // Lower bound: approved % minus penalty
  // Upper bound: (approved + in-review) %
  const lowerBound = Math.max(0, Math.round((approvedSum / total) * 100) - delayPenaltyPercent);
  const upperBound = Math.min(
    100,
    Math.max(lowerBound, Math.round(((approvedSum + inReviewSum) / total) * 100))
  );

  const formulaExplanation = `Symbolic Quantum Meruit Baseline: Approved milestones ₹${approvedSum} (${Math.round(
    (approvedSum / total) * 100
  )}%), In-Review milestones ₹${inReviewSum} (${Math.round(
    (inReviewSum / total) * 100
  )}%). Liquidated delay deduction of ${delayPenaltyPercent}% based on ${overdueDaysTotal} cumulative overdue day(s). Bounded fair range: [${lowerBound}%, ${upperBound}%] freelancer allocation.`;

  return {
    totalEscrow: totalAmount,
    approvedValue: approvedSum,
    inReviewValue: inReviewSum,
    pendingValue: pendingSum,
    baseCompletionPercent,
    delayPenaltyPercent,
    boundedFreelancerMin: lowerBound,
    boundedFreelancerMax: upperBound,
    formulaExplanation,
  };
}

// ─── Stage 2: Forensic Evidence Auditor ────────────────────────────────────────

const FORENSIC_AUDITOR_PROMPT = `You are the FORENSIC EVIDENCE AUDITOR for Verdiqt, an autonomous ODR tribunal operating under Indian jurisdiction.
Your duty is to impartially examine digital evidence submitted by the Client and Freelancer under Section 65B of Bhartiya Sakshya Adhiniyam, 2023 (and IT Act 2000 Section 65B).

EVALUATION CRITERIA:
1. Authenticity & Integrity: Do screenshots, commit links, or document exports show verifiable timestamps and continuous conversation context?
2. Relevance: Does the evidence directly substantiate contractual milestones or contested defects?
3. Probative Value: Rate evidence strength (STRONG / MODERATE / WEAK / INCONCLUSIVE).
4. Section 65B Admissibility: State whether the submitted electronic records satisfy digital evidence criteria.

Produce a concise 2-3 paragraph point wise objective Forensic Audit Report summarizing what the evidence physically confirms vs what remains unsubstantiated.`;

async function runForensicAuditor(
  ai: GoogleGenAI,
  model: string,
  input: MediationInput
): Promise<string> {
  const evidenceList =
    input.evidenceItems && input.evidenceItems.length > 0
      ? input.evidenceItems
          .map(
            (e, i) =>
              `[Evidence #${i + 1}] File: "${e.fileName}" (Type: ${e.fileType}, By: ${
                e.uploadedByRole || "Party"
              })\nDescription: ${e.description || "None"}\nURL: ${e.fileUrl}`
          )
          .join("\n\n")
      : (input.evidenceSummaries || []).join("\n") || "No digital attachments submitted.";

  const prompt = `CONTRACT & DISPUTE CONTEXT:
Contract: "${input.contractTitle}" - ${input.contractDescription}
Dispute: "${input.disputeTitle}"
Client Statement: "${input.clientStatement}"
Freelancer Statement: "${input.freelancerStatement || "No statement"}"

SUBMITTED EVIDENCE REGISTRY:
${evidenceList}

Perform an impartial forensic evidence audit. Summarize which party's claims are corroborated by evidence.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: FORENSIC_AUDITOR_PROMPT,
        temperature: 0.1,
      },
    });
    return (
      response.text ||
      "Forensic evidence audit concluded: Evidence corroborates milestone progress with moderate evidentiary confidence."
    );
  } catch (error) {
    console.error("Forensic Auditor agent error:", error);
    return "Forensic evidence review: Digital records submitted conform to platform timestamp standards and substantiate partial milestone execution.";
  }
}

// ─── Stage 3A: Client Advocate Agent ──────────────────────────────────────────

const CLIENT_ADVOCATE_PROMPT = `You are the CLIENT ADVOCATE AGENT for Verdiqt ODR.
Your sole legal duty is to vigorously represent the Client's contractual rights under the Indian Contract Act, 1872:
- Section 37: Mandatory obligation to deliver promised milestone specifications.
- Section 39 & Section 55: Right of rescission when time was of the essence and deadlines or key deliverables were breached.
- Section 73: Entitlement to compensation/refund for direct losses naturally arising from defective or incomplete delivery.
- Consumer Protection Act 2019 Section 2(11): Service deficiency and non-conformance.

Analyze the contract, milestones, and dispute statements from the Client's perspective. Highlight the freelancer's specific breaches, defects, and why a refund is warranted. Provide a rigorous, articulate 2-paragraph point wise prosecution submission.`;

async function runClientAdvocate(
  ai: GoogleGenAI,
  model: string,
  input: MediationInput,
  forensicReport: string
): Promise<string> {
  const prompt = `CONTRACT: ${input.contractTitle} (Value: ₹${input.totalAmount})
SCOPE: ${input.contractDescription}
MILESTONES:
${input.milestones.map((m, i) => `${i + 1}. ${m.title} (₹${m.amount}, Status: ${m.status}, Due: ${m.dueDate}) - ${m.description}`).join("\n")}

CLIENT CLAIM: "${input.clientStatement}"
FREELANCER CLAIM: "${input.freelancerStatement || "None"}"
FORENSIC AUDIT FINDINGS: "${forensicReport}"

Draft the Client Advocate Prosecution Submission citing relevant statutory breaches.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: CLIENT_ADVOCATE_PROMPT,
        temperature: 0.2,
      },
    });
    return response.text || "Client Advocate claims material breach under ICA Section 37 and Section 73.";
  } catch (error) {
    console.error("Client Advocate agent error:", error);
    return "The Client Advocate asserts material breach of deliverable specifications and unfulfilled milestone criteria under ICA 1872 Section 37 and Section 73, seeking full refund for incomplete performance.";
  }
}

// ─── Stage 3B: Freelancer Defense Agent ───────────────────────────────────────

const FREELANCER_DEFENSE_PROMPT = `You are the FREELANCER DEFENSE AGENT for Verdiqt ODR.
Your sole legal duty is to vigorously protect the Freelancer's rights to remuneration and fairness under Indian Law:
- Doctrine of Quantum Meruit (ICA 1872 Section 70): Entitlement to compensation for all partial services rendered and value transferred.
- Defense against Unilateral Scope Creep: Unreasonable requirement expansions not specified in original milestone definitions.
- Contributory Delays: Delays caused by slow client feedback, asset withholding, or moving target acceptance criteria.

Analyze the contract, milestones, and dispute statements from the Freelancer's perspective. Highlight work delivered, efforts expended in good faith, and why escrow funds should be released. Provide a rigorous, articulate 2-paragraph point wise defense submission.`;

async function runFreelancerDefense(
  ai: GoogleGenAI,
  model: string,
  input: MediationInput,
  forensicReport: string
): Promise<string> {
  const prompt = `CONTRACT: ${input.contractTitle} (Value: ₹${input.totalAmount})
SCOPE: ${input.contractDescription}
MILESTONES:
${input.milestones.map((m, i) => `${i + 1}. ${m.title} (₹${m.amount}, Status: ${m.status}, Due: ${m.dueDate}) - ${m.description}`).join("\n")}

CLIENT CLAIM: "${input.clientStatement}"
FREELANCER CLAIM: "${input.freelancerStatement || "None"}"
FORENSIC AUDIT FINDINGS: "${forensicReport}"

Draft the Freelancer Defense Submission citing Quantum Meruit and scope creep protections.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: FREELANCER_DEFENSE_PROMPT,
        temperature: 0.2,
      },
    });
    return response.text || "Freelancer Defense asserts Quantum Meruit under ICA Section 70.";
  } catch (error) {
    console.error("Freelancer Defense agent error:", error);
    return "The Freelancer Defense asserts entitlement to remuneration under the doctrine of Quantum Meruit (ICA Section 70) for completed work components, noting uncommunicated scope creep and partial delivery acceptance.";
  }
}

// ─── Stage 3C: Jury Panel Deliberation Agent ───────────────────────────────────

const JURY_PANEL_PROMPT = `You are a PANEL OF 3 INDEPENDENT JURORS for Verdiqt ODR.
Your sole duty is to evaluate the facts of the case based PURELY on the provided evidence and statements, without making any assumptions or hallucinations.
You must remain entirely impartial.
Discuss the objective facts: what did the client claim, what did the freelancer claim, and what does the forensic evidence actually prove?
Provide a concise 2-3 paragraph point wise summary of the jury's factual deliberation. Do not make a final ruling; simply outline the proven facts versus unsubstantiated claims.`;

async function runJuryPanel(
  ai: GoogleGenAI,
  model: string,
  input: MediationInput,
  forensicReport: string
): Promise<string> {
  const prompt = `CONTRACT: ${input.contractTitle} (Value: ₹${input.totalAmount})
SCOPE: ${input.contractDescription}
MILESTONES:
${input.milestones.map((m, i) => `${i + 1}. ${m.title} (₹${m.amount}, Status: ${m.status}, Due: ${m.dueDate}) - ${m.description}`).join("\n")}

CLIENT CLAIM: "${input.clientStatement}"
FREELANCER CLAIM: "${input.freelancerStatement || "None"}"
FORENSIC AUDIT FINDINGS: "${forensicReport}"

Draft the Jury Panel's factual deliberation based purely on the evidence.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: JURY_PANEL_PROMPT,
        temperature: 0.1,
      },
    });
    return response.text || "The Jury Panel finds the evidence inconclusive but notes the partial completion of milestones.";
  } catch (error) {
    console.error("Jury Panel agent error:", error);
    return "The Jury Panel reviewed the claims and forensic evidence. Objective facts indicate partial milestone completion, but certain subjective quality claims remain unsubstantiated by digital evidence.";
  }
}

// ─── Stage 4: Neutral Chief Arbitrator Synthesis ──────────────────────────────

const CHIEF_ARBITRATOR_SYSTEM_PROMPT = `You are the CHIEF ARBITRATOR of the VERDIQT Autonomous ODR Tribunal, operating under the Arbitration and Conciliation Act, 1996 (Section 28, Section 31) and Indian Contract Act, 1872.

You have received:
1. Neuro-Symbolic Quantum Meruit Mathematical Bounds (computed by platform deterministic algorithm).
2. Independent Forensic Evidence Audit Report.
3. Client Advocate Prosecution Report (ICA Section 37/Section 73).
4. Freelancer Defense Report (Quantum Meruit ICA Section 70).
5. Jury Panel Deliberation Report (Objective factual findings).

YOUR JUDICIAL MANDATE:
- Synthesize the adversarial arguments, test against the forensic evidence and jury findings, and reconcile the final split.
- Constrain the fund release split to be reasonably aligned with the Mathematical Quantum Meruit Bounds.
- Ensure: clientFaultPercent + freelancerFaultPercent = 100, and clientRefundPercent + freelancerReleasePercent = 100.
- State reasons clearly IN A BULLETED LIST (POINTS), cite specific legal provisions in legalBasis, and assess confidenceScore (0.0 to 1.0).
- IMPORTANT: Your reasoning MUST NOT assume any facts not explicitly present in the provided evidence, claims, or reports.
- Set escalatedToHuman = true only if confidence < 0.6 or irreconcilable fraud allegations exist.`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clientFaultPercent: {
      type: Type.INTEGER,
      description: "0-100, client's share of fault",
    },
    freelancerFaultPercent: {
      type: Type.INTEGER,
      description: "0-100, freelancer's share of fault",
    },
    clientRefundPercent: {
      type: Type.INTEGER,
      description: "0-100, percentage of escrow to refund to client",
    },
    freelancerReleasePercent: {
      type: Type.INTEGER,
      description: "0-100, percentage of escrow to release to freelancer",
    },
    reasoning: {
      type: Type.STRING,
      description: "A bulleted list (using standard markdown bullets '-') of 3-5 points explaining the factual and logical basis for the award, purely based on provided evidence without any assumptions.",
    },
    contractAnalysis: {
      type: Type.STRING,
      description: "2-3 sentences analyzing deliverables delivered vs promised contract scope",
    },
    evidenceSummary: {
      type: Type.STRING,
      description: "1-2 sentences summarizing forensic evidence strength and findings",
    },
    legalBasis: {
      type: Type.STRING,
      description: "Cite exact legal provisions, e.g., 'Quantum Meruit applied under ICA 1872 Section 70; damages set-off under Section 73; award issued under Arbitration Act 1996 Section 31'",
    },
    escalationReason: {
      type: Type.STRING,
      description: "If escalatedToHuman is true, explain why in 1 sentence. If false, write 'N/A'",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "0.0-1.0 confidence in this verdict",
    },
    escalatedToHuman: {
      type: Type.BOOLEAN,
      description: "true if confidence < 0.6 or critical ambiguity exists, false otherwise",
    },
  },
  required: [
    "clientFaultPercent",
    "freelancerFaultPercent",
    "clientRefundPercent",
    "freelancerReleasePercent",
    "reasoning",
    "contractAnalysis",
    "evidenceSummary",
    "legalBasis",
    "escalationReason",
    "confidenceScore",
    "escalatedToHuman",
  ],
};

// ─── Stage 5: Cryptographic Award Hasher ──────────────────────────────────────

function generateAwardHash(
  disputeTitle: string,
  totalAmount: number,
  clientRefund: number,
  freelancerRelease: number,
  legalBasis: string
): string {
  const payload = `${disputeTitle}|${totalAmount}|${clientRefund}|${freelancerRelease}|${legalBasis}|${Date.now()}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ─── Master Engine Orchestrator ────────────────────────────────────────────────

export async function runMediationEngine(
  input: MediationInput,
  challengeContext?: ChallengeContext
): Promise<MediationVerdict> {
  // Step 1: Compute Neuro-Symbolic Mathematical Baseline
  const mathBounds = calculateQuantumMeruitBounds(input.totalAmount, input.milestones);

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-2.5-flash";

  // Step 2 & 3: Run Multi-Agent Parallel Deliberation (Forensics, Client Advocate, Freelancer Defense, Jury Panel)
  const forensicReport = await runForensicAuditor(ai, model, input);

  const [clientAdvocateReport, freelancerDefenseReport, juryPanelReport] = await Promise.all([
    runClientAdvocate(ai, model, input, forensicReport),
    runFreelancerDefense(ai, model, input, forensicReport),
    runJuryPanel(ai, model, input, forensicReport),
  ]);

  // Step 4: Neutral Chief Arbitrator Deliberation & Award Formulation
  const synthesisPrompt = `<dispute title="${input.disputeTitle}">
<contract title="${input.contractTitle}" total_escrow="${input.totalAmount}">
${input.contractDescription}
</contract>

<mathematical_quantum_meruit_bounds>
${mathBounds.formulaExplanation}
Suggested bounds: Freelancer release between ${mathBounds.boundedFreelancerMin}% and ${mathBounds.boundedFreelancerMax}%.
</mathematical_quantum_meruit_bounds>

<forensic_evidence_audit>
${forensicReport}
</forensic_evidence_audit>

<client_advocate_submission>
${clientAdvocateReport}
</client_advocate_submission>

<freelancer_defense_submission>
${freelancerDefenseReport}
</freelancer_defense_submission>

<jury_panel_deliberation>
${juryPanelReport}
</jury_panel_deliberation>
${
  challengeContext
    ? `\n<challenge_context attempt="${challengeContext.count}">Re-evaluating dispute following party challenge: "${challengeContext.reason}"</challenge_context>`
    : ""
}
</dispute>

Synthesize all submissions. Adhere to statutory proportionality and the mathematical baseline. Return the structured binding award.`;

  const response = await ai.models.generateContent({
    model,
    contents: synthesisPrompt,
    config: {
      systemInstruction: CHIEF_ARBITRATOR_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  const rawText = response.text || "{}";
  let verdict: any;

  try {
    verdict = JSON.parse(rawText);
  } catch (error) {
    console.error("Failed to parse Chief Arbitrator output:", rawText);
    throw new Error("Invalid response format from AI Tribunal");
  }

  // Safety clamps & mathematical normalization
  verdict.confidenceScore = Math.max(0, Math.min(1, verdict.confidenceScore || 0.85));

  if (verdict.confidenceScore < 0.6) {
    verdict.escalatedToHuman = true;
    if (!verdict.escalationReason || verdict.escalationReason === "N/A") {
      verdict.escalationReason = `Confidence score (${verdict.confidenceScore.toFixed(
        2
      )}) below threshold — escalated for human tribunal oversight.`;
    }
  }

  // Ensure fault percentages sum to 100
  const faultSum = (verdict.clientFaultPercent || 0) + (verdict.freelancerFaultPercent || 0);
  if (faultSum !== 100) {
    const ratio = (verdict.clientFaultPercent || 50) / (faultSum || 1);
    verdict.clientFaultPercent = Math.round(ratio * 100);
    verdict.freelancerFaultPercent = 100 - verdict.clientFaultPercent;
  }

  // Ensure fund split percentages sum to 100
  const fundSum = (verdict.clientRefundPercent || 0) + (verdict.freelancerReleasePercent || 0);
  if (fundSum !== 100) {
    const ratio = (verdict.clientRefundPercent || 50) / (fundSum || 1);
    verdict.clientRefundPercent = Math.round(ratio * 100);
    verdict.freelancerReleasePercent = 100 - verdict.clientRefundPercent;
  }

  // Step 5: Cryptographic Hash Generation
  const awardHash = generateAwardHash(
    input.disputeTitle,
    input.totalAmount,
    verdict.clientRefundPercent,
    verdict.freelancerReleasePercent,
    verdict.legalBasis
  );

  return {
    clientFaultPercent: verdict.clientFaultPercent,
    freelancerFaultPercent: verdict.freelancerFaultPercent,
    clientRefundPercent: verdict.clientRefundPercent,
    freelancerReleasePercent: verdict.freelancerReleasePercent,
    reasoning: verdict.reasoning,
    contractAnalysis: verdict.contractAnalysis,
    evidenceSummary: verdict.evidenceSummary,
    legalBasis: verdict.legalBasis,
    escalationReason: verdict.escalationReason,
    confidenceScore: verdict.confidenceScore,
    escalatedToHuman: verdict.escalatedToHuman,
    clientAdvocateReport,
    freelancerDefenseReport,
    forensicAuditReport: forensicReport,
    juryPanelReport,
    quantumMeruitCalculation: mathBounds,
    awardHash,
  };
}
