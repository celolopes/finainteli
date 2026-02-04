import { calculateAICost, USD_TO_BRL_RATE } from "../aiPricing";

describe("AI Pricing Logic", () => {
  it("should calculate correct cost for Gemini 3 Flash", () => {
    // 1M input tokens = $0.50
    // 1M output tokens = $3.00

    const promptTokens = 1_000_000;
    const candidatesTokens = 1_000_000;

    const expectedUsd = 0.5 + 3.0;
    const expectedBrl = expectedUsd * USD_TO_BRL_RATE;

    const result = calculateAICost("gemini-3-flash-preview", promptTokens, candidatesTokens);

    expect(result).toBeCloseTo(expectedBrl, 5);
  });

  it("should calculate correct cost for partial tokens", () => {
    const promptTokens = 100_000; // $0.01
    const candidatesTokens = 50_000; // $0.02

    const expectedUsd = 0.01 + 0.02;
    const expectedBrl = expectedUsd * USD_TO_BRL_RATE;

    const result = calculateAICost("gemini-3-flash-preview", promptTokens, candidatesTokens);

    expect(result).toBeCloseTo(expectedBrl, 5);
  });

  it("should fallback to gemini-2.5-flash for unknown models", () => {
    const promptTokens = 1_000_000;
    const candidatesTokens = 1_000_000;

    const result = calculateAICost("unknown-model", promptTokens, candidatesTokens);
    const expected = calculateAICost("gemini-2.5-flash", promptTokens, candidatesTokens);

    expect(result).toBe(expected);
  });
});
