import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIFICATION_PERMISSION_KEY = "@finainteli/notification_permission";
const SENT_ALERTS_KEY = "@finainteli/sent_budget_alerts";

export interface BudgetAlert {
  budgetId: string;
  categoryName: string;
  threshold: number; // 50, 80, 100
  currentPercentage: number;
  amountSpent: number;
  budgetAmount: number;
}

export const NotificationService = {
  /**
   * Solicita permissão para enviar notificações
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("Notificações requerem dispositivo físico");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação negada");
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "denied");
      return false;
    }

    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "granted");

    // Configurar canal no Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("budget-alerts", {
        name: "Alertas de Orçamento",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
      });
    }

    return true;
  },

  /**
   * Verifica se as permissões foram concedidas
   */
  async hasPermission(): Promise<boolean> {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    if (stored === "denied") return false;

    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  },

  /**
   * Envia notificação de alerta de orçamento
   */
  async sendBudgetAlert(alert: BudgetAlert): Promise<string | null> {
    const hasPermission = await this.hasPermission();
    if (!hasPermission) return null;

    // Verificar se já enviamos esse alerta hoje
    const alertKey = `${alert.budgetId}-${alert.threshold}`;
    const sentToday = await this.wasAlertSentToday(alertKey);
    if (sentToday) {
      console.log(`Alerta ${alertKey} já enviado hoje`);
      return null;
    }

    // Montar mensagem baseada no threshold
    let title: string;
    let body: string;
    let icon: string;

    if (alert.threshold === 50) {
      title = "⚠️ Atenção com seus gastos";
      body = `Você já gastou 50% do orçamento de ${alert.categoryName} (R$ ${alert.amountSpent.toFixed(2)} de R$ ${alert.budgetAmount.toFixed(2)})`;
      icon = "alert-circle";
    } else if (alert.threshold === 80) {
      title = "🔴 Orçamento quase esgotado";
      body = `Você já gastou 80% do orçamento de ${alert.categoryName}. Restam apenas R$ ${(alert.budgetAmount - alert.amountSpent).toFixed(2)}`;
      icon = "alert";
    } else {
      title = "🚨 Orçamento excedido!";
      body = `Você ultrapassou o orçamento de ${alert.categoryName} em R$ ${(alert.amountSpent - alert.budgetAmount).toFixed(2)}`;
      icon = "alert-octagon";
    }

    // Agendar notificação imediata
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "budget_alert",
          budgetId: alert.budgetId,
          categoryName: alert.categoryName,
          threshold: alert.threshold,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Imediato
    });

    // Marcar como enviado
    await this.markAlertAsSent(alertKey);

    return notificationId;
  },

  /**
   * Verifica se um alerta específico já foi enviado hoje
   */
  async wasAlertSentToday(alertKey: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SENT_ALERTS_KEY);
      if (!stored) return false;

      const sentAlerts: Record<string, string> = JSON.parse(stored);
      const lastSent = sentAlerts[alertKey];

      if (!lastSent) return false;

      // Verificar se foi hoje
      const today = new Date().toISOString().split("T")[0];
      return lastSent === today;
    } catch {
      return false;
    }
  },

  /**
   * Marca um alerta como enviado hoje
   */
  async markAlertAsSent(alertKey: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SENT_ALERTS_KEY);
      const sentAlerts: Record<string, string> = stored ? JSON.parse(stored) : {};

      const today = new Date().toISOString().split("T")[0];
      sentAlerts[alertKey] = today;

      await AsyncStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(sentAlerts));
    } catch (error) {
      console.error("Erro ao marcar alerta:", error);
    }
  },

  /**
   * Limpa alertas antigos (opcional, para manutenção)
   */
  async clearOldAlerts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SENT_ALERTS_KEY);
      if (!stored) return;

      const sentAlerts: Record<string, string> = JSON.parse(stored);
      const today = new Date().toISOString().split("T")[0];

      // Manter apenas alertas de hoje
      const filtered: Record<string, string> = {};
      for (const [key, value] of Object.entries(sentAlerts)) {
        if (value === today) {
          filtered[key] = value;
        }
      }

      await AsyncStorage.setItem(SENT_ALERTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Erro ao limpar alertas:", error);
    }
  },

  /**
   * Cancela todas as notificações pendentes
   */
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Obtém contagem de badge
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Define contagem de badge
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },
};
