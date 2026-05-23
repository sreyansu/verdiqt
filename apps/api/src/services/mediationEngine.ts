import { GoogleGenAI, Type, Schema } from "@google/genai";

// ─── Interfaces ─────────────────────────────────────────────────────────────────

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
  evidenceSummaries: string[];
  disputeTitle: string;
}

export interface ChallengeContext {
  reason: string;
  count: number;
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
}

// ─── System Prompt (Layer 1) ────────────────────────────────────────────────────
// Legally-grounded prompt with 5 legal pillars, ethical principles,
// and a 7-step structured reasoning methodology.

const SYSTEM_PROMPT = `You are VERDIQT ARBITRATOR, a neutral AI dispute mediator for an escrow-based freelance platform operating under Indian jurisdiction.

LEGAL FRAMEWORK — Apply these provisions in your analysis:
1. Indian Contract Act, 1872:
   - §37: Parties must perform their contractual obligations (milestones/deliverables).
   - §39: If one party refuses to perform, the other may treat the contract as rescinded.
   - §55: When time is of the essence, failure to perform on time voids the contract at the option of the promisee.
   - §73: Compensation for loss or damage caused by breach — only damages naturally arising from the breach.
   - §74: Liquidated damages — if the contract names a sum to be paid on breach, the breaching party is liable for that amount (or reasonable amount).
   - Quantum Meruit: A party who has performed part of a contract is entitled to fair compensation for work done, even if the contract is not fully completed.
2. Information Technology Act, 2000:
   - §10A: Electronic contracts formed via this platform are valid and enforceable.
   - Digital evidence (screenshots, files, chat logs) submitted through this platform is admissible under §65B of Bhartiya Sakshya Adhiniyam, 2023.
3. Arbitration and Conciliation Act, 1996:
   - §28: Decide based on substantive law, contract terms, and trade usages applicable to the transaction.
   - §31: Award must state reasons upon which it is based.
4. Consumer Protection Act, 2019:
   - §2(11): Evaluate service deficiency — any fault, imperfection, shortcoming, or inadequacy in the quality, nature, or manner of performance.

ETHICAL PRINCIPLES (UNCITRAL ODR Technical Notes, 2017):
- FAIRNESS: Give equal weight to both parties' evidence and claims.
- AUDI ALTERAM PARTEM: Consider both statements. Never decide on one side alone.
- PROPORTIONALITY: Fund split must be proportionate to fault degree, not punitive.
- TRANSPARENCY: Reasoning must be clear and traceable to specific contract terms or evidence.
- IMPARTIALITY: Never categorically favor clients or freelancers. Each case is unique.
- DUE PROCESS: Both parties have been given opportunity to present their case on this platform.

REASONING METHODOLOGY — Follow these 7 steps in exact order:
Step 1 — CONTRACT ANALYSIS: What was agreed? Parse milestones, deliverables, deadlines, payment terms.
Step 2 — PERFORMANCE ASSESSMENT: What was actually delivered vs. promised? Assess completion percentage per milestone.
Step 3 — BREACH IDENTIFICATION: Who breached? Material breach (total failure) vs. minor breach (partial/late delivery).
Step 4 — EVIDENCE EVALUATION: What does evidence prove? Rate strength: strong/moderate/weak/absent.
Step 5 — FAULT APPORTIONMENT: Assign fault proportionally. Consider contributory negligence (e.g., vague specs from client, no clarification sought by freelancer).
Step 6 — REMEDY CALCULATION: Apply Quantum Meruit for partial work. Split escrow proportional to fault. clientRefundPercent + freelancerReleasePercent must equal 100.
Step 7 — CONFIDENCE ASSESSMENT: Lower confidence if evidence is contradictory, statements unverifiable, or case involves subjective quality judgments.

ESCALATION CRITERIA — Set escalatedToHuman = true if ANY apply:
- Confidence score < 0.6
- Evidence from both sides is equally strong and contradictory
- Allegations of fraud or intentional misrepresentation
- Contract terms are ambiguous and could reasonably support either interpretation
- The case requires assessment of creative/subjective quality that exceeds AI capability`;

// ─── User Prompt Builder (Layer 2) ──────────────────────────────────────────────
// Uses XML-style delimiters for clarity and token efficiency.

function buildUserPrompt(
  input: MediationInput,
  challengeContext?: ChallengeContext
): string {
  const milestoneXml = input.milestones
    .map(
      (m, i) =>
        `<m id="${i + 1}" status="${m.status}" amount="${m.amount}" due="${m.dueDate}">${m.title}: ${m.description}</m>`
    )
    .join("\n");

  const evidenceXml =
    input.evidenceSummaries.length > 0
      ? input.evidenceSummaries
          .map((e, i) => `<item id="${i + 1}">${e}</item>`)
          .join("\n")
      : "<none/>";

  const challengeXml = challengeContext
    ? `\n<challenge attempt="${challengeContext.count}" reason="${challengeContext.reason}">This dispute was previously analyzed and the verdict was challenged. Re-evaluate carefully considering the challenge reason. You may reach a different conclusion if the challenge raises valid points.</challenge>`
    : "";

  return `<contract>
<title>${input.contractTitle}</title>
<scope>${input.contractDescription}</scope>
<value>${input.totalAmount}</value>
</contract>

<milestones>
${milestoneXml}
</milestones>

<dispute title="${input.disputeTitle}">
<client_statement>${input.clientStatement}</client_statement>
<freelancer_statement>${input.freelancerStatement || "Not yet submitted."}</freelancer_statement>
</dispute>

<evidence>
${evidenceXml}
</evidence>
${challengeXml}

Apply the 7-step reasoning methodology. Ensure clientFaultPercent + freelancerFaultPercent = 100 and clientRefundPercent + freelancerReleasePercent = 100. Cite specific legal provisions in legalBasis.`;
}

// ─── Response Schema (Layer 3) ──────────────────────────────────────────────────
// Gemini structured output — forces JSON, zero wasted tokens.

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
      description:
        "3-5 sentence plain English explanation of the verdict following the 7-step methodology",
    },
    contractAnalysis: {
      type: Type.STRING,
      description:
        "2-3 sentences analyzing how well deliverables matched contract scope",
    },
    evidenceSummary: {
      type: Type.STRING,
      description:
        "1-2 sentences on how evidence influenced the decision and its strength",
    },
    legalBasis: {
      type: Type.STRING,
      description:
        "Cite specific legal provisions applied, e.g. 'Quantum Meruit applied for partial delivery under ICA §73; service deficiency found under CPA §2(11)'",
    },
    escalationReason: {
      type: Type.STRING,
      description:
        "If escalatedToHuman is true, explain why in 1 sentence. If false, write 'N/A'",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "0.0-1.0 confidence in this verdict",
    },
    escalatedToHuman: {
      type: Type.BOOLEAN,
      description:
        "true if any escalation criteria are met, false otherwise",
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

// ─── Main Engine ────────────────────────────────────────────────────────────────

export async function runMediationEngine(
  input: MediationInput,
  challengeContext?: ChallengeContext
): Promise<MediationVerdict> {
  const userPrompt = buildUserPrompt(input, challengeContext);

  // Initialize Gemini client
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2, // Low temperature for consistent, deterministic analysis
    },
  });

  const rawText = response.text || "{}";
  let verdict: MediationVerdict;

  try {
    verdict = JSON.parse(rawText);
  } catch (error) {
    console.error("Failed to parse Gemini output:", rawText);
    throw new Error("Invalid response format from AI");
  }

  // ─── Post-processing safety clamps ─────────────────────────────────────────

  // Clamp confidence to [0, 1]
  verdict.confidenceScore = Math.max(0, Math.min(1, verdict.confidenceScore));

  // Auto-escalate if confidence is too low
  if (verdict.confidenceScore < 0.6) {
    verdict.escalatedToHuman = true;
    if (!verdict.escalationReason || verdict.escalationReason === "N/A") {
      verdict.escalationReason = `Low confidence score (${verdict.confidenceScore.toFixed(2)}) — insufficient evidence or ambiguous case.`;
    }
  }

  // Ensure fault percentages sum to 100
  const faultSum = verdict.clientFaultPercent + verdict.freelancerFaultPercent;
  if (faultSum !== 100) {
    const ratio = verdict.clientFaultPercent / (faultSum || 1);
    verdict.clientFaultPercent = Math.round(ratio * 100);
    verdict.freelancerFaultPercent = 100 - verdict.clientFaultPercent;
  }

  // Ensure fund split percentages sum to 100
  const fundSum = verdict.clientRefundPercent + verdict.freelancerReleasePercent;
  if (fundSum !== 100) {
    const ratio = verdict.clientRefundPercent / (fundSum || 1);
    verdict.clientRefundPercent = Math.round(ratio * 100);
    verdict.freelancerReleasePercent = 100 - verdict.clientRefundPercent;
  }

  return verdict;
}
