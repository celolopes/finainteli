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

  /**
   * Recalcula o saldo de todas as contas do usuário com base nas transações
   * Útil para sincronizar saldos antigos
   */
  async recalculateAccountBalances() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Buscar todas as contas do usuário
    const { data: accounts } = await supabase.from("bank_accounts").select("id, initial_balance, current_balance").eq("user_id", user.id);

    if (!accounts) return;

    for (const account of accounts) {
      // Buscar todas as transações desta conta
      const { data: transactions } = await supabase.from("transactions").select("type, amount").eq("account_id", account.id).neq("type", "transfer");

      if (!transactions) continue;

      // Calcular o saldo: inicial + receitas - despesas
      const initialBalance = Number(account.initial_balance) || 0;
      let balance = initialBalance;

      transactions.forEach((t) => {
        const amount = Number(t.amount) || 0;
        if (t.type === "income") {
          balance += amount;
        } else if (t.type === "expense") {
          balance -= amount;
        }
      });

      // Atualizar o saldo da conta
      await supabase.from("bank_accounts").update({ current_balance: balance }).eq("id", account.id);
    }

    return true;
  },

  async createAccount(account: Database["public"]["Tables"]["bank_accounts"]["Insert"]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Inject user_id
    const accountWithUser = { ...account, user_id: user.id };

    const { data, error } = await supabase.from("bank_accounts").insert(accountWithUser).select().single();
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

  async createTransaction(transaction: Omit<Database["public"]["Tables"]["transactions"]["Insert"], "user_id">) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Inject user_id
    const transactionWithUser = { ...transaction, user_id: user.id };

    const { data, error } = await supabase.from("transactions").insert(transactionWithUser).select().single();
    if (error) throw error;

    // Atualizar saldo da conta vinculada
    if (transaction.account_id && transaction.type !== "transfer") {
      const { data: account } = await supabase.from("bank_accounts").select("current_balance").eq("id", transaction.account_id).single();

      if (account) {
        const currentBalance = Number(account.current_balance) || 0;
        const amount = Number(transaction.amount) || 0;

        // Receita aumenta o saldo, Despesa diminui
        const newBalance = transaction.type === "income" ? currentBalance + amount : currentBalance - amount;

        await supabase.from("bank_accounts").update({ current_balance: newBalance }).eq("id", transaction.account_id);
      }
    }

    return data;
  },

  /**
   * Busca todas as transações do usuário com joins
   */
  async getTransactions(options?: { limit?: number; offset?: number; type?: "income" | "expense" }) {
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(id, name, icon, color),
        account:bank_accounts!transactions_account_id_fkey(id, name, color),
        card:credit_cards(id, name, color)
      `,
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.type) {
      query = query.eq("type", options.type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * Deleta uma transação
   */
  async deleteTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  /**
   * Atualiza uma transação
   */
  async updateTransaction(id: string, updates: Partial<Database["public"]["Tables"]["transactions"]["Update"]>) {
    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Busca transações anteriores por descrição para autocomplete
   * Retorna transações únicas agrupadas por descrição com categoria e conta mais recentes
   */
  async searchTransactionsByDescription(query: string, limit = 5) {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        description,
        category_id,
        account_id,
        credit_card_id,
        type,
        category:categories(id, name, icon, color),
        account:bank_accounts!transactions_account_id_fkey(id, name, color),
        card:credit_cards(id, name, color)
      `,
      )
      .ilike("description", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    // Agrupar por descrição única, pegando a mais recente de cada
    const uniqueDescriptions = new Map<string, any>();
    data?.forEach((t) => {
      const desc = t.description?.toLowerCase().trim();
      if (desc && !uniqueDescriptions.has(desc)) {
        uniqueDescriptions.set(desc, t);
      }
    });

    return Array.from(uniqueDescriptions.values()).slice(0, limit);
  },

  /**
   * Agrega dados financeiros para o Consultor IA
   */
  async getFinancialAnalysis(period: "week" | "month" | "year", currencyCode = "BRL") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    // Calcular datas
    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      // week (last 7 days by default)
      endDate = new Date(); // Hoje
      startDate = new Date();
      startDate.setDate(now.getDate() - 6); // 7 dias incluindo hoje
      startDate.setHours(0, 0, 0, 0);

      prevEndDate = new Date(startDate);
      prevEndDate.setDate(startDate.getDate() - 1);
      prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevEndDate.getDate() - 6);
    }

    // Buscar transações período ATUAL
    const { data: currentData, error: currentError } = await supabase
      .from("transactions")
      .select("amount, type, category:categories(name)")
      .eq("currency_code", currencyCode)
      .gte("transaction_date", startDate.toISOString().split("T")[0]) // Supabase usa string date
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .neq("status", "cancelled");

    if (currentError) throw currentError;

    // Buscar transações período ANTERIOR
    const { data: prevData, error: prevError } = await supabase
      .from("transactions")
      .select("amount, type, category:categories(name)")
      .eq("currency_code", currencyCode)
      .gte("transaction_date", prevStartDate.toISOString().split("T")[0])
      .lte("transaction_date", prevEndDate.toISOString().split("T")[0])
      .neq("status", "cancelled");

    if (prevError) throw prevError;

    // Processar ATUAL
    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap: Record<string, number> = {};

    currentData.forEach((t: any) => {
      if (t.type === "income") totalIncome += t.amount;
      else if (t.type === "expense") {
        totalExpenses += t.amount;
        const catName = t.category?.name || "Outros";
        catMap[catName] = (catMap[catName] || 0) + t.amount;
      }
    });

    const categoryBreakdown = Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Processar ANTERIOR
    let prevExpenses = 0;
    const prevCatMap: Record<string, number> = {};
    prevData.forEach((t: any) => {
      if (t.type === "expense") {
        prevExpenses += t.amount;
        const catName = t.category?.name || "Outros";
        prevCatMap[catName] = (prevCatMap[catName] || 0) + t.amount;
      }
    });

    const categoryDifferences = Object.entries(catMap)
      .map(([cat, amount]) => {
        const prevAmount = prevCatMap[cat] || 0;
        const diff = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 100;
        return { category: cat, difference: diff };
      })
      .sort((a, b) => b.difference - a.difference);

    return {
      period,
      startDate,
      endDate,
      totalIncome,
      totalExpenses,
      savings: totalIncome - totalExpenses,
      categoryBreakdown,
      previousPeriodComparison: {
        totalExpenses: prevExpenses,
        difference: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
        categoryDifferences,
      },
    };
  },
};
