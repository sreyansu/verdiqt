/**
 * Verdiqt — Centralized AI Model Configuration
 * Centralizes model targets, thinking parameters, versioning, and fallback rules.
 */

export interface ModelConfiguration {
  primaryModel: string;
  fallbackModel: string;
  thinkingBudget: number; // 2048 = Medium Thinking budget
  promptVersion: string;
  agentVersion: string;
  rubricVersion: string;
  legalCorpusVersion: string;
}

export const AI_CONFIG: ModelConfiguration = {
  primaryModel: process.env.GEMINI_MODEL || "gemini-4-hydrogen",
  fallbackModel: process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash",
  thinkingBudget: parseInt(process.env.GEMINI_THINKING_BUDGET || "2048", 10), // Medium thinking
  promptVersion: "v2.0-hydrogen-odr",
  agentVersion: "v2.0-langgraph",
  rubricVersion: "v2.0-deterministic-qme",
  legalCorpusVersion: "v2024-ICA-BSA-ACA",
};

/**
 * Returns thinkingConfig object for Google GenAI SDK.
 */
export function getThinkingConfig(budget: number = AI_CONFIG.thinkingBudget) {
  if (budget <= 0) {
    return { thinkingBudget: 0 };
  }
  return {
    thinkingBudget: budget,
  };
}

