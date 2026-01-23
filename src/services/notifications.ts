import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuthStore } from "../store/authStore";

// Configure default handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface BudgetAlert {
  budgetId: string;
  categoryName: string;
  threshold: 50 | 80 | 100;
  currentPercentage: number;
  amountSpent: number;
  budgetAmount: number;
}

export const NotificationService = {
  async requestPermissions() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("budget-alerts", {
        name: "Budget Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  },

  async scheduleLocalNotification(title: string, body: string, data = {}) {
    const profile = useAuthStore.getState().profile;
    // Default to true if undefined
    if (profile?.notifications_enabled === false) {
      console.log("Notificações desativadas nas preferências do usuário");
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediate
    });
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  },

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  },
};
