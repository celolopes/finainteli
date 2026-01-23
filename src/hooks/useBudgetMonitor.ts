import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { BudgetService, BudgetStatus } from "../services/budget";
import { NotificationService } from "../services/notifications";
import { supabase } from "../services/supabase";

const ALERT_STORAGE_KEY = "@budget_alerts_sent";

export const useBudgetMonitor = () => {
  const checkBudgets = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const statusList = await BudgetService.checkBudgetStatus(user.id);
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

      // Load history
      const sentAlertsRaw = await AsyncStorage.getItem(ALERT_STORAGE_KEY);
      let sentAlerts = sentAlertsRaw ? JSON.parse(sentAlertsRaw) : {};
      let hasChanges = false;

      for (const status of statusList) {
        if (status.alert_level === "none") continue;

        // Check if alerts are enabled for this level
        const levelKey = status.alert_level === "exceeded" ? 100 : Number(status.alert_level);
        // @ts-ignore
        if (!status.alerts_enabled[levelKey]) continue;

        // Dedup key: ID + Level + Date
        // Example: uuid_80_2024-01-23
        const alertKey = `${status.budget_id}_${status.alert_level}_${dateStr}`;

        if (sentAlerts[alertKey]) continue;

        // Content
        let title = "⚠️ Alerta de Gastos";
        let body = `Você atingiu ${status.percentage.toFixed(0)}% do orçamento de ${status.category_name}.`;

        if (status.alert_level === "exceeded") {
          title = "🚨 Orçamento Estourado!";
          body = `Você ultrapassou seu limite em ${status.category_name} por R$ ${Math.abs(status.remaining).toFixed(2)}.`;
        } else if (status.alert_level === "100") {
          title = "🛑 Orçamento Atingido";
          body = `Você consumiu todo o orçamento de ${status.category_name}.`;
        }

        await NotificationService.scheduleLocalNotification(title, body, { budgetId: status.budget_id });

        sentAlerts[alertKey] = true;
        hasChanges = true;
      }

      if (hasChanges) {
        await AsyncStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(sentAlerts));
      }
    } catch (error) {
      console.log("UseBudgetMonitor: Error checking budgets", error);
    }
  }, []);

  useEffect(() => {
    checkBudgets();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkBudgets();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkBudgets]);

  return { checkBudgets };
};

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const data = await BudgetService.checkBudgetStatus(user.id);
        setBudgets(data);
      }
    } catch (error) {
      console.error("Failed to load budgets", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { budgets, isLoading, refresh };
};
