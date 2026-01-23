import { GeminiService } from "./gemini";

// Interfaces de Dados Financeiros
export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface FinancialAnalysis {
  period: "week" | "month" | "year";
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  categoryBreakdown: CategoryExpense[];
  previousPeriodComparison?: {
    totalExpenses: number;
    difference: number; // Porcentagem
    categoryDifferences: { category: string; difference: number }[];
  };
}

// Interfaces de Insights da IA
export type InsightType = "warning" | "alert" | "praise" | "tip" | "prediction";
export type InsightImpact = "high" | "medium" | "low";

export interface AIInsight {
  id: string;
  type: InsightType;
  icon: string; // Nome do ícone (MaterialCommunityIcons)
  title: string;
  message: string;
  category?: string;
  impact: InsightImpact;
  actionable: boolean;
  suggestedAction?: string;
}

export const AIAdvisorService = {
  /**
   * Analisa os dados financeiros e retorna insights personalizados.
   * Esta é a função principal que orquestra a chamada ao Gemini.
   */
  async analyzeFinances(
    userId: string, // Futuro: Usar ID para buscar dados históricos específicos se necessário
    analysis: FinancialAnalysis,
    language: string = "pt-BR",
  ): Promise<AIInsight[]> {
    try {
      // 1. Construir o prompt com os dados financeiros
      const prompt = this.buildPrompt(analysis, language);

      // 2. Chamar o Gemini (usando o GeminiService existente ou direto)
      // Estamos usando um método específico aqui para garantir o formato JSON
      const responseText = await GeminiService.generateContent(prompt);

      // 3. Parsear a resposta para JSON
      const insights = this.parseResponse(responseText);

      return insights;
    } catch (error) {
      console.error("AIAdvisorService Error:", error);
      // Fallback em caso de erro
      return [
        {
          id: "error-fallback",
          type: "tip",
          icon: "lightbulb-outline",
          title: "Dica Rápida",
          message: "Continue registrando seus gastos para obter insights mais precisos no futuro.",
          impact: "low",
          actionable: false,
        },
      ];
    }
  },

  /**
   * Constrói o prompt otimizado para o Gemini
   */
  buildPrompt(analysis: FinancialAnalysis, language: string): string {
    const currency = language === "pt-BR" ? "R$" : "$";

    // Serializar dados para o prompt
    const dataSummary = JSON.stringify(
      {
        period: analysis.period,
        income: analysis.totalIncome,
        expenses: analysis.totalExpenses,
        savings: analysis.savings,
        topCategories: analysis.categoryBreakdown.slice(0, 5), // Top 5
        comparison: analysis.previousPeriodComparison,
      },
      null,
      2,
    );

    return `
      Atue como um Consultor Financeiro Pessoal experiente, amigável e perspicaz.
      Analise os seguintes dados financeiros do usuário para o período: ${analysis.period}.
      
      DADOS:
      ${dataSummary}
      
      TAREFA:
      Gere 3 a 5 insights valiosos sobre as finanças do usuário.
      Seja específico, use números quando possível, e varie entre elogios, alertas e dicas.
      
      REGRAS:
      1. Identifique gastos desnecessários ou aumentos súbitos.
      2. Elogie economias ou reduções de gastos.
      3. Sugira ações práticas.
      4. O formato de resposta DEVE ser estritamente um ARRAY JSON válido.
      5. Idioma: ${language === "pt-BR" ? "Português do Brasil" : "English"}.
      
      FORMATO JSON ESPERADO:
      [
        {
          "type": "warning" | "alert" | "praise" | "tip" | "prediction",
          "icon": "nome-do-icone-mdi", // Ex: alert-circle, trophy, gift, trending-up
          "title": "Título curto",
          "message": "Mensagem detalhada e amigável (max 2 frases)",
          "category": "Nome da Categoria (opcional)",
          "impact": "high" | "medium" | "low",
          "actionable": true | false,
          "suggestedAction": "Ação sugerida curta (se actionable=true)"
        }
      ]
      
      Retorne APENAS o JSON, sem markdown ou explicações adicionais.
    `;
  },

  /**
   * Processa a resposta do LLM para garantir um objeto válido
   */
  parseResponse(responseText: string): AIInsight[] {
    try {
      // Limpar blocos de código markdown se existirem
      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanText);

      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          ...item,
          id: `ai-insight-${Date.now()}-${index}`, // Gerar IDs únicos
        }));
      }
      return [];
    } catch (e) {
      console.warn("Falha ao parsear resposta JSON da IA", e);
      return [];
    }
  },
};
