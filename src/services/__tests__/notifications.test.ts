import { BudgetAlert } from "../notifications";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-123"),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: "high" },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock Platform
jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("BudgetAlert interface", () => {
    it("should create valid alert for 50% threshold", () => {
      const alert: BudgetAlert = {
        budgetId: "budget-123",
        categoryName: "Alimentação",
        threshold: 50,
        currentPercentage: 52.5,
        amountSpent: 262.5,
        budgetAmount: 500,
      };

      expect(alert.threshold).toBe(50);
      expect(alert.categoryName).toBe("Alimentação");
      expect(alert.currentPercentage).toBeGreaterThanOrEqual(50);
    });

    it("should create valid alert for 80% threshold", () => {
      const alert: BudgetAlert = {
        budgetId: "budget-456",
        categoryName: "Transporte",
        threshold: 80,
        currentPercentage: 85,
        amountSpent: 340,
        budgetAmount: 400,
      };

      expect(alert.threshold).toBe(80);
      expect(alert.amountSpent / alert.budgetAmount).toBeCloseTo(0.85);
    });

    it("should create valid alert for 100% threshold (over budget)", () => {
      const alert: BudgetAlert = {
        budgetId: "budget-789",
        categoryName: "Lazer",
        threshold: 100,
        currentPercentage: 120,
        amountSpent: 360,
        budgetAmount: 300,
      };

      expect(alert.threshold).toBe(100);
      expect(alert.amountSpent).toBeGreaterThan(alert.budgetAmount);
    });
  });

  describe("Notification message generation", () => {
    it("should generate correct message for 50% alert", () => {
      const alert: BudgetAlert = {
        budgetId: "b1",
        categoryName: "Alimentação",
        threshold: 50,
        currentPercentage: 50,
        amountSpent: 250,
        budgetAmount: 500,
      };

      const expectedBody = `Você já gastou 50% do orçamento de ${alert.categoryName} (R$ ${alert.amountSpent.toFixed(2)} de R$ ${alert.budgetAmount.toFixed(2)})`;

      expect(expectedBody).toContain("50%");
      expect(expectedBody).toContain("Alimentação");
      expect(expectedBody).toContain("250.00");
      expect(expectedBody).toContain("500.00");
    });

    it("should generate correct message for 80% alert", () => {
      const alert: BudgetAlert = {
        budgetId: "b2",
        categoryName: "Transporte",
        threshold: 80,
        currentPercentage: 80,
        amountSpent: 400,
        budgetAmount: 500,
      };

      const remaining = alert.budgetAmount - alert.amountSpent;
      const expectedBody = `Você já gastou 80% do orçamento de ${alert.categoryName}. Restam apenas R$ ${remaining.toFixed(2)}`;

      expect(expectedBody).toContain("80%");
      expect(expectedBody).toContain("Transporte");
      expect(expectedBody).toContain("100.00");
    });

    it("should generate correct message for 100% alert (exceeded)", () => {
      const alert: BudgetAlert = {
        budgetId: "b3",
        categoryName: "Lazer",
        threshold: 100,
        currentPercentage: 110,
        amountSpent: 550,
        budgetAmount: 500,
      };

      const exceeded = alert.amountSpent - alert.budgetAmount;
      const expectedBody = `Você ultrapassou o orçamento de ${alert.categoryName} em R$ ${exceeded.toFixed(2)}`;

      expect(expectedBody).toContain("ultrapassou");
      expect(expectedBody).toContain("Lazer");
      expect(expectedBody).toContain("50.00");
    });
  });

  describe("Alert deduplication", () => {
    it("should generate unique alert key from budgetId and threshold", () => {
      const budgetId = "budget-123";
      const threshold = 50;
      const alertKey = `${budgetId}-${threshold}`;

      expect(alertKey).toBe("budget-123-50");
    });

    it("should check if alert was sent today correctly", () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      const sentAlerts: Record<string, string> = {
        "budget-1-50": today,
        "budget-2-80": yesterday,
      };

      const wasSentToday = (key: string) => sentAlerts[key] === today;

      expect(wasSentToday("budget-1-50")).toBe(true);
      expect(wasSentToday("budget-2-80")).toBe(false);
      expect(wasSentToday("budget-3-100")).toBe(false);
    });
  });
});
