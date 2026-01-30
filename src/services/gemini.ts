import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateAICost } from "../constants/aiPricing";
import { AIUsageRepository } from "../database/repositories/aiUsageRepository";
import { supabase } from "./supabase";

// Initialize Gemini
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = "gemini-3-flash-preview";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

export interface FinancialContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  topCategories: { category: string; amount: number }[];
  goal?: {
    target: number;
    deadline: string;
    current: number;
  };
}

export const GeminiService = {
  /**
   * Private helper to log usage
   */
  async _logUsage(result: any, featureName: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const response = await result.response;
      const usage = response.usageMetadata;

      if (!usage) return;

      const costBrl = calculateAICost(MODEL_NAME, usage.promptTokenCount, usage.candidatesTokenCount);

      await AIUsageRepository.saveLog({
        userId: user.id,
        modelId: MODEL_NAME,
        promptTokens: usage.promptTokenCount,
        candidatesTokens: usage.candidatesTokenCount,
        totalTokens: usage.totalTokenCount,
        costBrl,
        featureName,
      });
    } catch (error) {
      console.warn("AI Usage Log failed:", error);
    }
  },

  /**
   * Generic method to generate content explicitly
   */
  async generateContent(prompt: string): Promise<string> {
    if (!apiKey) throw new Error("API Key not configured");
    try {
      const result = await model.generateContent(prompt);
      await this._logUsage(result, "Generic Content");
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Generic Error:", error);
      throw error;
    }
  },

  /**
   * Generates a short, friendly "Smart Tip" based on current financial context.
   */
  async generateSmartTip(context: FinancialContext, language: string = "en-US"): Promise<string> {
    if (!apiKey) return "Add your Gemini API Key to .env to get smart tips!";

    const prompt = `
      You are a friendly, helpful financial assistant. 
      Based on this user's data, give ONE concise, actionable "smart tip" (max 2 sentences).
      
      User Data:
      - Income: $${context.monthlyIncome}
      - Expenses: $${context.monthlyExpenses}
      - Savings: $${context.savings}
      - Top Spend: ${context.topCategories.map((c) => `${c.category} ($${c.amount})`).join(", ")}
      ${context.goal ? `- Goal: Save $${context.goal.target} by ${context.goal.deadline}` : ""}
      
      Tone: Encouraging, premium, concise.
      Language: Respond strictly in ${language.startsWith("pt") ? "Portuguese (Brazil)" : "English"}.
      
      Important: Return ONLY the tip text, no "Tip:" prefix or markdown.
    `;

    try {
      const result = await model.generateContent(prompt);
      await this._logUsage(result, "Smart Tip");
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Tip: Tracking your daily expenses is the first step to financial freedom!";
    }
  },

  /**
   * Generates a detailed monthly report.
   */
  async generateMonthlyReport(context: FinancialContext): Promise<string> {
    if (!apiKey) return "AI services unavailable (Missing Key).";

    const prompt = `
      Analyze this user's monthly spending and provide a detailed report.
      Use markdown formatting.
      
      User Data:
      - Income: $${context.monthlyIncome}
      - Expenses: $${context.monthlyExpenses}
      - Top Spend: ${context.topCategories.map((c) => `${c.category} ($${c.amount})`).join(", ")}
      
      Structure:
      1. **Analysis**: Brief summary of the month.
      2. **Highlights**: Good habits observed.
      3. **Areas for Improvement**: Where they overspent.
      4. **Actionable Advice**: 3 specific steps for next month.
    `;

    try {
      const result = await model.generateContent(prompt);
      await this._logUsage(result, "Monthly Report");
      return (await result.response).text();
    } catch (error) {
      return "Could not generate report at this time.";
    }
  },

  /**
   * Generates a step-by-step plan to reach a goal.
   */
  async generateGoalPlan(context: FinancialContext, goalDescription: string): Promise<string> {
    if (!apiKey) return "AI services unavailable.";

    const prompt = `
      Create a step-by-step financial plan for this goal: "${goalDescription}".
      
      Context:
      - Income: ${context.monthlyIncome}
      - Expenses: ${context.monthlyExpenses}
      - Savings Rate: ${((context.savings / context.monthlyIncome) * 100).toFixed(1)}%
      
      Output structured as a list of steps with estimated dates/milestones.
    `;

    try {
      const result = await model.generateContent(prompt);
      await this._logUsage(result, "Goal Plan");
      return (await result.response).text();
    } catch (error) {
      return "Could not generate plan.";
    }
  },

  /**
   * Chat with context
   */
  async chat(context: FinancialContext, history: { role: "user" | "model"; parts: string }[], message: string) {
    if (!apiKey) return "AI Offline";

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `System Context (Do not reply, just know this): 
            User Income: ${context.monthlyIncome}, Expenses: ${context.monthlyExpenses}.
            Top Categories: ${JSON.stringify(context.topCategories)}.
            Current Date: ${new Date().toLocaleDateString()}.
          `,
            },
          ],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am FinAInteli, your premium financial assistant." }],
        },
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.parts }] })),
      ],
    });

    try {
      const result = await chat.sendMessage(message);
      await this._logUsage(result, "Chat");
      return (await result.response).text();
    } catch (e) {
      return "I'm having trouble connecting to my brain right now.";
    }
  },
};
