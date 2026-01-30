import { calculateAICost, USD_TO_BRL_RATE } from "../aiPricing";

describe("AI Pricing Logic", () => {
  it("should calculate correct cost for Gemini 3 Flash", () => {
    // 1M input tokens = $0.10
    // 1M output tokens = $0.40

    const promptTokens = 1_000_000;
    const candidatesTokens = 1_000_000;

    const expectedUsd = 0.1 + 0.4;
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

  it("should fallback to gemini-2.0-flash for unknown models", () => {
    const promptTokens = 1_000_000;
    const candidatesTokens = 1_000_000;

    const result = calculateAICost("unknown-model", promptTokens, candidatesTokens);
    const expected = calculateAICost("gemini-2.0-flash", promptTokens, candidatesTokens);

    expect(result).toBe(expected);
  });
});
