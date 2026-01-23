import { Q } from "@nozbe/watermelondb";
import { database } from "../database";
import BudgetModel from "../database/model/Budget";
import Transaction from "../database/model/Transaction";
import { Database } from "../types/schema";
import { NotificationService } from "./notifications";
import { supabase } from "./supabase";
import { mySync } from "./sync";

type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

export type Budget = BudgetRow & {
  category?: {
    name: string;
    color: string;
    icon: string;
  };
};

export type BudgetWithCategory = Budget;

export interface BudgetStatus {
  budget_id: string;
  category_id: string;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  percentage: number;
  remaining: number;
  alert_level: "none" | "50" | "80" | "100" | "exceeded";
  alerts_enabled: {
    50: boolean;
    80: boolean;
    100: boolean;
  };
}

export const BudgetService = {
  async getBudgets(userId: string) {
    const records = await database
      .get<BudgetModel>("budgets")
      .query(Q.where("user_id", userId), Q.where("is_active", true), Q.where("deleted_at", Q.eq(null)))
      .fetch();

    return (await Promise.all(
      records.map(async (r) => {
        const category = await r.category.fetch();
        return {
          id: r.id,
          user_id: r.userId,
          category_id: r.categoryId,
          amount: r.amount,
          period: r.period,
          is_active: r.isActive,
          alert_50: r.alert50,
          alert_80: r.alert80,
          alert_100: r.alert100,
          category: category
            ? {
                name: category.name,
                color: category.color,
                icon: category.icon,
              }
            : undefined,
        };
      }),
    )) as Budget[];
  },

  async upsertBudget(budget: Partial<Database["public"]["Tables"]["budgets"]["Insert"]> & { id?: string }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let record: BudgetModel;
    await database.write(async () => {
      if (budget.id) {
        record = await database.get<BudgetModel>("budgets").find(budget.id);
        await record.update((b) => {
          if (budget.amount !== undefined) b.amount = Number(budget.amount);
          if (budget.category_id !== undefined) b.categoryId = budget.category_id;
          if (budget.period !== undefined) b.period = budget.period;
          if (budget.is_active !== undefined) b.isActive = budget.is_active;
          if (budget.alert_50 !== undefined) b.alert50 = budget.alert_50;
          if (budget.alert_80 !== undefined) b.alert80 = budget.alert_80;
          if (budget.alert_100 !== undefined) b.alert100 = budget.alert_100;
        });
      } else {
        record = await database.get<BudgetModel>("budgets").create((b) => {
          b.userId = user.id;
          b.categoryId = budget.category_id!;
          b.amount = Number(budget.amount);
          b.period = budget.period || "monthly";
          b.isActive = budget.is_active ?? true;
          b.alert50 = budget.alert_50 ?? true;
          b.alert80 = budget.alert_80 ?? true;
          b.alert100 = budget.alert_100 ?? true;
        });
      }
    });

    mySync().catch(console.error);
    return record!._raw;
  },

  async deleteBudget(budgetId: string) {
    await database.write(async () => {
      const record = await database.get<BudgetModel>("budgets").find(budgetId);
      await record.update((b) => {
        b.deletedAt = new Date();
      });
    });
    mySync().catch(console.error);
  },

  async checkBudgetStatus(userId: string): Promise<BudgetStatus[]> {
    const budgets = await this.getBudgets(userId);
    if (!budgets || budgets.length === 0) return [];

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const transactions = await database
      .get<Transaction>("transactions")
      .query(Q.where("user_id", userId), Q.where("type", "expense"), Q.where("transaction_date", Q.gte(firstDay)), Q.where("deleted_at", Q.eq(null)))
      .fetch();

    const spendingByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.category.id) {
        spendingByCategory[t.category.id] = (spendingByCategory[t.category.id] || 0) + t.amount;
      }
    });

    return budgets.map((budget) => {
      const spent = spendingByCategory[budget.category_id!] || 0;
      const amount = Number(budget.amount);
      const percentage = (spent / amount) * 100;

      let alert_level: BudgetStatus["alert_level"] = "none";
      if (percentage >= 100) alert_level = "exceeded";
      else if (percentage >= 80) alert_level = "80";
      else if (percentage >= 50) alert_level = "50";

      return {
        budget_id: budget.id,
        category_id: budget.category_id!,
        category_name: budget.category?.name || "Categoria",
        budget_amount: amount,
        spent_amount: spent,
        percentage,
        remaining: amount - spent,
        alert_level,
        alerts_enabled: {
          50: budget.alert_50 ?? true,
          80: budget.alert_80 ?? true,
          100: budget.alert_100 ?? true,
        },
      };
    });
  },

  async checkAndNotifyBudgets(userId: string) {
    const statuses = await this.checkBudgetStatus(userId);
    const budgetsToUpdate: { budget: BudgetModel; threshold: number }[] = [];

    for (const status of statuses) {
      const budgetRecord = await database.get<BudgetModel>("budgets").find(status.budget_id);

      let thresholdToNotify: number | null = null;
      const percentage = status.percentage;

      // Determinamos o maior threshold atingido que ainda não foi notificado
      if (percentage >= 100 && budgetRecord.alert100 && budgetRecord.lastAlertThreshold !== 100) {
        thresholdToNotify = 100;
      } else if (percentage >= 80 && budgetRecord.alert80 && (budgetRecord.lastAlertThreshold || 0) < 80) {
        thresholdToNotify = 80;
      } else if (percentage >= 50 && budgetRecord.alert50 && (budgetRecord.lastAlertThreshold || 0) < 50) {
        thresholdToNotify = 50;
      }

      if (thresholdToNotify) {
        const title = thresholdToNotify === 100 ? "Orçamento Esgotado!" : "Alerta de Orçamento";
        const body = `Você atingiu ${thresholdToNotify}% do seu orçamento para ${status.category_name}.`;

        await NotificationService.scheduleLocalNotification(title, body, {
          budgetId: status.budget_id,
          threshold: thresholdToNotify,
        });

        // Agendamos atualização do registro
        budgetsToUpdate.push({ budget: budgetRecord, threshold: thresholdToNotify });
      }
    }

    if (budgetsToUpdate.length > 0) {
      await database.write(async () => {
        for (const item of budgetsToUpdate) {
          await item.budget.update((b) => {
            b.lastAlertThreshold = item.threshold;
            b.lastAlertSentAt = Date.now();
          });
        }
      });
      mySync().catch(console.error);
    }
  },
};
