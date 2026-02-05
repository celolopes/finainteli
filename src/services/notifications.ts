import * as Notifications from "expo-notifications";
import { useAuthStore } from "../store/authStore";
import { FinancialService } from "./financial";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  },

  /**
   * Checks for overdue transactions and sends a notification if found
   */
  async checkAndNotifyOverdueTransactions() {
    const { profile } = useAuthStore.getState();
    if (!profile?.notifications_enabled) return;

    try {
      const overdueCount = await FinancialService.getOverdueTransactionsCount();
      if (overdueCount > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Transações Atrasadas",
            body: `Você possui ${overdueCount} transação(ões) pendente(s) que já passaram do prazo.`,
            data: { screen: "transactions", type: "overdue" },
          },
          trigger: null, // Send now
        });
      }
    } catch (e) {
      console.error("Error checking overdue transactions:", e);
    }
  },
};
