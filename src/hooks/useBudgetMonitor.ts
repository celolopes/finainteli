import { useCallback, useEffect, useState } from "react";
import { BudgetService, BudgetStatus } from "../services/budget";
import { BudgetAlert, NotificationService } from "../services/notifications";
import { useAuthStore } from "../store/authStore";

interface UseBudgetMonitorReturn {
  budgetStatuses: BudgetStatus[];
  isLoading: boolean;
  error: Error | null;
  checkBudgets: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
}

/**
 * Hook para monitorar orçamentos e disparar notificações
 * Uso: Chamar checkBudgets() no Dashboard ou após criar transação
 */
export const useBudgetMonitor = (): UseBudgetMonitorReturn => {
  const { session } = useAuthStore();
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Verifica orçamentos e dispara notificações se necessário
   */
  const checkBudgets = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Buscar status de todos os orçamentos
      const statuses = await BudgetService.checkBudgetStatus();
      setBudgetStatuses(statuses);

      // 2. Verificar quais precisam de alerta
      for (const status of statuses) {
        if (status.alertLevel > 0) {
          const alert: BudgetAlert = {
            budgetId: status.budget.id,
            categoryName: status.budget.category?.name || "Categoria",
            threshold: status.alertLevel,
            currentPercentage: status.percentage,
            amountSpent: status.spent,
            budgetAmount: Number(status.budget.amount),
          };

          // 3. Tentar enviar notificação (serviço verifica duplicatas)
          const notificationId = await NotificationService.sendBudgetAlert(alert);

          if (notificationId) {
            // Atualizar timestamp no banco
            await BudgetService.updateLastAlertSent(status.budget.id);
            console.log(`Alerta enviado: ${status.budget.category?.name} - ${status.alertLevel}%`);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar orçamentos:", err);
      setError(err instanceof Error ? err : new Error("Erro desconhecido"));
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  /**
   * Solicita permissão de notificação
   */
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    return await NotificationService.requestPermissions();
  }, []);

  // Verificar ao montar (opcional - pode ser chamado manualmente)
  useEffect(() => {
    if (session?.user) {
      // Limpar alertas antigos ao abrir o app
      NotificationService.clearOldAlerts();
    }
  }, [session?.user]);

  return {
    budgetStatuses,
    isLoading,
    error,
    checkBudgets,
    requestNotificationPermission,
  };
};

/**
 * Hook simplificado apenas para buscar orçamentos (sem notificações)
 */
export const useBudgets = () => {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const statuses = await BudgetService.checkBudgetStatus();
      setBudgets(statuses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar orçamentos"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    isLoading,
    error,
    refresh: fetchBudgets,
  };
};
