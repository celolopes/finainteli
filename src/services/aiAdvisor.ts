import { GoogleGenerativeAI } from "@google/generative-ai";
import { FinancialService } from "./financial";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
const getGeminiClient = () => {
  if (!genAI) {
    if (!API_KEY) {
      console.warn("Gemini API Key missing!");
    }
    genAI = new GoogleGenerativeAI(API_KEY || "");
  }
  return genAI;
};

export interface AIInsight {
  type: "warning" | "alert" | "praise" | "tip" | "prediction";
  icon: string;
  title: string;
  message: string;
  category?: string;
  impact?: "high" | "medium" | "low";
  actionable?: boolean;
}

export const AIAdvisorService = {
  async getInsights(period: "week" | "month" | "year", userId: string, language = "pt-BR", currencyCode = "BRL"): Promise<AIInsight[]> {
    try {
      // 1. Get Financial Data
      const analysis = await FinancialService.getFinancialAnalysis(period, "BRL");

      // 2. Prepare Prompt
      const prompt = `
        CONTEXTO:
        Você é o "FinAI Advisor", um consultor financeiro pessoal de elite. Sua personalidade é profissional, perspicaz, encorajadora e direta.
        Você está analisando os dados financeiros de um usuário para o período: ${period.toUpperCase()} (${currencyCode}).

        DADOS FINANCEIROS (JSON):
        ${JSON.stringify(analysis, null, 2)}

        SEUS OBJETIVOS:
        1. 🔍 **Identificar Padrões**: Detecte gastos anormais, tendências de alta ou categorias que desviaram do padrão.
        2. 💡 **Gerar Insights**: Crie *exatamente 3 a 5* insights acionáveis. Não traga obviedades (ex: "Você gastou dinheiro").
        3. ⚖️ **Equilíbrio**: Misture alertas (se houver problemas) com elogios (se houver conquistas/economia).
        
        REGRAS DE FORMATAÇÃO:
        - Responda ESTRITAMENTE com um Array JSON válido.
        - Não use Markdown (\`\`\`json). Apenas o raw JSON.
        - Idioma: ${language}.

        SCHEMA DE SAÍDA (Array de Objetos):
        [
          {
            "type": "warning" | "alert" | "praise" | "tip" | "prediction",
            "icon": "String (Emoji único que represente o insight)",
            "title": "String (Título curto e impactante, max 40 chars)",
            "message": "String (Explicação clara e ação sugerida, max 120 chars)",
            "category": "String (Nome da categoria relacionada ou null)",
            "impact": "high" | "medium" | "low"
          }
        ]
      `;

      // 3. Call Gemini
      const client = getGeminiClient();
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // 4. Parse JSON
      // Remove code blocks if present
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const insights: AIInsight[] = JSON.parse(cleanText);
      return insights;
    } catch (error) {
      console.error("AIAdvisorService Error:", error);
      // Fallback insights if AI fails
      return [
        {
          type: "tip",
          icon: "💡",
          title: "Dica Geral",
          message: "Mantenha seus gastos organizados para atingir suas metas.",
          impact: "low",
        },
      ];
    }
  },
};
