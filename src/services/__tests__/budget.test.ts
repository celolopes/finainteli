import { database } from "../../database";
import { BudgetService } from "../budget";
import { NotificationService } from "../notifications";

// Mock dependencies
jest.mock("../../database", () => ({
  database: {
    get: jest.fn(),
    write: jest.fn((callback) => callback()),
  },
}));

jest.mock("../notifications", () => ({
  NotificationService: {
    scheduleLocalNotification: jest.fn(),
  },
}));

// Mock sync
jest.mock("../sync", () => ({
  mySync: jest.fn().mockResolvedValue(undefined),
}));

describe("BudgetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkAndNotifyBudgets", () => {
    it("should notify when threshold is reached", async () => {
      // Mock checkBudgetStatus response
      const mockStatuses = [
        {
          budget_id: "b1",
          category_id: "c1",
          category_name: "Food",
          budget_amount: 1000,
          spent_amount: 850,
          percentage: 85,
          remaining: 150,
          alert_level: "alert_80",
          alerts_enabled: { 50: true, 80: true, 100: true },
        },
      ];

      // Spy on checkBudgetStatus
      jest.spyOn(BudgetService, "checkBudgetStatus").mockResolvedValue(mockStatuses as any);

      // Mock database.find
      const mockBudgetRecord: any = {
        alert100: true,
        alert80: true,
        alert50: true,
        lastAlertThreshold: 50,
        update: jest.fn(),
      };

      mockBudgetRecord.update.mockImplementation((cb: any) => cb(mockBudgetRecord));

      (database.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(mockBudgetRecord),
      });

      await BudgetService.checkAndNotifyBudgets("user1");

      // Should have checked status
      expect(BudgetService.checkBudgetStatus).toHaveBeenCalledWith("user1");

      // Should have sent notification for 80%
      expect(NotificationService.scheduleLocalNotification).toHaveBeenCalledWith("Alerta de Orçamento", expect.stringContaining("80%"), expect.objectContaining({ budgetId: "b1", threshold: 80 }));

      // Should have updated lastAlertThreshold
      expect(mockBudgetRecord.lastAlertThreshold).toBe(80);
    });

    it("should NOT notify if already notified for that threshold", async () => {
      // Mock checkBudgetStatus response
      const mockStatuses = [
        {
          budget_id: "b1",
          category_id: "c1",
          category_name: "Food",
          budget_amount: 1000,
          spent_amount: 850,
          percentage: 85,
          remaining: 150,
          alert_level: "alert_80",
          alerts_enabled: { 50: true, 80: true, 100: true },
        },
      ];

      jest.spyOn(BudgetService, "checkBudgetStatus").mockResolvedValue(mockStatuses as any);

      // Mock database.find
      const mockBudgetRecord = {
        alert100: true,
        alert80: true,
        alert50: true,
        lastAlertThreshold: 80, // ALREADY notified 80
        update: jest.fn(),
      };

      (database.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(mockBudgetRecord),
      });

      await BudgetService.checkAndNotifyBudgets("user1");

      expect(NotificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });
  });
});
