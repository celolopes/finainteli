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

const safeAddMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== targetDay) {
    d.setDate(0);
  }
  return d;
};

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
   * Busca uma conta pelo ID
   */
  async getAccountById(id: string) {
    try {
      const record = await database.get<Account>("bank_accounts").find(id);
      return {
        id: record.id,
        user_id: record.userId,
        name: record.name,
        account_type: record.accountType,
        currency_code: record.currencyCode,
        initial_balance: record.initialBalance,
        current_balance: record.currentBalance,
        color: record.color,
        icon: record.icon,
        is_active: true,
      } as BankAccountRow;
    } catch (e) {
      return null;
    }
  },

  /**
   * Atualiza uma conta
   */
  async updateAccount(id: string, updates: Partial<Database["public"]["Tables"]["bank_accounts"]["Update"]>) {
    await database.write(async () => {
      const account = await database.get<Account>("bank_accounts").find(id);
      await account.update((a) => {
        if (updates.name !== undefined) a.name = updates.name;
        if (updates.account_type !== undefined) a.accountType = updates.account_type;
        if (updates.currency_code !== undefined) a.currencyCode = updates.currency_code;
        if (updates.initial_balance !== undefined) a.initialBalance = Number(updates.initial_balance);
        if (updates.current_balance !== undefined) a.currentBalance = Number(updates.current_balance);
        if (updates.color !== undefined) a.color = updates.color || undefined;
        if (updates.icon !== undefined) a.icon = updates.icon || undefined;
      });
    });
    mySync().catch(console.error);
    return true;
  },

  /**
   * Define o saldo ATUAL da conta, ajustando o saldo INICIAL para que a matemática feche.
   * NewInitial = NewCurrent - (Transações Acumuladas)
   */
  async setAccountCurrentBalance(id: string, newCurrentBalance: number) {
    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("account_id", id), Q.where("deleted_at", Q.eq(null)), Q.where("status", Q.notEq("pending")), Q.where("type", Q.notEq("transfer")))
      .fetch();

    let accumulated = 0;

    transactions.forEach((t) => {
      if (t.type === "income") accumulated += t.amount;
      else if (t.type === "expense") accumulated -= t.amount;
    });

    const newInitialIdx = newCurrentBalance - accumulated;

    await this.updateAccount(id, {
      initial_balance: newInitialIdx,
      current_balance: newCurrentBalance,
    });

    return true;
  },

  /**
   * Deleta uma conta (Soft delete)
   */
  async deleteAccount(id: string) {
    await database.write(async () => {
      const account = await database.get<Account>("bank_accounts").find(id);
      await account.markAsDeleted(); // Soft delete compatible with sync
    });
    mySync().catch(console.error);
    return true;
  },

  /**
   * Verifica se uma conta pode ser excluída
   */
  async checkAccountCanBeDeleted(id: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const account = await database.get<Account>("bank_accounts").find(id);

      // 1. Check Balance
      if (Math.abs(account.currentBalance) > 0.01) {
        return {
          allowed: false,
          reason: "A conta possui saldo diferente de zero. Zere o saldo antes de excluir.",
        };
      }

      // 2. Check Pending Transactions
      const pendingCount = await database
        .get<Transaction>("transactions")
        .query(Q.where("account_id", id), Q.where("status", "pending"), Q.where("deleted_at", Q.eq(null)))
        .fetchCount();

      if (pendingCount > 0) {
        return {
          allowed: false,
          reason: "Existem transações pendentes vinculadas a esta conta.",
        };
      }

      return { allowed: true };
    } catch (e) {
      console.error(e);
      return { allowed: false, reason: "Erro ao verificar conta." };
    }
  },

  /**
   * Busca todos os cartões de crédito
   */
  async getCreditCards() {
    const records = await database
      .get<any>("credit_cards") // We can use 'any' or import CreditCard model
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("is_active", true))
      .fetch();

    return await Promise.all(
      records.map(async (r: any) => {
        // Calculate Next Invoice Estimate (Open Invoice)
        const now = new Date();
        const closingDay = r.closingDay || 1;
        let lastClosingDate = new Date(now.getFullYear(), now.getMonth(), closingDay);
        lastClosingDate.setHours(23, 59, 59, 999);

        // If today is before closing day, the last closing was last month
        if (now.getDate() < closingDay) {
          lastClosingDate.setMonth(lastClosingDate.getMonth() - 1);
        }

        const openTransactions = await database
          .get<Transaction>("transactions")
          .query(
            Q.where("credit_card_id", r.id),
            Q.where("deleted_at", Q.eq(null)),
            Q.where("status", Q.notEq("pending")), // Assuming pending doesn't count for total yet? Or should? Usually only completed.
            Q.where("transaction_date", Q.gt(lastClosingDate.getTime())),
          )
          .fetch();

        const openEstimate = openTransactions.reduce((acc, t) => {
          if (t.type === "expense") return acc + t.amount;
          if (t.type === "income") return acc - t.amount;
          return acc;
        }, 0);

        return {
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
          next_invoice_estimate: openEstimate,
        } as CreditCardRow & { next_invoice_estimate: number };
      }),
    );
  },

  /**
   * Busca um cartão pelo ID
   */
  async getCardById(id: string) {
    try {
      const record = await database.get<any>("credit_cards").find(id);
      return {
        id: record.id,
        user_id: record.userId,
        name: record.name,
        currency_code: record.currencyCode,
        credit_limit: record.creditLimit,
        current_balance: record.currentBalance,
        available_limit: record.creditLimit - record.currentBalance,
        closing_day: record.closingDay,
        due_day: record.dueDay,
        brand: record.brand,
        color: record.color,
        is_active: record.isActive,
        created_at: record.createdAt?.toISOString() || "",
        updated_at: record.updatedAt?.toISOString() || "",
      } as CreditCardRow;
    } catch (e) {
      return null;
    }
  },

  /**
   * Busca transações recentes para o dashboard (apenas confirmadas)
   */
  async getRecentTransactions(limit = 5) {
    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("status", Q.notEq("pending")), Q.sortBy("transaction_date", Q.desc), Q.sortBy("created_at", Q.desc), Q.take(limit))
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
          transaction_date: t.transactionDate.toISOString().split("T")[0],
          category_id: t.category.id,
          account_id: t.account.id,
          credit_card_id: t.creditCard.id,
          status: t.status || "completed",
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
   * Calcula resumo financeiro do mês atual (apenas confirmadas)
   */
  async getMonthlySummary(currencyCode = "BRL") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const transactions = await database
      .get<Transaction>("transactions")
      .query(
        Q.where("deleted_at", Q.eq(null)),
        Q.where("status", Q.notEq("pending")),
        Q.where("currency_code", currencyCode),
        Q.where("transaction_date", Q.gte(firstDay)),
        Q.where("transaction_date", Q.lte(lastDay)),
      )
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
   * Busca gastos por categoria no mês (apenas confirmadas)
   */
  async getSpendingByCategory(currencyCode = "BRL") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("status", Q.notEq("pending")), Q.where("type", "expense"), Q.where("currency_code", currencyCode), Q.where("transaction_date", Q.gte(firstDay)))
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
   * Recalcula o saldo de todas as contas do usuário com base nas transações CONFIRMADAS (Offline)
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
          .query(Q.where("account_id", account.id), Q.where("deleted_at", Q.eq(null)), Q.where("status", Q.notEq("pending")), Q.where("type", Q.notEq("transfer")))
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

  async updateCreditCard(id: string, updates: Partial<Database["public"]["Tables"]["credit_cards"]["Update"]>) {
    await database.write(async () => {
      const card = await database.get<any>("credit_cards").find(id);
      await card.update((c: any) => {
        if (updates.name !== undefined) c.name = updates.name;
        if (updates.brand !== undefined) c.brand = updates.brand;
        if (updates.credit_limit !== undefined) c.creditLimit = Number(updates.credit_limit);
        if (updates.current_balance !== undefined) c.currentBalance = Number(updates.current_balance);
        if (updates.closing_day !== undefined) c.closingDay = updates.closing_day;
        if (updates.due_day !== undefined) c.dueDay = updates.due_day;
        if (updates.color !== undefined) c.color = updates.color;
        if (updates.is_active !== undefined) c.isActive = updates.is_active;
      });
    });
    mySync().catch(console.error);
    return true;
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
        t.transactionDate = new Date(transaction.transaction_date);
        t.status = "completed";

        if (transaction.category_id) t.category.id = transaction.category_id;
        if (transaction.account_id) t.account.id = transaction.account_id;
        if (transaction.credit_card_id) t.creditCard.id = transaction.credit_card_id;
      });

      // Atualizar saldo da conta vinculada (Apenas se completada)
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
          console.error("Account balance update error:", e);
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
          console.error("Credit card balance update error:", e);
        }
      }
    });

    BudgetService.checkAndNotifyBudgets(user.id).catch(console.error);
    mySync().catch(console.error);
    return newTransactionRecord!._raw;
  },

  /**
   * Cria transações complexas (Parceladas ou Recorrentes)
   */
  async createComplexTransaction(
    baseData: Partial<TransactionRow>,
    options: {
      isInstallment?: boolean;
      installments?: number;
      installmentMode?: "total" | "parcel";
      isRecurring?: boolean;
      recurrenceFreq?: "daily" | "weekly" | "biweekly" | "monthly" | "bimonthly" | "semiannual" | "annual";
      recurrenceCount?: number;
    },
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const userId = user.id;
    const recordsToCreate: any[] = [];
    const createdDate = new Date();

    let count = 1;
    let isInstallment = false;

    if (options.isInstallment && options.installments && options.installments > 1) {
      count = options.installments;
      isInstallment = true;
    } else if (options.isRecurring && options.recurrenceCount && options.recurrenceCount > 1) {
      count = options.recurrenceCount;
    }

    const baseDate = new Date(baseData.transaction_date || createdDate);
    const baseAmount = Number(baseData.amount || 0);

    let amountPerTx = baseAmount;
    if (isInstallment && options.installmentMode === "total") {
      amountPerTx = baseAmount / count;
    }

    for (let i = 0; i < count; i++) {
      const txDate = new Date(baseDate);

      if (isInstallment) {
        const nextDate = safeAddMonths(baseDate, i);
        txDate.setTime(nextDate.getTime());
      } else if (options.isRecurring && options.recurrenceFreq) {
        const f = options.recurrenceFreq;
        if (f === "daily") txDate.setDate(txDate.getDate() + i);
        if (f === "weekly") txDate.setDate(txDate.getDate() + i * 7);
        if (f === "biweekly") txDate.setDate(txDate.getDate() + i * 14);
        if (f === "monthly") {
          const nextDate = safeAddMonths(baseDate, i);
          txDate.setTime(nextDate.getTime());
        }
        if (f === "bimonthly") {
          const nextDate = safeAddMonths(baseDate, i * 2);
          txDate.setTime(nextDate.getTime());
        }
        if (f === "semiannual") {
          const nextDate = safeAddMonths(baseDate, i * 6);
          txDate.setTime(nextDate.getTime());
        }
        if (f === "annual") txDate.setFullYear(txDate.getFullYear() + i);
      }

      let desc = baseData.description || "";
      let status: "completed" | "pending" = "completed";

      if (isInstallment) {
        desc = `${desc} (${i + 1}/${count})`;
        status = "completed"; // Parcelas consomem limite imediatamente
      } else if (options.isRecurring && count > 1) {
        desc = `${desc} (Rec.)`;
        status = i === 0 ? "completed" : "pending"; // Futuras são pendentes
      }

      recordsToCreate.push({
        ...baseData,
        amount: amountPerTx,
        transaction_date: txDate.toISOString(),
        description: desc,
        user_id: userId,
        status,
      });
    }

    await database.write(async () => {
      const batchOps = [];
      const transactionCollection = database.get<Transaction>("transactions");

      for (const record of recordsToCreate) {
        batchOps.push(
          transactionCollection.prepareCreate((t) => {
            t.userId = userId;
            t.amount = record.amount;
            t.type = record.type as any;
            t.description = record.description;
            t.transactionDate = new Date(record.transaction_date);
            t.currencyCode = record.currency_code || "BRL";
            t.status = record.status;
            if (record.category_id) t.category.id = record.category_id;
            if (record.account_id) t.account.id = record.account_id;
            if (record.credit_card_id) t.creditCard.id = record.credit_card_id;
          }),
        );
      }

      const completedTotal = recordsToCreate.filter((r) => r.status === "completed").reduce((acc, r) => acc + r.amount, 0);

      if (baseData.account_id && baseData.type !== "transfer" && completedTotal > 0) {
        try {
          const acc = await database.get<Account>("bank_accounts").find(baseData.account_id);
          batchOps.push(
            acc.prepareUpdate((a) => {
              if (baseData.type === "income") a.currentBalance += completedTotal;
              else a.currentBalance -= completedTotal;
            }),
          );
        } catch (e) {
          console.error(e);
        }
      }

      if (baseData.credit_card_id && baseData.type === "expense" && completedTotal > 0) {
        try {
          const card = await database.get<any>("credit_cards").find(baseData.credit_card_id);
          batchOps.push(
            card.prepareUpdate((c: any) => {
              c.currentBalance += completedTotal;
            }),
          );
        } catch (e) {
          console.error(e);
        }
      }

      await database.batch(...batchOps);
    });

    mySync().catch(console.error);
    return true;
  },

  async updateTransactionToComplex(
    id: string,
    updates: Partial<Database["public"]["Tables"]["transactions"]["Update"]>,
    options: {
      isInstallment?: boolean;
      installments?: number;
      installmentMode?: "total" | "parcel";
      isRecurring?: boolean;
      recurrenceFreq?: "daily" | "weekly" | "biweekly" | "monthly" | "bimonthly" | "semiannual" | "annual";
      recurrenceCount?: number;
    },
  ) {
    // 1. Update the original transaction first
    await this.updateTransaction(id, updates);

    // 2. Determine if we need to create future records
    let count = 0;
    let isInstallment = false;

    if (options.isInstallment && options.installments! > 1) {
      count = options.installments!;
      isInstallment = true;
    } else if (options.isRecurring && options.recurrenceCount! > 1) {
      count = options.recurrenceCount!;
    }

    if (count > 1) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) return;

      const t = await database.get<Transaction>("transactions").find(id);
      const baseDate = t.transactionDate;
      const baseAmount = t.amount;
      const recordsToCreate: any[] = [];

      // Start from i = 1 (future ones)
      for (let i = 1; i < count; i++) {
        const txDate = new Date(baseDate);
        if (isInstallment) {
          const nextDate = safeAddMonths(baseDate, i);
          txDate.setTime(nextDate.getTime());
        } else if (options.isRecurring && options.recurrenceFreq) {
          const f = options.recurrenceFreq;
          if (f === "daily") txDate.setDate(txDate.getDate() + i);
          if (f === "weekly") txDate.setDate(txDate.getDate() + i * 7);
          if (f === "biweekly") txDate.setDate(txDate.getDate() + i * 14);
          if (f === "monthly") {
            const nextDate = safeAddMonths(baseDate, i);
            txDate.setTime(nextDate.getTime());
          }
          if (f === "bimonthly") {
            const nextDate = safeAddMonths(baseDate, i * 2);
            txDate.setTime(nextDate.getTime());
          }
          if (f === "semiannual") {
            const nextDate = safeAddMonths(baseDate, i * 6);
            txDate.setTime(nextDate.getTime());
          }
          if (f === "annual") txDate.setFullYear(txDate.getFullYear() + i);
        }

        let desc = t.description;
        let status: "completed" | "pending" = "pending";

        if (isInstallment) {
          desc = `${t.description} (${i + 1}/${count})`;
          status = "completed";
        } else {
          desc = `${t.description} (Rec.)`;
          status = "pending";
        }

        recordsToCreate.push({
          userId,
          amount: baseAmount,
          type: t.type,
          description: desc,
          transactionDate: txDate,
          currencyCode: t.currencyCode,
          status,
          category_id: t.category.id,
          account_id: t.account.id,
          credit_card_id: t.creditCard.id,
        });
      }

      if (recordsToCreate.length > 0) {
        await database.write(async () => {
          const batchOps = [];
          const transactionCollection = database.get<Transaction>("transactions");

          for (const r of recordsToCreate) {
            batchOps.push(
              transactionCollection.prepareCreate((nt) => {
                nt.userId = r.userId;
                nt.amount = r.amount;
                nt.type = r.type;
                nt.description = r.description;
                nt.transactionDate = r.transactionDate;
                nt.currencyCode = r.currencyCode;
                nt.status = r.status as any;
                if (r.category_id) nt.category.id = r.category_id;
                if (r.account_id) nt.account.id = r.account_id;
                if (r.credit_card_id) nt.creditCard.id = r.credit_card_id;
              }),
            );
          }

          const completedTotal = recordsToCreate.filter((r) => r.status === "completed").reduce((acc, r) => acc + r.amount, 0);

          if (completedTotal > 0) {
            if (t.account.id) {
              const acc = await t.account.fetch();
              if (acc) {
                batchOps.push(
                  acc.prepareUpdate((a) => {
                    if (t.type === "income") a.currentBalance += completedTotal;
                    else a.currentBalance -= completedTotal;
                  }),
                );
              }
            }
            if (t.creditCard.id && t.type === "expense") {
              const card = await t.creditCard.fetch();
              if (card) {
                batchOps.push(
                  card.prepareUpdate((c: any) => {
                    c.currentBalance += completedTotal;
                  }),
                );
              }
            }
          }

          await database.batch(...batchOps);
        });
      }
    }

    mySync().catch(console.error);
    return true;
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
          transaction_date: t.transactionDate.toISOString().split("T")[0],
          category_id: t.category.id,
          account_id: t.account.id,
          credit_card_id: t.creditCard.id,
          status: t.status || "completed",
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
        transaction_date: t.transactionDate.toISOString().split("T")[0],
        category_id: t.category.id,
        account_id: t.account.id,
        credit_card_id: t.creditCard.id,
        status: t.status || "completed",
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

      // Update account balance (reverse) - Only if it was completed
      if (transaction.status !== "pending" && transaction.account.id) {
        const account = await transaction.account.fetch();
        if (account) {
          await account.update((a: Account) => {
            if (transaction.type === "income") a.currentBalance -= transaction.amount;
            else if (transaction.type === "expense") a.currentBalance += transaction.amount;
          });
        }
      }
      if (transaction.status !== "pending" && transaction.creditCard.id && transaction.type === "expense") {
        const card = await transaction.creditCard.fetch();
        if (card) {
          await card.update((c: any) => {
            c.currentBalance -= transaction.amount;
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

      await updated.update((t) => {
        if (updates.amount !== undefined) t.amount = Number(updates.amount);
        if (updates.type !== undefined) t.type = updates.type as any;
        if (updates.description !== undefined) t.description = updates.description || "";
        if (updates.notes !== undefined) t.notes = updates.notes || undefined;
        if (updates.transaction_date !== undefined) t.transactionDate = new Date(updates.transaction_date);
        if (updates.category_id !== undefined) t.category.id = updates.category_id;
        if (updates.account_id !== undefined) t.account.id = updates.account_id;
        if (updates.credit_card_id !== undefined) t.creditCard.id = updates.credit_card_id;
        if (updates.status !== undefined) t.status = updates.status as any;
      });
    });

    await this.recalculateAccountBalances();
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

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
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
          Q.where("status", Q.notEq("pending")),
          Q.where("currency_code", currencyCode),
          Q.where("transaction_date", Q.gte(startDate.getTime())),
          Q.where("transaction_date", Q.lte(endDate.getTime())),
        )
        .fetch(),
      database
        .get<Transaction>("transactions")
        .query(
          Q.where("deleted_at", Q.eq(null)),
          Q.where("status", Q.notEq("pending")),
          Q.where("currency_code", currencyCode),
          Q.where("transaction_date", Q.gte(prevStartDate.getTime())),
          Q.where("transaction_date", Q.lte(prevEndDate.getTime())),
        )
        .fetch(),
      this.getCategories(),
    ]);

    const catMapById = new Map(allCategories.map((c) => [c.id, c.name]));

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

  async getMonthlyEvolution(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("deleted_at", Q.eq(null)), Q.where("status", Q.notEq("pending")), Q.where("transaction_date", Q.gte(sixMonthsAgo.getTime())), Q.sortBy("transaction_date", Q.asc))
      .fetch();

    const result: Record<string, { income: number; expense: number }> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result[key] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (result[key]) {
        if (t.type === "income") result[key].income += t.amount;
        else if (t.type === "expense") result[key].expense += t.amount;
      }
    });

    return Object.entries(result)
      .map(([month, data]) => ({ month, ...data, balance: data.income - data.expense }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  async getCardTransactions(cardId: string, month: number, year: number) {
    const card = await database.get<any>("credit_cards").find(cardId);
    const closingDay = card.closingDay || 1;

    // A fatura fecha no dia closingDay do mês/ano solicitado.
    // Ela começa no dia closingDay+1 do mês anterior.
    const invoiceCloseDate = new Date(year, month, closingDay, 23, 59, 59, 999);
    const invoiceStartDate = new Date(year, month - 1, closingDay + 1, 0, 0, 0, 0);

    const start = invoiceStartDate.getTime();
    const end = invoiceCloseDate.getTime();

    const records = await database
      .get<Transaction>("transactions")
      .query(
        Q.where("deleted_at", Q.eq(null)),
        Q.where("credit_card_id", cardId),
        Q.where("transaction_date", Q.gte(start)),
        Q.where("transaction_date", Q.lte(end)),
        Q.sortBy("transaction_date", Q.desc),
      )
      .fetch();

    const transactions = await Promise.all(
      records.map(async (t) => {
        const category = await t.category.fetch();
        return {
          id: t.id,
          amount: t.amount,
          type: t.type,
          description: t.description,
          transaction_date: t.transactionDate.toISOString(),
          status: t.status || "completed",
          category: category ? { name: category.name, icon: category.icon, color: category.color } : null,
          currency_code: t.currencyCode,
        };
      }),
    );

    const total = transactions.reduce((acc, t) => acc + t.amount, 0);

    return { transactions, total };
  },

  async payInvoice(cardId: string, amount: number, accountId: string, date: Date) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user");

    await database.write(async () => {
      const card = await database.get<any>("credit_cards").find(cardId);
      const account = await database.get<Account>("bank_accounts").find(accountId);

      // 1. Create payment transaction
      await database.get<Transaction>("transactions").create((t) => {
        t.userId = user.id;
        t.amount = amount;
        t.type = "expense";
        t.description = `Pagamento Fatura: ${card.name}`;
        t.transactionDate = date;
        t.currencyCode = card.currencyCode;
        t.status = "completed";
        t.account.id = accountId;
      });

      // 2. Update account balance
      await account.update((a) => {
        a.currentBalance -= amount;
      });

      // 3. Update card balance (lower debt)
      await card.update((c: any) => {
        c.currentBalance -= amount;
      });
    });

    mySync().catch(console.error);
    return true;
  },
};
