import { Q } from "@nozbe/watermelondb";
import { database } from "../database";
import Account from "../database/model/Account";
import Category from "../database/model/Category";
import Transaction from "../database/model/Transaction";
import { Database } from "../types/schema";
import { BudgetService } from "./budget";
import { supabase } from "./supabase";
import { mySync } from "./sync";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type BankAccountRow = Database["public"]["Tables"]["bank_accounts"]["Row"];
type CreditCardRow = Database["public"]["Tables"]["credit_cards"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export const FinancialService = {
  /**
   * Busca todas as contas bancárias do usuário
   */
  async getAccounts() {
    const records = await database
      .get<Account>("bank_accounts")
      .query(Q.where("deleted_at", Q.eq(null)))
      .fetch();

    return records.map((r) => ({
      id: r.id,
      user_id: r.userId,
      name: r.name,
      account_type: r.accountType,
      currency_code: r.currencyCode,
      initial_balance: r.initialBalance,
      current_balance: r.currentBalance,
      color: r.color,
      icon: r.icon,
      is_active: true,
    })) as BankAccountRow[];
  },

  /**
   * Busca todos os cartões de crédito
   */
  async getCreditCards() {
    const records = await database
      .get<any>("credit_cards") // We can use 'any' or import CreditCard model
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("is_active", true))
      .fetch();

    return records.map((r: any) => ({
      id: r.id,
      user_id: r.userId,
      name: r.name,
      currency_code: r.currencyCode,
      credit_limit: r.creditLimit,
      current_balance: r.currentBalance,
      available_limit: r.creditLimit - r.currentBalance,
      closing_day: r.closingDay,
      due_day: r.dueDay,
      brand: r.brand,
      color: r.color,
      icon: null,
      is_active: r.isActive,
      created_at: "",
      updated_at: r.updatedAt?.toISOString() || "",
    })) as CreditCardRow[];
  },

  /**
   * Busca transações recentes para o dashboard
   */
  async getRecentTransactions(limit = 5) {
    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.sortBy("transaction_date", Q.desc), Q.sortBy("created_at", Q.desc), Q.take(limit))
      .fetch();

    return await Promise.all(
      transactions.map(async (t) => {
        const category = await t.category.fetch();
        const account = await t.account.fetch();
        return {
          id: t.id,
          user_id: t.userId,
          amount: t.amount,
          type: t.type,
          description: t.description,
          notes: t.notes,
          currency_code: t.currencyCode,
          transaction_date: t.transactionDate.toISOString(),
          category_id: t.category.id,
          account_id: t.account.id,
          credit_card_id: t.creditCard.id,
          status: "completed",
          category: category
            ? {
                id: category.id,
                name: category.name,
                icon: category.icon,
                color: category.color,
              }
            : null,
          account: account
            ? {
                id: account.id,
                name: account.name,
                color: account.color,
              }
            : null,
        };
      }),
    );
  },

  /**
   * Calcula resumo financeiro do mês atual
   */
  async getMonthlySummary(currencyCode = "BRL") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("currency_code", currencyCode), Q.where("transaction_date", Q.gte(firstDay)), Q.where("transaction_date", Q.lte(lastDay)))
      .fetch();

    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
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
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("type", "expense"), Q.where("currency_code", currencyCode), Q.where("transaction_date", Q.gte(firstDay)))
      .fetch();

    const grouped: Record<string, { amount: number; color: string }> = {};

    for (const t of transactions) {
      const category = await t.category.fetch();
      const catName = category?.name || "Outros";
      const catColor = category?.color || "#999";

      if (!grouped[catName]) {
        grouped[catName] = { amount: 0, color: catColor };
      }
      grouped[catName].amount += t.amount;
    }

    return Object.entries(grouped)
      .map(([name, { amount, color }]) => ({ x: name, y: amount, color }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 5);
  },

  /**
   * Busca categorias (sistema + usuário)
   */
  async getCategories() {
    const records = await database
      .get<Category>("categories")
      .query(Q.where("deleted_at", Q.eq(null)))
      .fetch();

    return records.map((r) => ({
      id: r.id,
      user_id: r.userId,
      name: r.name,
      icon: r.icon,
      color: r.color,
      type: r.type,
    })) as CategoryRow[];
  },

  /**
   * Recalcula o saldo de todas as contas do usuário com base nas transações (Offline)
   */
  async recalculateAccountBalances() {
    await database.write(async () => {
      const accounts = await database
        .get<Account>("bank_accounts")
        .query(Q.where("deleted_at", Q.eq(null)))
        .fetch();

      for (const account of accounts) {
        const transactions = await database
          .get<Transaction>("transactions")
          .query(Q.where("account_id", account.id), Q.where("deleted_at", Q.eq(null)), Q.where("type", Q.notEq("transfer")))
          .fetch();

        let balance = account.initialBalance;

        transactions.forEach((t) => {
          if (t.type === "income") balance += t.amount;
          else if (t.type === "expense") balance -= t.amount;
        });

        await account.update((a) => {
          a.currentBalance = balance;
        });
      }
    });
    return true;
  },

  async createAccount(account: Database["public"]["Tables"]["bank_accounts"]["Insert"]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let newRecord: Account;
    await database.write(async () => {
      newRecord = await database.get<Account>("bank_accounts").create((a) => {
        a.userId = user.id;
        a.name = account.name;
        a.accountType = account.account_type;
        a.currencyCode = account.currency_code;
        a.initialBalance = Number(account.initial_balance);
        a.currentBalance = Number(account.current_balance ?? account.initial_balance);
        a.color = account.color || undefined;
        a.icon = account.icon || undefined;
      });
    });

    mySync().catch(console.error);
    return newRecord!._raw;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let newRecord: any;
    await database.write(async () => {
      newRecord = await database.get("credit_cards").create((c: any) => {
        c.userId = user.id;
        c.name = card.name;
        c.brand = card.brand;
        c.closingDay = card.closing_day;
        c.dueDay = card.due_day;
        c.creditLimit = Number(card.credit_limit);
        c.currentBalance = Number(card.current_balance || 0);
        c.currencyCode = card.currency_code;
        c.color = card.color;
        c.isActive = card.is_active ?? true;
      });
    });

    mySync().catch(console.error);
    return newRecord!._raw;
  },

  async createTransaction(transaction: Omit<Database["public"]["Tables"]["transactions"]["Insert"], "user_id">) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    let newTransactionRecord: Transaction;
    await database.write(async () => {
      newTransactionRecord = await database.get<Transaction>("transactions").create((t) => {
        t.userId = user.id;
        t.amount = Number(transaction.amount);
        t.type = transaction.type as any;
        t.description = transaction.description || "";
        t.notes = transaction.notes || undefined;
        t.currencyCode = transaction.currency_code;
        // Fix for date crash: Use new Date() constructor explicitly
        t.transactionDate = new Date(transaction.transaction_date);

        // Fix for relations
        if (transaction.category_id) t.category.id = transaction.category_id;
        if (transaction.account_id) t.account.id = transaction.account_id;
        if (transaction.credit_card_id) t.creditCard.id = transaction.credit_card_id;
      });

      // Atualizar saldo da conta vinculada
      if (transaction.account_id && transaction.type !== "transfer") {
        try {
          const accountRecord = await database.get<Account>("bank_accounts").find(transaction.account_id);
          await accountRecord.update((a: Account) => {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === "income") {
              a.currentBalance += amount;
            } else if (transaction.type === "expense") {
              a.currentBalance -= amount;
            }
          });
        } catch (e) {
          console.error("Account not found locally for balance update:", e);
        }
      }

      // Atualizar saldo do cartão de crédito
      if (transaction.credit_card_id && transaction.type === "expense") {
        try {
          const cardRecord = await database.get<any>("credit_cards").find(transaction.credit_card_id);
          await cardRecord.update((c: any) => {
            const amount = Number(transaction.amount) || 0;
            c.currentBalance += amount;
          });
        } catch (e) {
          console.error("Credit card not found locally for balance update:", e);
        }
      }
    });

    BudgetService.checkAndNotifyBudgets(user.id).catch(console.error);
    mySync().catch(console.error);
    return newTransactionRecord!._raw;
  },

  /**
   * Busca todas as transações do usuário com joins
   */
  async getTransactions(options?: { limit?: number; offset?: number; type?: "income" | "expense" }) {
    let query = database.get<Transaction>("transactions").query(Q.where("deleted_at", Q.eq(null)), Q.sortBy("transaction_date", Q.desc), Q.sortBy("created_at", Q.desc));

    if (options?.type) {
      query = query.extend(Q.where("type", options.type));
    }

    if (options?.limit) {
      query = query.extend(Q.take(options.limit));
    }

    if (options?.offset) {
      query = query.extend(Q.skip(options.offset));
    }

    const records = await query.fetch();

    return await Promise.all(
      records.map(async (t) => {
        const category = await t.category.fetch();
        const account = await t.account.fetch();
        return {
          id: t.id,
          user_id: t.userId,
          amount: t.amount,
          type: t.type,
          description: t.description,
          notes: t.notes,
          currency_code: t.currencyCode,
          transaction_date: t.transactionDate.toISOString(),
          category_id: t.category.id,
          account_id: t.account.id,
          credit_card_id: t.creditCard.id,
          status: "completed",
          sync_status: t.syncStatus,
          category: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null,
          account: account ? { id: account.id, name: account.name, color: account.color } : null,
        };
      }),
    );
  },

  async getTransactionById(id: string) {
    try {
      const t = await database.get<Transaction>("transactions").find(id);
      if (t.deletedAt) return null;

      const category = await t.category.fetch();
      const account = await t.account.fetch();
      return {
        id: t.id,
        user_id: t.userId,
        amount: t.amount,
        type: t.type,
        description: t.description,
        notes: t.notes,
        currency_code: t.currencyCode,
        transaction_date: t.transactionDate.toISOString(),
        category_id: t.category.id,
        account_id: t.account.id,
        credit_card_id: t.creditCard.id,
        status: "completed",
        sync_status: t.syncStatus,
        category: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null,
        account: account ? { id: account.id, name: account.name, color: account.color } : null,
      };
    } catch (e) {
      console.error("Transaction not found:", e);
      return null;
    }
  },

  /**
   * Deleta uma transação
   */
  async deleteTransaction(id: string) {
    await database.write(async () => {
      const transaction = await database.get<Transaction>("transactions").find(id);
      await transaction.update((t) => {
        t.deletedAt = new Date();
      });

      // Update account balance (reverse)
      if (transaction.account.id) {
        const account = await transaction.account.fetch();
        if (account) {
          await account.update((a: Account) => {
            if (transaction.type === "income") a.currentBalance -= transaction.amount;
            else if (transaction.type === "expense") a.currentBalance += transaction.amount;
          });
        }
      }
    });
    mySync().catch(console.error);
    return true;
  },

  /**
   * Atualiza uma transação
   */
  async updateTransaction(id: string, updates: Partial<Database["public"]["Tables"]["transactions"]["Update"]>) {
    let updated: Transaction;
    await database.write(async () => {
      updated = await database.get<Transaction>("transactions").find(id);
      const oldAmount = updated.amount;
      const oldType = updated.type;
      const oldAccountId = updated.account.id;

      await updated.update((t) => {
        if (updates.amount !== undefined) t.amount = Number(updates.amount);
        if (updates.type !== undefined) t.type = updates.type as any;
        if (updates.description !== undefined) t.description = updates.description || "";
        if (updates.notes !== undefined) t.notes = updates.notes || undefined;
        if (updates.transaction_date !== undefined) t.transactionDate = new Date(updates.transaction_date);
        if (updates.category_id !== undefined) t.category.id = updates.category_id;
        if (updates.account_id !== undefined) t.account.id = updates.account_id;
        if (updates.credit_card_id !== undefined) t.creditCard.id = updates.credit_card_id;
      });
    });

    if (updates.amount !== undefined || updates.type !== undefined || updates.account_id !== undefined) {
      await this.recalculateAccountBalances();
    }

    mySync().catch(console.error);
    return updated!._raw;
  },

  /**
   * Busca transações anteriores por descrição para autocomplete
   */
  async searchTransactionsByDescription(query: string, limit = 5) {
    if (!query || query.length < 2) return [];
    const records = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("description", Q.like(`%${Q.sanitizeLikeString(query)}%`)), Q.sortBy("created_at", Q.desc), Q.take(20))
      .fetch();

    const uniqueDescriptions = new Map<string, any>();

    for (const t of records) {
      const desc = t.description?.toLowerCase().trim();
      if (desc && !uniqueDescriptions.has(desc)) {
        const category = await t.category.fetch();
        const account = await t.account.fetch();
        uniqueDescriptions.set(desc, {
          id: t.id,
          description: t.description,
          type: t.type,
          category: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color } : null,
          account: account ? { id: account.id, name: account.name, color: account.color } : null,
        });
      }
    }

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

    const [currentRecords, prevRecords, allCategories] = await Promise.all([
      database
        .get<Transaction>("transactions")
        .query(
          Q.where("deleted_at", Q.eq(null)),
          Q.where("currency_code", currencyCode),
          Q.where("transaction_date", Q.gte(startDate.getTime())),
          Q.where("transaction_date", Q.lte(endDate.getTime())),
        )
        .fetch(),
      database
        .get<Transaction>("transactions")
        .query(
          Q.where("deleted_at", Q.eq(null)),
          Q.where("currency_code", currencyCode),
          Q.where("transaction_date", Q.gte(prevStartDate.getTime())),
          Q.where("transaction_date", Q.lte(prevEndDate.getTime())),
        )
        .fetch(),
      this.getCategories(),
    ]);

    const catMapById = new Map(allCategories.map((c) => [c.id, c.name]));

    // Processar ATUAL
    let totalIncome = 0;
    let totalExpenses = 0;
    const catTotalMap: Record<string, number> = {};

    currentRecords.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else if (t.type === "expense") {
        totalExpenses += t.amount;
        const catName = (t.category.id && catMapById.get(t.category.id)) || "Outros";
        catTotalMap[catName] = (catTotalMap[catName] || 0) + t.amount;
      }
    });

    const categoryBreakdown = Object.entries(catTotalMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Processar ANTERIOR
    let prevExpenses = 0;
    const prevCatMap: Record<string, number> = {};
    prevRecords.forEach((t) => {
      if (t.type === "expense") {
        prevExpenses += t.amount;
        const catName = (t.category.id && catMapById.get(t.category.id)) || "Outros";
        prevCatMap[catName] = (prevCatMap[catName] || 0) + t.amount;
      }
    });

    const categoryDifferences = Object.entries(catTotalMap)
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

  /**
   * Busca evolução de receitas e despesas dos últimos 6 meses
   */
  async getMonthlyEvolution(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("transaction_date", Q.gte(sixMonthsAgo.getTime())), Q.sortBy("transaction_date", Q.asc))
      .fetch();

    // Group by YYYY-MM
    const grouped = new Map<string, { income: number; expense: number; date: Date }>();

    // Initialize last 6 months to ensure zero values if no transactions
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(key, { income: 0, expense: 0, date: d });
    }

    transactions.forEach((t) => {
      const date = t.transactionDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (grouped.has(key)) {
        const current = grouped.get(key)!;
        if (t.type === "income") current.income += t.amount;
        else if (t.type === "expense") current.expense += t.amount;
      }
    });

    return Array.from(grouped.values()).map((item) => ({
      month: item.date.toLocaleDateString("pt-BR", { month: "short" }),
      fullDate: item.date,
      income: item.income,
      expense: item.expense,
      balance: item.income - item.expense,
    }));
  },
};
