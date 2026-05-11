import { GoogleGenAI, Type, Schema } from "@google/genai";

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

Note: clientRefundPercent + freelancerReleasePercent must equal 100.
Note: clientFaultPercent + freelancerFaultPercent must equal 100.
`;

  // Initialize Gemini client using their new standard SDK
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-2.5-flash";

  // Define the JSON schema for structured output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      clientFaultPercent: {
        type: Type.INTEGER,
        description: "0-100",
      },
      freelancerFaultPercent: {
        type: Type.INTEGER,
        description: "0-100",
      },
      clientRefundPercent: {
        type: Type.INTEGER,
        description: "0-100, percentage of total escrow to refund client",
      },
      freelancerReleasePercent: {
        type: Type.INTEGER,
        description: "0-100, percentage of total escrow to release to freelancer",
      },
      reasoning: {
        type: Type.STRING,
        description: "3-5 sentence plain English explanation of the verdict",
      },
      contractAnalysis: {
        type: Type.STRING,
        description: "2-3 sentences analyzing how well deliverables matched contract scope",
      },
      evidenceSummary: {
        type: Type.STRING,
        description: "1-2 sentences on how evidence influenced the decision",
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: "0.0-1.0",
      },
      escalatedToHuman: {
        type: Type.BOOLEAN,
        description: "true if confidence < 0.6 or case is genuinely ambiguous, else false",
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
      "confidenceScore",
      "escalatedToHuman",
    ],
  };

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2, // Low temperature for consistent analysis
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

  // Safety clamp
  verdict.confidenceScore = Math.max(0, Math.min(1, verdict.confidenceScore));
  if (verdict.confidenceScore < 0.6) verdict.escalatedToHuman = true;

  return verdict;
}
