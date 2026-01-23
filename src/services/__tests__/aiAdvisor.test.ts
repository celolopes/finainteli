import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAdvisorService } from "../aiAdvisor";

jest.mock("@google/generative-ai");
jest.mock("../financial", () => ({
  FinancialService: {
    getFinancialAnalysis: jest.fn().mockResolvedValue({
      period: "month",
      totalIncome: 5000,
      totalExpenses: 3000,
      categoryBreakdown: [],
    }),
  },
}));

const mockGenerateContent = jest.fn();

// Setup the mock instance
(GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
  getGenerativeModel: jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  }),
}));

describe("AIAdvisorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should parse valid JSON response from Gemini", async () => {
    const mockResponseText = `
      [
        {
          "type": "tip",
          "icon": "💡",
          "title": "Test Tip",
          "message": "Save more money",
          "impact": "medium"
        }
      ]
    `;

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockResponseText,
      },
    });

    const insights = await AIAdvisorService.getInsights("month", "user-123");

    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe("Test Tip");
    expect(insights[0].type).toBe("tip");
  });

  it("should handle markdown code blocks in response", async () => {
    const mockResponseText = '```json\n[{"type":"alert","icon":"⚠️","title":"Alert","message":"Test","impact":"high"}]\n```';

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockResponseText,
      },
    });

    const insights = await AIAdvisorService.getInsights("month", "user-123");

    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("alert");
  });

  it("should return fallback insight on error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API Error"));

    const insights = await AIAdvisorService.getInsights("month", "user-123");

    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe("Dica Geral"); // Updated to match implementation
  });
});
