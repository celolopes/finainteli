/**
 * Gemini Pricing Constants (Paid Tier)
 * Based on Google AI Studio pricing as of early 2026.
 */
export const GEMINI_PRICING = {
  "gemini-2.5-flash": {
    inputPer1M: 0.3, // USD
    outputPer1M: 2.5, // USD
  },
  "gemini-3-flash-preview": {
    inputPer1M: 0.5, // USD
    outputPer1M: 3.0, // USD
  },
  "gemini-1.5-flash": {
    inputPer1M: 0.075,
    outputPer1M: 0.3,
  },
  "gemini-2.0-flash": {
    inputPer1M: 0.1,
    outputPer1M: 0.4,
  },
};

export let USD_TO_BRL_RATE = 5.4;

export const updateUsdBrlRate = (newRate: number) => {
  USD_TO_BRL_RATE = newRate;
};

/**
 * Calculates the cost of a model call in BRL.
 */
export function calculateAICost(modelId: string, promptTokens: number, candidatesTokens: number, rate?: number): number {
  const model = GEMINI_PRICING[modelId as keyof typeof GEMINI_PRICING] || GEMINI_PRICING["gemini-2.5-flash"];

  const inputCost = (promptTokens / 1_000_000) * model.inputPer1M;
  const outputCost = (candidatesTokens / 1_000_000) * model.outputPer1M;

  return (inputCost + outputCost) * (rate || USD_TO_BRL_RATE);
}
