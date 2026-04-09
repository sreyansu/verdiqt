import { anthropic } from "../lib/anthropic";

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

const SYSTEM_PROMPT = `You are Verdiqt, a neutral AI dispute mediator for a freelance escrow platform. 
Your role is to analyze disputes fairly and objectively, considering:
1. The original contract terms and milestone definitions
2. Both parties' statements without bias
3. Evidence provided by either party
4. Standard freelance industry norms and practices

You must return ONLY a valid JSON object — no preamble, no markdown, no explanation outside the JSON.
Base your analysis strictly on the provided information. If information is insufficient, reflect that in a lower confidence score.
Never favor one party type (client vs freelancer) categorically.`;

export async function runMediationEngine(
  input: MediationInput
): Promise<MediationVerdict> {
  const userPrompt = `
Analyze the following freelance dispute and return a mediation verdict.

## CONTRACT DETAILS
Title: ${input.contractTitle}
Description: ${input.contractDescription}
Total Amount: ₹${input.totalAmount}

## MILESTONES
${input.milestones
  .map(
    (m, i) => `${i + 1}. ${m.title}
   Description: ${m.description}
   Amount: ₹${m.amount}
   Due Date: ${m.dueDate}
   Status: ${m.status}`
  )
  .join("\n\n")}

## DISPUTE
Title: ${input.disputeTitle}

Client's Statement:
"${input.clientStatement}"

Freelancer's Response:
"${input.freelancerStatement || "No response submitted yet."}"

## EVIDENCE SUMMARIES
${
  input.evidenceSummaries.length > 0
    ? input.evidenceSummaries.map((e, i) => `${i + 1}. ${e}`).join("\n")
    : "No evidence submitted."
}

---

Return ONLY this JSON structure:
{
  "clientFaultPercent": <0-100>,
  "freelancerFaultPercent": <0-100>,
  "clientRefundPercent": <0-100, percentage of total escrow to refund client>,
  "freelancerReleasePercent": <0-100, percentage of total escrow to release to freelancer>,
  "reasoning": "<3-5 sentence plain English explanation of the verdict>",
  "contractAnalysis": "<2-3 sentences analyzing how well deliverables matched contract scope>",
  "evidenceSummary": "<1-2 sentences on how evidence influenced the decision>",
  "confidenceScore": <0.0-1.0>,
  "escalatedToHuman": <true if confidence < 0.6 or case is genuinely ambiguous, else false>
}

Note: clientRefundPercent + freelancerReleasePercent must equal 100.
Note: clientFaultPercent + freelancerFaultPercent must equal 100.
`;

  const isDev = process.env.NODE_ENV !== "production";
  const model = isDev ? "claude-3-5-haiku-20241022" : "claude-3-7-sonnet-20250219";

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const clean = rawText.replace(/```json|```/g, "").trim();
  const verdict: MediationVerdict = JSON.parse(clean);

  // Safety clamp
  verdict.confidenceScore = Math.max(0, Math.min(1, verdict.confidenceScore));
  if (verdict.confidenceScore < 0.6) verdict.escalatedToHuman = true;

  return verdict;
}
