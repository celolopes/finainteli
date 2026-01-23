import { Database } from "../types/schema";
import { supabase } from "./supabase";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];

export interface BudgetWithCategory extends Budget {
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface BudgetStatus {
  budget: BudgetWithCategory;
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  alertLevel: 0 | 50 | 80 | 100; // 0 = sem alerta
}

export const BudgetService = {
  /**
   * Busca todos os orçamentos do usuário com informações da categoria
   */
  async getBudgets(): Promise<BudgetWithCategory[]> {
    const { data, error } = await supabase
      .from("budgets")
      .select(
        `
        *,
        category:categories(id, name, icon, color)
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as BudgetWithCategory[];
  },

  /**
   * Cria ou atualiza um orçamento
   */
  async upsertBudget(budget: Partial<BudgetInsert> & { category_id: string }): Promise<Budget> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Verificar se já existe orçamento para essa categoria
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category_id", budget.category_id)
      .eq("period", budget.period || "monthly")
      .single();

    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from("budgets")
        .update({
          amount: budget.amount,
          alert_50: budget.alert_50 ?? true,
          alert_80: budget.alert_80 ?? true,
          alert_100: budget.alert_100 ?? true,
          is_active: true,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          category_id: budget.category_id,
          amount: budget.amount!,
          currency_code: budget.currency_code || "BRL",
          period: budget.period || "monthly",
          alert_50: budget.alert_50 ?? true,
          alert_80: budget.alert_80 ?? true,
          alert_100: budget.alert_100 ?? true,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Remove um orçamento (soft delete)
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from("budgets").update({ is_active: false }).eq("id", budgetId);

    if (error) throw error;
  },

  /**
   * Verifica status de todos os orçamentos vs gastos atuais
   */
  async checkBudgetStatus(): Promise<BudgetStatus[]> {
    const budgets = await this.getBudgets();
    if (budgets.length === 0) return [];

    // Calcular período atual
    const now = new Date();
    let startDate: Date;

    // Por enquanto só suportamos mensal
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar gastos por categoria no período
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .neq("status", "cancelled");

    if (error) throw error;

    // Agrupar gastos por categoria
    const spentByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.category_id) {
        spentByCategory[t.category_id] = (spentByCategory[t.category_id] || 0) + t.amount;
      }
    });

    // Calcular status de cada orçamento
    return budgets.map((budget) => {
      const spent = spentByCategory[budget.category_id] || 0;
      const percentage = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0;
      const remaining = Number(budget.amount) - spent;
      const isOverBudget = spent > Number(budget.amount);

      // Determinar nível de alerta
      let alertLevel: 0 | 50 | 80 | 100 = 0;
      if (percentage >= 100 && budget.alert_100) alertLevel = 100;
      else if (percentage >= 80 && budget.alert_80) alertLevel = 80;
      else if (percentage >= 50 && budget.alert_50) alertLevel = 50;

      return {
        budget,
        spent,
        percentage,
        remaining,
        isOverBudget,
        alertLevel,
      };
    });
  },

  /**
   * Atualiza timestamp do último alerta enviado
   */
  async updateLastAlertSent(budgetId: string): Promise<void> {
    const { error } = await supabase.from("budgets").update({ last_alert_sent_at: new Date().toISOString() }).eq("id", budgetId);

    if (error) throw error;
  },
};
