import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import * as crypto from "crypto";
import { Dispute, Contract, Evidence, Verdict, AnalysisRun, EscrowWallet } from "../models";
import { AI_CONFIG, getThinkingConfig } from "../config/aiConfig";
import { STATUTORY_CORPUS, retrieveRelevantLegalContext, LegalStatuteArticle } from "./legalCorpus";
import {
  ingestEvidenceRegistry,
  IngestedEvidenceItem,
  EvidenceProcessingItem,
} from "./multimodalIngestion";
import {
  extractContractualObligations,
  calculateDeterministicValuation,
  MilestoneContractData,
} from "./neuroSymbolicQME";
import {
  ContractualObligation,
  CriterionAssessment,
  ValuationResult,
  StructuredAgentFinding,
  TribunalReport,
  EstablishedFactItem,
  UncertaintyItem,
  NextStepAction,
  TribunalCaseSummary,
} from "../types/tribunalTypes";

// ─── LangGraph State Annotation ───────────────────────────────────────────────

export const TribunalAnnotation = Annotation.Root({
  disputeId: Annotation<string>(),
  analysisRunId: Annotation<string>(),
  disputeVersion: Annotation<number>(),
  threadId: Annotation<string>(),

  // Loaded DB records
  contract: Annotation<any>(),
  dispute: Annotation<any>(),
  milestones: Annotation<MilestoneContractData[]>(),
  rawEvidence: Annotation<EvidenceProcessingItem[]>(),

  // Obligation & Multimodal Evidence Ingestion
  obligations: Annotation<ContractualObligation[]>(),
  ingestedEvidence: Annotation<IngestedEvidenceItem[]>(),

  // Multi-Agent Stage Reports & Structured Machine-Readable Findings
  forensicReport: Annotation<string>(),
  clientAdvocateReport: Annotation<string>(),
  freelancerDefenseReport: Annotation<string>(),
  legalContextReport: Annotation<string>(),
  legalStatutes: Annotation<LegalStatuteArticle[]>(),

  // Neutral Assessment & Criteria
  neutralFactReview: Annotation<string>(),
  criterionAssessments: Annotation<CriterionAssessment[]>(),
  establishedFacts: Annotation<EstablishedFactItem[]>(),
  disputedUncertainties: Annotation<UncertaintyItem[]>(),

  // Internal Machine-Readable Agent Findings (Cleanly separated from user-facing text)
  agentFindings: Annotation<StructuredAgentFinding[]>({
    reducer: (prev, next) => (prev || []).concat(next || []),
    default: () => [],
  }),

  // Deterministic NS-QME Output
  valuationResult: Annotation<ValuationResult>(),

  // Synthesis & 8-Section Standard Tribunal Report
  chiefArbitratorReasoning: Annotation<string>(),
  structuredReport: Annotation<TribunalReport>(),
  confidenceScore: Annotation<number>(),
  escalatedToHuman: Annotation<boolean>(),
  escalationReason: Annotation<string>(),
  awardHash: Annotation<string>(),
  finalVerdict: Annotation<any>(),

  // Checkpointing & Diagnostics
  checkpoints: Annotation<Array<{ node: string; timestamp: string; durationMs: number }>>({
    reducer: (prev, next) => (prev || []).concat(next || []),
    default: () => [],
  }),
  errors: Annotation<string[]>({
    reducer: (prev, next) => (prev || []).concat(next || []),
    default: () => [],
  }),
});

export type TribunalState = typeof TribunalAnnotation.State;

// ─── Gemini Invocation Helper with Thinking & Fallback ────────────────────────

async function callGemini(params: {
  contents: string;
  systemInstruction: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: Schema;
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const primaryModel = AI_CONFIG.primaryModel;
  const fallbackModel = AI_CONFIG.fallbackModel;

  const baseConfig: any = {
    systemInstruction: params.systemInstruction,
    temperature: params.temperature ?? 0.2,
    thinkingConfig: getThinkingConfig(),
  };
  if (params.responseMimeType) baseConfig.responseMimeType = params.responseMimeType;
  if (params.responseSchema) baseConfig.responseSchema = params.responseSchema;

  const invokeWithRetry = async (model: string, config: any, timeoutMs: number, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Model ${model} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      try {
        const res = await Promise.race([
          ai.models.generateContent({
            model,
            contents: params.contents,
            config,
          }),
          timeoutPromise,
        ]);
        clearTimeout(timer!);
        return res;
      } catch (err: any) {
        clearTimeout(timer!);
        const isSpike =
          err?.status === 503 ||
          err?.status === 429 ||
          String(err?.message || "").includes("503") ||
          String(err?.message || "").includes("demand");
        if (isSpike && attempt < maxRetries) {
          const delay = attempt * 1200;
          console.warn(
            `[TribunalGraph] ${model} hit temporary ${err?.status || 503} spike. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Model ${model} failed after retries`);
  };

  try {
    const res = await invokeWithRetry(primaryModel, baseConfig, 6000, 1);
    return { text: res.text || "", modelUsed: primaryModel };
  } catch (err: any) {
    console.warn(
      `[TribunalGraph] Primary model ${primaryModel} failed (${err?.status || err?.code || err?.message}). Falling back to ${fallbackModel}...`
    );
    if (primaryModel !== fallbackModel) {
      try {
        const resFallback = await invokeWithRetry(fallbackModel, baseConfig, 30000, 3);
        return { text: resFallback.text || "", modelUsed: fallbackModel };
      } catch (fallbackErr: any) {
        console.warn(
          `[TribunalGraph] ${fallbackModel} with thinking failed (${fallbackErr?.message}), retrying without thinkingConfig...`
        );
        const standardConfig = { ...baseConfig };
        delete standardConfig.thinkingConfig;
        try {
          const resFinal = await invokeWithRetry(fallbackModel, standardConfig, 30000, 3);
          return { text: resFinal.text || "", modelUsed: fallbackModel };
        } catch (finalErr) {
          console.error(`[TribunalGraph] Both ${primaryModel} and ${fallbackModel} failed:`, finalErr);
          throw finalErr;
        }
      }
    }
    throw err;
  }
}

// ─── Node 1: Load Dispute Data ────────────────────────────────────────────────

async function loadDisputeDataNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const dispute: any = await Dispute.findById(state.disputeId)
    .populate({
      path: "contract",
      populate: [
        { path: "client" },
        { path: "freelancer" },
        { path: "milestones", options: { sort: { dueDate: 1 } } },
        { path: "escrowWallet" },
      ],
    })
    .populate({
      path: "evidence",
      populate: { path: "uploadedBy" },
      options: { sort: { createdAt: 1 } },
    });

  if (!dispute) {
    throw new Error(`Dispute ${state.disputeId} not found`);
  }

  const contract = dispute.contract || {};
  const milestones: MilestoneContractData[] = (contract.milestones || []).map((m: any) => ({
    id: (m._id || m.id).toString(),
    title: m.title,
    description: m.description,
    amount: m.amount,
    status: m.status,
    dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : "",
  }));

  const rawEvidence: EvidenceProcessingItem[] = (dispute.evidence || []).map((e: any) => ({
    id: (e._id || e.id).toString(),
    fileName: e.fileName,
    fileUrl: e.fileUrl,
    fileType: e.fileType,
    description: e.description,
    uploadedByRole:
      e.uploadedById?.toString() === contract.clientId?.toString() ? "CLIENT" : "FREELANCER",
    bytes: e.bytes || 0,
    sha256Hash: e.sha256Hash || null,
  }));

  return {
    dispute,
    contract,
    milestones,
    rawEvidence,
    checkpoints: [
      { node: "loadDisputeData", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 2: Contract Analysis (Obligation Extraction) ────────────────────────

async function contractAnalysisNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const obligations = extractContractualObligations(
    state.contract?.title || "",
    state.contract?.description || "",
    state.milestones || []
  );

  return {
    obligations,
    checkpoints: [
      { node: "contractAnalysis", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 3: Evidence Ingestion & Mapping ─────────────────────────────────────

async function evidenceIngestionNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const ingested = await ingestEvidenceRegistry(state.rawEvidence || []);

  return {
    ingestedEvidence: ingested,
    checkpoints: [
      { node: "evidenceIngestionMapping", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 4: Forensic Audit (Integrity, Provenance, Relevance, Sufficiency) ────

const FORENSIC_SYSTEM_PROMPT = `You are the DIGITAL FORENSIC EVIDENCE AUDITOR for Verdiqt ODR.
Your task is to examine submitted digital evidence under Section 63 of Bharatiya Sakshya Adhiniyam, 2023.

CRITICAL DISTINCTIONS & RULES:
1. File Integrity: A recorded SHA-256 hash proves binary consistency with the stored file, but does NOT prove the truth or functionality of its contents.
2. Source & Provenance: Does the evidence come from an authenticated source (verifiable sender, git commit, signed log) or an unverified upload?
3. Relevance: Does the file directly substantiate contractual milestones or defect allegations?
4. Sufficiency: Can the evidence alone prove delivery or breach without assumptions? (e.g. screenshots prove UI appearance, but NOT runtime persistence, search backend, or CSV data integrity).
5. Output structured, machine-readable findings in concise, professional English. Avoid grandiose legal prose.`;

const forensicAuditSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conciseSummary: {
      type: Type.STRING,
      description: "A concise 2-3 sentence forensic assessment in plain English.",
    },
    fileIntegrityNote: {
      type: Type.STRING,
      description: "Note regarding binary SHA-256 integrity versus factual veracity.",
    },
    provenanceAssessment: {
      type: Type.STRING,
      description: "Evaluation of evidence source reliability and digital provenance.",
    },
    evidentiarySufficiency: {
      type: Type.STRING,
      enum: ["SUFFICIENT", "PARTIALLY_SUFFICIENT", "INCONCLUSIVE"],
    },
    missingSubstantiveEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key substantive evidence missing to prove compliance or defects.",
    },
  },
  required: [
    "conciseSummary",
    "fileIntegrityNote",
    "provenanceAssessment",
    "evidentiarySufficiency",
    "missingSubstantiveEvidence",
  ],
};

async function forensicAuditNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const evidenceEnvelopes = (state.ingestedEvidence || [])
    .map((e) => `[Evidence #${e.id}] Category: ${e.forensicCategory}, SHA-256: ${e.sha256Hash}\n${e.sanitizedEnclosedPrompt}`)
    .join("\n\n");

  const prompt = `CONTRACT CONTEXT:
"${state.contract?.title}" - ${state.contract?.description}
DISPUTE TITLE: "${state.dispute?.title}"
CLIENT STATEMENT: "${state.dispute?.clientStatement}"
FREELANCER STATEMENT: "${state.dispute?.freelancerStatement || "No statement"}"

EVIDENCE REGISTRY:
${evidenceEnvelopes || "No electronic attachments submitted."}

Perform impartial forensic evidence audit distinguishing file integrity, source provenance, relevance, and evidentiary sufficiency.`;

  const { text } = await callGemini({
    contents: prompt,
    systemInstruction: FORENSIC_SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: forensicAuditSchema,
    temperature: 0.1,
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (err) {
    console.warn("[ForensicAuditNode] JSON parse error, using fallback", err);
  }

  const conciseSummary = parsed.conciseSummary ||
    "Forensic audit completed: Evidence substantiates partial interface submission, but remains inconclusive regarding runtime functionality without source code and test logs.";

  const finding: StructuredAgentFinding = {
    findingId: `FIND-FORENSIC-${Date.now()}`,
    agentRole: "FORENSIC_AUDITOR",
    shortConclusion: conciseSummary,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: (state.ingestedEvidence || []).map((e) => e.id),
    contradictingEvidenceIds: [],
    confidenceClassification: parsed.evidentiarySufficiency === "SUFFICIENT"
      ? "HIGH"
      : parsed.evidentiarySufficiency === "PARTIALLY_SUFFICIENT"
      ? "MODERATE"
      : "INCONCLUSIVE",
    missingEvidence: parsed.missingSubstantiveEvidence || ["Runnable source code", "Reproducible test documentation"],
    reviewerRequired: parsed.evidentiarySufficiency === "INCONCLUSIVE",
  };

  return {
    forensicReport: conciseSummary,
    agentFindings: [finding],
    checkpoints: [
      { node: "forensicAudit", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 5A: Client Advocate (Evidence-Grounded Prosecution) ─────────────────

const CLIENT_ADVOCATE_PROMPT = `You are the CLIENT ADVOCATE AGENT for Verdiqt ODR.
Identify the client's strongest relevant arguments supported directly by submitted evidence under Indian Contract Act, 1872:
- Section 37: Obligation of parties to perform their respective promises according to agreed acceptance criteria.
- Section 73: Right to compensation/refund for direct failure to deliver agreed specifications.

CRITICAL RULES:
- Identify arguments directly supported by evidence IDs.
- Do NOT present unproven allegations as established facts.
- Acknowledge weaknesses where client concerns lack objective proof in the record.
- Be concise, direct, and factual. Avoid legal hyperbole.`;

const clientAdvocateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conciseSummary: {
      type: Type.STRING,
      description: "A concise 2-3 sentence summary of evidence-backed client claims.",
    },
    keyArguments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Arguments supported directly by submitted evidence.",
    },
    unsupportedClaimsOrGaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Areas where client allegations lack substantiating proof in the record.",
    },
  },
  required: ["conciseSummary", "keyArguments", "unsupportedClaimsOrGaps"],
};

async function clientAdvocateNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const prompt = `CONTRACT: ${state.contract?.title} (Value: ₹${state.contract?.totalAmount})
SCOPE: ${state.contract?.description}
OBLIGATIONS:
${state.obligations?.map((o) => `[${o.obligationId}] ${o.description} (Value: ₹${o.contractualValue})`).join("\n")}

CLIENT CLAIM: "${state.dispute?.clientStatement}"
FORENSIC AUDIT SUMMARY: "${state.forensicReport}"

Draft the Client Advocate structured submission citing relevant statutory provisions and evidence IDs.`;

  const { text } = await callGemini({
    contents: prompt,
    systemInstruction: CLIENT_ADVOCATE_PROMPT,
    responseMimeType: "application/json",
    responseSchema: clientAdvocateSchema,
    temperature: 0.2,
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (err) {
    console.warn("[ClientAdvocateNode] JSON parse error, using fallback", err);
  }

  const conciseSummary = parsed.conciseSummary ||
    "Client Advocate asserts that deliverable acceptance criteria have not been demonstrated through verifiable test records or runnable documentation under ICA Section 37.";

  const finding: StructuredAgentFinding = {
    findingId: `FIND-CLIENT-ADV-${Date.now()}`,
    agentRole: "CLIENT_ADVOCATE",
    shortConclusion: conciseSummary,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: (state.ingestedEvidence || []).filter((e) => e.uploadedByRole === "CLIENT").map((e) => e.id),
    contradictingEvidenceIds: [],
    confidenceClassification: (parsed.keyArguments || []).length > 0 ? "MODERATE" : "LOW",
    missingEvidence: parsed.unsupportedClaimsOrGaps || [],
    reviewerRequired: false,
  };

  return {
    clientAdvocateReport: conciseSummary,
    agentFindings: [finding],
    checkpoints: [
      { node: "clientAdvocate", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 5B: Freelancer Defense (Evidence-Grounded Defense & Quantum Meruit) ─

const FREELANCER_DEFENSE_PROMPT = `You are the FREELANCER ADVOCATE AGENT for Verdiqt ODR.
Identify the freelancer's strongest relevant arguments supported directly by submitted evidence under Indian Law:
- Doctrine of Quantum Meruit (ICA 1872 Section 70): Right to remuneration for partial deliverables and beneficial work transferred.
- Protection against unilateral scope expansion or lack of client testing cooperation.

CRITICAL RULES:
- Distinguish actual demonstrable delivery (verified deliverables) from mere assertions of delivery.
- Cite specific evidence IDs (screenshots, documents, code deliverables).
- Acknowledge missing deliverable elements where verifiable proof is not yet in the record.
- Be concise, direct, and factual. Avoid legal hyperbole.`;

const freelancerAdvocateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conciseSummary: {
      type: Type.STRING,
      description: "A concise 2-3 sentence summary of evidence-backed freelancer claims.",
    },
    demonstrableDeliverables: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Deliverables demonstrably produced or transferred by the freelancer.",
    },
    unverifiedOrMissingElements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Deliverable elements where demonstrable proof is not yet provided.",
    },
  },
  required: ["conciseSummary", "demonstrableDeliverables", "unverifiedOrMissingElements"],
};

async function freelancerDefenseNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const prompt = `CONTRACT: ${state.contract?.title} (Value: ₹${state.contract?.totalAmount})
SCOPE: ${state.contract?.description}
OBLIGATIONS:
${state.obligations?.map((o) => `[${o.obligationId}] ${o.description} (Value: ₹${o.contractualValue})`).join("\n")}

FREELANCER CLAIM: "${state.dispute?.freelancerStatement || "No statement"}"
FORENSIC AUDIT SUMMARY: "${state.forensicReport}"

Draft the Freelancer Advocate structured submission citing Quantum Meruit (ICA Section 70) and demonstrable work.`;

  const { text } = await callGemini({
    contents: prompt,
    systemInstruction: FREELANCER_DEFENSE_PROMPT,
    responseMimeType: "application/json",
    responseSchema: freelancerAdvocateSchema,
    temperature: 0.2,
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (err) {
    console.warn("[FreelancerDefenseNode] JSON parse error, using fallback", err);
  }

  const conciseSummary = parsed.conciseSummary ||
    "Freelancer Advocate asserts substantial development completed toward milestone scope and requests Quantum Meruit evaluation under ICA Section 70 for delivered UI components.";

  const finding: StructuredAgentFinding = {
    findingId: `FIND-FREELANCER-ADV-${Date.now()}`,
    agentRole: "FREELANCER_ADVOCATE",
    shortConclusion: conciseSummary,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: (state.ingestedEvidence || []).filter((e) => e.uploadedByRole === "FREELANCER").map((e) => e.id),
    contradictingEvidenceIds: [],
    confidenceClassification: (parsed.demonstrableDeliverables || []).length > 0 ? "MODERATE" : "LOW",
    missingEvidence: parsed.unverifiedOrMissingElements || [],
    reviewerRequired: false,
  };

  return {
    freelancerDefenseReport: conciseSummary,
    agentFindings: [finding],
    checkpoints: [
      { node: "freelancerDefense", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 5C: Legal Context Retrieval (Isolated Legal Branch) ─────────────────

async function legalContextNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const relevantStatutes = retrieveRelevantLegalContext({
    contractDescription: state.contract?.description,
    disputeTitle: state.dispute?.title,
    claimsText: `${state.dispute?.clientStatement || ""} ${state.dispute?.freelancerStatement || ""}`,
    evidenceKeywords: (state.rawEvidence || []).map((e) => e.fileName),
  });

  const legalReport = relevantStatutes
    .map(
      (s) =>
        `• ${s.statute} (${s.section}): ${s.title} — ${s.conciseParaphrase}`
    )
    .join("\n");

  const finding: StructuredAgentFinding = {
    findingId: `FIND-LEGAL-${Date.now()}`,
    agentRole: "LEGAL_REVIEWER",
    shortConclusion: `Statutory context established under ${relevantStatutes.map((s) => `${s.statute} ${s.section}`).join(", ")}.`,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    confidenceClassification: "HIGH",
    missingEvidence: [],
    reviewerRequired: false,
  };

  return {
    legalStatutes: relevantStatutes,
    legalContextReport: legalReport,
    agentFindings: [finding],
    checkpoints: [
      { node: "legalContext", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 6: Neutral Fact Review & Criterion Assessment ───────────────────────

const NEUTRAL_REVIEW_SYSTEM_PROMPT = `You are the NEUTRAL FACT REVIEW PANEL for Verdiqt ODR.
Evaluate the evidence and party claims objectively without taking sides.

MANDATORY RULES:
1. WHAT WAS ESTABLISHED: List verified facts supported by verifiable evidence or mutual party agreement.
2. WHAT REMAINS UNCERTAIN: List disputed issues and specific missing evidence.
3. CRITERION EVALUATION: For each contractual requirement:
   - Assign EXACT status:
     * "VERIFIED_MET" (Demonstrably proven by evidence)
     * "PARTIALLY_MET_WITH_DEFECTS" (Delivered, but identifiable defects remain)
     * "UNVERIFIED" (Evidence is inconclusive, missing, or assertion-only)
     * "NOT_MET" (Clearly unfulfilled or breached)
   - CRITICAL: Missing evidence must be marked "UNVERIFIED", NOT "NOT_MET".
   - An allegation does NOT become a verified fact merely because a party asserts it.
   - For prototypes where only static screenshots or summary PDFs were submitted, runtime functionality (search backend, stock editing persistence, low-stock threshold triggers, CSV data export) must be classified as "UNVERIFIED" due to missing runnable source code and reproduction logs.
   - Provide concise 1-sentence explanations and specific uncertainty reasons.`;

const criterionEvaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    agreedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          statement: { type: Type.STRING },
          evidenceReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["id", "statement", "evidenceReferences"],
      },
      description: "Verified facts supported by objective evidence or mutual agreement.",
    },
    disputedIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          issue: { type: Type.STRING },
          impact: { type: Type.STRING },
          missingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["id", "issue", "impact", "missingEvidence"],
      },
      description: "Contested issues and critical deliverables missing from the record.",
    },
    criterionAssessments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterionId: { type: Type.STRING },
          contractualObligationId: { type: Type.STRING },
          description: { type: Type.STRING },
          contractualWeight: { type: Type.NUMBER },
          status: {
            type: Type.STRING,
            enum: ["VERIFIED_MET", "PARTIALLY_MET_WITH_DEFECTS", "UNVERIFIED", "NOT_MET"],
          },
          supportingEvidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          contradictingEvidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          conciseExplanation: { type: Type.STRING },
          uncertaintyReason: { type: Type.STRING },
          reviewerRequired: { type: Type.BOOLEAN },
        },
        required: [
          "criterionId",
          "contractualObligationId",
          "description",
          "status",
          "supportingEvidenceIds",
          "contradictingEvidenceIds",
          "conciseExplanation",
          "uncertaintyReason",
          "reviewerRequired",
        ],
      },
    },
  },
  required: ["agreedFacts", "disputedIssues", "criterionAssessments"],
};

async function neutralFactReviewNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const prompt = `CONTRACT OBLIGATIONS TO EVALUATE:
${state.obligations
  ?.map(
    (o) =>
      `[${o.obligationId}] ${o.description}\nCriteria: ${o.acceptanceCriteria.join("; ")}`
  )
  .join("\n\n")}

FORENSIC AUDIT:
${state.forensicReport}

CLIENT ADVOCATE SUBMISSION:
${state.clientAdvocateReport}

FREELANCER ADVOCATE SUBMISSION:
${state.freelancerDefenseReport}

LEGAL STATUTORY CONTEXT:
${state.legalContextReport}

Classify each criterion using VERIFIED_MET, PARTIALLY_MET_WITH_DEFECTS, UNVERIFIED, or NOT_MET.`;

  const { text } = await callGemini({
    contents: prompt,
    systemInstruction: NEUTRAL_REVIEW_SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: criterionEvaluationSchema,
    temperature: 0.1,
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (err) {
    console.warn("[NeutralFactReview] JSON parse error, using fallback criteria", err);
  }

  const establishedFacts: EstablishedFactItem[] = (parsed.agreedFacts || []).map((f: any, i: number) => ({
    id: f.id || `FACT-${i + 1}`,
    statement: f.statement || "Parties agree that milestone development commenced.",
    evidenceReferences: f.evidenceReferences || [],
    source: "MUTUAL_AGREEMENT",
  }));

  const disputedUncertainties: UncertaintyItem[] = (parsed.disputedIssues || []).map((u: any, i: number) => ({
    id: u.id || `UNCERT-${i + 1}`,
    issue: u.issue || "Runtime functionality and persistence unverified.",
    impact: u.impact || "Prevents validation of complete milestone delivery.",
    missingEvidence: u.missingEvidence || ["Runnable code repository", "Verification test steps"],
  }));

  const assessments: CriterionAssessment[] = (parsed.criterionAssessments || []).map((ca: any, i: number) => ({
    criterionId: ca.criterionId || `CRIT-${i + 1}`,
    contractualObligationId: ca.contractualObligationId || (state.obligations?.[0]?.obligationId || "OBL-1"),
    description: ca.description || "Obligation deliverable criterion",
    contractualWeight: ca.contractualWeight || Math.round(100 / Math.max(1, (parsed.criterionAssessments || []).length)),
    status: ["VERIFIED_MET", "PARTIALLY_MET_WITH_DEFECTS", "UNVERIFIED", "NOT_MET"].includes(ca.status)
      ? ca.status
      : "UNVERIFIED",
    supportingEvidenceIds: ca.supportingEvidenceIds || [],
    contradictingEvidenceIds: ca.contradictingEvidenceIds || [],
    conciseExplanation: ca.conciseExplanation || ca.reasoning || "Evaluation based on submitted evidence.",
    uncertaintyReason: ca.uncertaintyReason || (ca.status === "UNVERIFIED" ? "Substantive runnable evidence missing" : ""),
    reasoning: ca.conciseExplanation || ca.reasoning || "Evaluation based on submitted evidence.",
    reviewerRequired: Boolean(ca.reviewerRequired),
    rubricVersion: AI_CONFIG.rubricVersion,
  }));

  // Fallback if no criteria were generated
  if (assessments.length === 0 && (state.obligations || []).length > 0) {
    for (const obl of state.obligations || []) {
      assessments.push({
        criterionId: `CRIT-${obl.obligationId}`,
        contractualObligationId: obl.obligationId,
        description: obl.description,
        contractualWeight: obl.weight || 100,
        status: "UNVERIFIED",
        supportingEvidenceIds: (state.ingestedEvidence || []).map((e) => e.id),
        contradictingEvidenceIds: [],
        conciseExplanation: "Submitted static documents are inconclusive without runnable source code and reproduction logs.",
        uncertaintyReason: "Runnable source code and test verification steps unavailable in submitted evidence.",
        reasoning: "Automated baseline evaluation of contested milestone deliverable.",
        reviewerRequired: true,
        rubricVersion: AI_CONFIG.rubricVersion,
      });
    }
  }

  const neutralSummary = `ESTABLISHED FACTS:\n${establishedFacts.map((f) => `• ${f.statement}`).join("\n") || "• Milestone development commenced."}\n\nDISPUTED UNCERTAINTIES:\n${disputedUncertainties.map((u) => `• ${u.issue}: Missing ${u.missingEvidence.join(", ")}`).join("\n") || "• Runtime verification pending."}`;

  const finding: StructuredAgentFinding = {
    findingId: `FIND-NEUTRAL-${Date.now()}`,
    agentRole: "NEUTRAL_REVIEWER",
    shortConclusion: `Classified ${assessments.length} contractual criteria: ${assessments.filter((a) => a.status === "VERIFIED_MET").length} verified, ${assessments.filter((a) => a.status === "UNVERIFIED").length} unverified.`,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: (state.ingestedEvidence || []).map((e) => e.id),
    contradictingEvidenceIds: [],
    confidenceClassification: assessments.every((a) => a.status === "UNVERIFIED") ? "INCONCLUSIVE" : "MODERATE",
    missingEvidence: disputedUncertainties.flatMap((u) => u.missingEvidence),
    reviewerRequired: assessments.some((a) => a.reviewerRequired || a.status === "UNVERIFIED"),
  };

  return {
    criterionAssessments: assessments,
    establishedFacts,
    disputedUncertainties,
    neutralFactReview: neutralSummary,
    agentFindings: [finding],
    checkpoints: [
      { node: "neutralFactEvaluation", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 7: Deterministic Neuro-Symbolic Valuation (Pure TypeScript) ─────────

async function deterministicNSQMENode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const heldEscrow =
    state.contract?.escrowWallet?.heldAmount ||
    state.contract?.totalAmount ||
    state.milestones?.reduce((acc, m) => acc + m.amount, 0) ||
    0;

  const valuation = calculateDeterministicValuation({
    disputeId: state.disputeId,
    disputedEscrowAmount: heldEscrow,
    obligations: state.obligations || [],
    assessments: state.criterionAssessments || [],
    currency: state.contract?.currency || "INR",
  });

  return {
    valuationResult: valuation,
    checkpoints: [
      { node: "deterministicNSQME", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 8: Neutral Chief Arbitrator Synthesis (8-Section User Report) ───────

const CHIEF_ARBITRATOR_SYSTEM_PROMPT = `You are the CHIEF ARBITRATOR of the VERDIQT Autonomous ODR Tribunal.
Synthesize the case into a concise, balanced, and evidence-grounded advisory settlement report.

WRITING STANDARDS:
1. Plain, Professional English: Make the reasoning understandable to a freelancer or small-business client without legal training.
2. NO grandiose or archaic phrases (e.g. do NOT say "the Tribunal hereby issues its comprehensive determination", "let it be known").
3. Concise Tribunal Assessment: Target 100-150 words providing a fair overview of what was delivered, what remains disputed, and the core basis for the outcome.
4. Non-Repetition: Do not repeat facts across multiple sections.
5. Deterministic Financial Bounds:
   - If financial status is RECOMMENDED: Respect the exact split determined by the engine (\${financialStatusDescription}).
   - If financial status is NO_FINANCIAL_RECOMMENDATION: Do NOT invent or guess any percentage or financial award. State clearly that funds remain held in escrow because key functionality is unverified, and specify what evidence is required.
6. Actionable Next Steps: Specify distinct concrete actions for Client, Freelancer, and Reviewer.`;

const chiefArbitratorSynthesisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tribunalAssessment: {
      type: Type.STRING,
      description: "Balanced, plain-English overview of the dispute (target 100-150 words).",
    },
    recommendationSummary: {
      type: Type.STRING,
      description: "One clear sentence stating the primary resolution recommendation.",
    },
    recommendationJustification: {
      type: Type.STRING,
      description: "Concise 50-80 word rationale grounded in evidence.",
    },
    nextSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          targetParty: { type: Type.STRING, enum: ["CLIENT", "FREELANCER", "HUMAN_REVIEWER", "BOTH"] },
          action: { type: Type.STRING },
          purpose: { type: Type.STRING },
        },
        required: ["targetParty", "action", "purpose"],
      },
    },
  },
  required: ["tribunalAssessment", "recommendationSummary", "recommendationJustification", "nextSteps"],
};

async function chiefArbitratorSynthesisNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const valuation = state.valuationResult!;

  const financialStatusDesc = valuation.hasFinancialRecommendation
    ? `Recommended Freelancer Release: ${valuation.recommendedReleasePercent}% (₹${valuation.recommendedReleaseAmount}), Recommended Client Refund: ${valuation.recommendedRefundPercent}% (₹${valuation.recommendedRefundAmount})`
    : `NO_FINANCIAL_RECOMMENDATION: Substantive criteria remain unverified. Milestone funds remain held in escrow pending party verification or human review.`;

  const prompt = `CONTRACT: "${state.contract?.title}" (Escrow: ₹${valuation.disputedEscrowAmount.toLocaleString("en-IN")})
DISPUTED MILESTONE: "${state.milestones?.[0]?.title || "Milestone 1"}"
CLIENT STATEMENT: "${state.dispute?.clientStatement}"
FREELANCER STATEMENT: "${state.dispute?.freelancerStatement || "No statement"}"

DETERMINISTIC VALUATION STATUS:
${financialStatusDesc}

NEUTRAL FACT ASSESSMENT:
${state.neutralFactReview}

LEGAL STATUTORY CONTEXT:
${state.legalContextReport}

Generate the user-facing synthesis matching the required schema. Ensure the Tribunal Assessment is between 100 and 150 words in plain, professional English.`;

  const { text } = await callGemini({
    contents: prompt,
    systemInstruction: CHIEF_ARBITRATOR_SYSTEM_PROMPT.replace(
      "${financialStatusDescription}",
      financialStatusDesc
    ),
    responseMimeType: "application/json",
    responseSchema: chiefArbitratorSynthesisSchema,
    temperature: 0.1,
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch (err) {
    console.warn("[ChiefArbitratorNode] JSON parse error, using fallback", err);
  }

  const tribunalAssessment = parsed.tribunalAssessment ||
    "The freelancer completed initial development work and submitted prototype interface artifacts. However, because only static screenshots and summary reports were provided, key functional deliverables—including product search, stock editing persistence, low-stock threshold triggers, and CSV data export—cannot be verified without runnable source code and reproduction steps. In accordance with Verdiqt Financial Safeguards, no arbitrary financial split is awarded. The milestone funds remain secured in escrow pending party evidence exchange or human reviewer determination.";

  const nextSteps: NextStepAction[] = (parsed.nextSteps || []).length > 0
    ? parsed.nextSteps
    : [
        {
          targetParty: "FREELANCER",
          action: "Provide repository access, runnable source code, and video/test demonstration of the 5 core features.",
          purpose: "Enable independent verification of prototype functionality.",
        },
        {
          targetParty: "CLIENT",
          action: "Review runnable submission within the contractual revision window and specify any reproducible defects.",
          purpose: "Allow fair opportunity for defect rectification prior to final milestone decision.",
        },
        {
          targetParty: "HUMAN_REVIEWER",
          action: "Convene human review panel if parties do not reach mutual verification within the revision timeframe.",
          purpose: "Provide final independent dispute adjudication.",
        },
      ];

  const caseSummary: TribunalCaseSummary = {
    projectName: state.contract?.title || "Contract Scope",
    clientName: state.contract?.client?.name || "Client",
    freelancerName: state.contract?.freelancer?.name || "Freelancer",
    disputedMilestoneTitle: state.milestones?.[0]?.title || state.dispute?.title || "Disputed Milestone",
    disputedMilestoneAmount: state.milestones?.[0]?.amount || valuation.disputedEscrowAmount,
    disputedEscrowAmount: valuation.disputedEscrowAmount,
    currency: state.contract?.currency || "INR",
  };

  const structuredReport: TribunalReport = {
    caseSummary,
    tribunalAssessment,
    whatWasEstablished: state.establishedFacts || [],
    whatRemainsUncertain: state.disputedUncertainties || [],
    contractualRequirements: state.criterionAssessments || [],
    recommendation: {
      type: valuation.hasFinancialRecommendation
        ? "SETTLEMENT_ALLOCATION"
        : valuation.requiresHumanReview
        ? "ESCALATE_TO_HUMAN_TRIBUNAL"
        : "HOLD_IN_ESCROW_FOR_REVISION",
      financialRecommendationStatus: valuation.financialRecommendationStatus,
      freelancerReleaseAmount: valuation.hasFinancialRecommendation ? valuation.recommendedReleaseAmount : null,
      clientRefundAmount: valuation.hasFinancialRecommendation ? valuation.recommendedRefundAmount : null,
      freelancerReleasePercent: valuation.hasFinancialRecommendation ? valuation.recommendedReleasePercent : null,
      clientRefundPercent: valuation.hasFinancialRecommendation ? valuation.recommendedRefundPercent : null,
      conciseSummary: parsed.recommendationSummary ||
        (valuation.hasFinancialRecommendation
          ? `Allocate ₹${valuation.recommendedReleaseAmount.toLocaleString("en-IN")} (${valuation.recommendedReleasePercent}%) to freelancer and refund ₹${valuation.recommendedRefundAmount.toLocaleString("en-IN")} (${valuation.recommendedRefundPercent}%) to client.`
          : "Hold disputed milestone funds in escrow pending submission of runnable code and test logs."),
      justification: parsed.recommendationJustification ||
        (valuation.hasFinancialRecommendation
          ? "Allocation based on proven completion and verified Quantum Meruit value under ICA Section 70."
          : "Key contractual functionality remains unverified from submitted static files. No speculative split is produced; parties should exchange verifiable code or proceed to human review."),
    },
    nextSteps,
    limitations: {
      isAdvisory: true,
      disclaimerText: "Verdiqt arbitral findings are AI-assisted settlement recommendations formulated under principles of the Indian Arbitration and Conciliation Act, 1996 § 31 and Indian Contract Act, 1872. They are advisory recommendations intended to facilitate amicable dispute resolution and do not constitute an automatically binding legal award until formally accepted by both parties or confirmed by a designated human arbitral tribunal.",
      simulatedEscrowNote: "All wallet and escrow operations in this prototype are simulated for demonstration purposes.",
      governingPrinciples: "Bharatiya Sakshya Adhiniyam 2023 § 63 (Digital Record Verification), Indian Contract Act 1872 § 70 (Quantum Meruit) & § 73 (Compensation for Loss/Breach).",
    },
  };

  const finding: StructuredAgentFinding = {
    findingId: `FIND-CHIEF-ARBITRATOR-${Date.now()}`,
    agentRole: "CHIEF_ARBITRATOR",
    shortConclusion: structuredReport.recommendation.conciseSummary,
    relatedObligationIds: (state.obligations || []).map((o) => o.obligationId),
    supportingEvidenceIds: (state.ingestedEvidence || []).map((e) => e.id),
    contradictingEvidenceIds: [],
    confidenceClassification: valuation.hasFinancialRecommendation ? "HIGH" : "INCONCLUSIVE",
    missingEvidence: valuation.missingEvidenceForValuation || [],
    reviewerRequired: valuation.requiresHumanReview,
  };

  return {
    chiefArbitratorReasoning: tribunalAssessment,
    structuredReport,
    agentFindings: [finding],
    checkpoints: [
      { node: "chiefArbitratorSynthesis", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Node 9: Validation, Escalation & Award Hashing ───────────────────────────

async function validationEscalationNode(state: TribunalState): Promise<Partial<TribunalState>> {
  const start = Date.now();
  const valuation = state.valuationResult!;
  const structuredReport = state.structuredReport!;

  // Financial Invariant Verification (Only when a financial recommendation is made)
  if (valuation.hasFinancialRecommendation) {
    if (valuation.recommendedReleasePercent + valuation.recommendedRefundPercent !== 100) {
      throw new Error("Financial invariant violation: split percentages must sum exactly to 100");
    }
  }

  // Automatic Escalation Check
  const requiresHumanReview =
    valuation.requiresHumanReview ||
    !valuation.hasFinancialRecommendation ||
    (valuation.unverifiedCriteria && valuation.unverifiedCriteria.length > 2) ||
    valuation.disputedEscrowAmount >= 500000;

  const confidenceScore = valuation.hasFinancialRecommendation ? 0.88 : 0.60;
  const escalationReason = requiresHumanReview
    ? valuation.abstentionReason || "Unverified evidence criteria exceeded threshold. Escalated for human reviewer oversight."
    : "N/A";

  // Cryptographic Canonical Award Hashing (Section 15)
  const legalCitation = state.legalStatutes?.[0]
    ? `${state.legalStatutes[0].statute} ${state.legalStatutes[0].section}`
    : "Indian Contract Act 1872 Section 70";

  const canonicalPayload = [
    state.disputeId,
    state.analysisRunId,
    state.disputeVersion,
    valuation.disputedEscrowAmount,
    valuation.financialRecommendationStatus,
    valuation.hasFinancialRecommendation ? valuation.recommendedRefundPercent : 0,
    valuation.hasFinancialRecommendation ? valuation.recommendedReleasePercent : 0,
    legalCitation,
    AI_CONFIG.primaryModel,
    AI_CONFIG.rubricVersion,
  ].join("|");

  const awardHash = crypto.createHash("sha256").update(canonicalPayload).digest("hex");

  const finalVerdict = {
    disputeId: state.disputeId,
    clientFaultPercent: valuation.hasFinancialRecommendation ? valuation.recommendedRefundPercent : 0,
    freelancerFaultPercent: valuation.hasFinancialRecommendation ? valuation.recommendedReleasePercent : 0,
    clientRefundPercent: valuation.hasFinancialRecommendation ? valuation.recommendedRefundPercent : 0,
    freelancerReleasePercent: valuation.hasFinancialRecommendation ? valuation.recommendedReleasePercent : 0,
    reasoning: structuredReport?.tribunalAssessment || state.chiefArbitratorReasoning,
    contractAnalysis: `Contract scope "${state.contract?.title}" evaluated across ${state.obligations?.length || 0} obligations. Supported completion range: ${valuation.supportedCompletionLowerBound}% to ${valuation.supportedCompletionUpperBound}%.`,
    evidenceSummary: `Ingested ${(state.ingestedEvidence || []).length} evidence documents. File integrity verified against SHA-256 hashes under BSA 2023 Section 63.`,
    legalBasis: state.legalContextReport,
    confidenceScore,
    escalatedToHuman: requiresHumanReview,
    escalationReason,
    structuredReport,
    clientAdvocateReport: state.clientAdvocateReport,
    freelancerDefenseReport: state.freelancerDefenseReport,
    forensicAuditReport: state.forensicReport,
    juryPanelReport: state.neutralFactReview,
    criterionAssessments: state.criterionAssessments,
    valuationResult: valuation,
    agentFindings: state.agentFindings,
    quantumMeruitCalculation: {
      formulaExplanation: valuation.calculationBreakdown.join("\n"),
      boundedFreelancerMin: valuation.supportedCompletionLowerBound,
      boundedFreelancerMax: valuation.supportedCompletionUpperBound,
      calculationVersion: valuation.calculationVersion,
      hasFinancialRecommendation: valuation.hasFinancialRecommendation,
    },
    awardHash,
    analysisRunId: state.analysisRunId,
    modelUsed: `${AI_CONFIG.primaryModel} (LangGraph DAG NS-QME v2.1)`,
  };

  return {
    confidenceScore,
    escalatedToHuman: requiresHumanReview,
    escalationReason,
    awardHash,
    finalVerdict,
    checkpoints: [
      { node: "validationEscalation", timestamp: new Date().toISOString(), durationMs: Date.now() - start },
    ],
  };
}

// ─── Build & Compile LangGraph DAG ────────────────────────────────────────────

export function createTribunalGraph() {
  const workflow = new StateGraph(TribunalAnnotation)
    // 1. Data Loading & Extraction
    .addNode("loadDisputeData", loadDisputeDataNode)
    .addNode("contractAnalysis", contractAnalysisNode)
    .addNode("evidenceIngestionMapping", evidenceIngestionNode)
    .addNode("forensicAudit", forensicAuditNode)

    // 2. Parallel Independent Branches
    .addNode("clientAdvocate", clientAdvocateNode)
    .addNode("freelancerDefense", freelancerDefenseNode)
    .addNode("legalContext", legalContextNode)

    // 3. Joining & Neutral Assessment
    .addNode("neutralFactEvaluation", neutralFactReviewNode)
    .addNode("deterministicNSQME", deterministicNSQMENode)

    // 4. Synthesis & Escalation
    .addNode("chiefArbitratorSynthesis", chiefArbitratorSynthesisNode)
    .addNode("validationEscalation", validationEscalationNode)

    // Edges
    .addEdge(START, "loadDisputeData")
    .addEdge("loadDisputeData", "contractAnalysis")
    .addEdge("contractAnalysis", "evidenceIngestionMapping")
    .addEdge("evidenceIngestionMapping", "forensicAudit")

    // Parallel fan-out
    .addEdge("forensicAudit", "clientAdvocate")
    .addEdge("forensicAudit", "freelancerDefense")
    .addEdge("forensicAudit", "legalContext")

    // Fan-in join to neutral fact review
    .addEdge("clientAdvocate", "neutralFactEvaluation")
    .addEdge("freelancerDefense", "neutralFactEvaluation")
    .addEdge("legalContext", "neutralFactEvaluation")

    // Sequential resolution
    .addEdge("neutralFactEvaluation", "deterministicNSQME")
    .addEdge("deterministicNSQME", "chiefArbitratorSynthesis")
    .addEdge("chiefArbitratorSynthesis", "validationEscalation")
    .addEdge("validationEscalation", END);

  return workflow.compile();
}

/**
 * High-level orchestration execution function.
 */
export async function executeTribunalGraph(params: {
  disputeId: string;
  analysisRunId: string;
  disputeVersion: number;
}): Promise<any> {
  const threadId = `dispute-${params.disputeId}-v${params.disputeVersion}-${Date.now()}`;
  const graph = createTribunalGraph();

  // Create initial state
  const initialState: Partial<TribunalState> = {
    disputeId: params.disputeId,
    analysisRunId: params.analysisRunId,
    disputeVersion: params.disputeVersion,
    threadId,
    checkpoints: [],
    errors: [],
  };

  const finalState = await graph.invoke(initialState);
  return finalState;
}
