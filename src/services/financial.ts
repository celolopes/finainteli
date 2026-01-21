import { Database } from "../types/schema";
import { supabase } from "./supabase";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export const FinancialService = {
  /**
   * Busca todas as contas bancárias do usuário
   */
  async getAccounts() {
    const { data, error } = await supabase.from("bank_accounts").select("*").eq("is_active", true).order("current_balance", { ascending: false });

    if (error) throw error;
    return data as BankAccount[];
  },

  /**
   * Busca todos os cartões de crédito
   */
  async getCreditCards() {
    const { data, error } = await supabase.from("credit_cards").select("*").eq("is_active", true).order("credit_limit", { ascending: false });

    if (error) throw error;
    return data as CreditCard[];
  },

  /**
   * Busca transações recentes para o dashboard
   */
  async getRecentTransactions(limit = 5) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, category:categories(name, icon, color)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Calcula resumo financeiro do mês atual
   */
  async getMonthlySummary(currencyCode = "BRL") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("currency_code", currencyCode)
      .gte("transaction_date", firstDay)
      .lte("transaction_date", lastDay)
      .neq("status", "cancelled");

    if (error) throw error;

    let income = 0;
    let expense = 0;

    data.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    });

    return {
      income,
      expense,
      savings: income - expense,
    };
  },

  /**
   * Busca gastos por categoria no mês
   */
  async getSpendingByCategory(currencyCode = "BRL") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .select("amount, category:categories(name, color)")
      .eq("type", "expense")
      .eq("currency_code", currencyCode)
      .gte("transaction_date", firstDay);

    if (error) throw error;

    const grouped: Record<string, { amount: number; color: string }> = {};

    data.forEach((t: any) => {
      const catName = t.category?.name || "Outros";
      const catColor = t.category?.color || "#999";

      if (!grouped[catName]) {
        grouped[catName] = { amount: 0, color: catColor };
      }
      grouped[catName].amount += t.amount;
    });

    return Object.entries(grouped)
      .map(([name, { amount, color }]) => ({ x: name, y: amount, color }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 5);
  },

  /**
   * Busca categorias (sistema + usuário)
   */
  async getCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("name");

    if (error) throw error;
    return data as Category[];
  },

  async createAccount(account: Database["public"]["Tables"]["bank_accounts"]["Insert"]) {
    const { data, error } = await supabase.from("bank_accounts").insert(account).select().single();
    if (error) throw error;
    return data;
  },

  async updateUserProfile(updates: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user");

    const { error } = await supabase.from("user_profiles").update(updates).eq("id", user.id);

    if (error) throw error;
  },

  async getCurrencies() {
    const { data, error } = await supabase.from("currencies").select("*").eq("is_active", true);
    if (error) throw error;
    return data;
  },

  async createCreditCard(card: Database["public"]["Tables"]["credit_cards"]["Insert"]) {
    const { data, error } = await supabase.from("credit_cards").insert(card).select().single();
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction: Database["public"]["Tables"]["transactions"]["Insert"]) {
    const { data, error } = await supabase.from("transactions").insert(transaction).select().single();
    if (error) throw error;
    return data;
  },
};
