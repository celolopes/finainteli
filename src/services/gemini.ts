import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from "expo-constants";

// Initialize Gemini
// Note: In a real app, ensure EXPO_PUBLIC_GEMINI_API_KEY is in your .env
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
   * Generates a short, friendly "Smart Tip" based on current financial context.
   */
  async generateSmartTip(context: FinancialContext): Promise<string> {
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
    `;

    try {
      const result = await model.generateContent(prompt);
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
      return (await result.response).text();
    } catch (e) {
      return "I'm having trouble connecting to my brain right now.";
    }
  },
};
