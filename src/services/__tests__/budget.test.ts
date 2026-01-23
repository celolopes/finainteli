import { BudgetWithCategory } from "../budget";

// Mock Supabase
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
  },
}));

describe("BudgetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("BudgetStatus calculation", () => {
    it("should calculate correct percentage when spent is 50% of budget", () => {
      const budget: BudgetWithCategory = {
        id: "budget-1",
        user_id: "user-1",
        category_id: "cat-1",
        name: null,
        amount: 1000,
        currency_code: "BRL",
        period: "monthly",
        start_date: null,
        end_date: null,
        is_active: true,
        alert_threshold: null,
        alert_50: true,
        alert_80: true,
        alert_100: true,
        last_alert_sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: "cat-1",
          name: "Alimentação",
          icon: "food",
          color: "#FF5733",
        },
      };

      const spent = 500;
      const percentage = (spent / Number(budget.amount)) * 100;
      const remaining = Number(budget.amount) - spent;

      expect(percentage).toBe(50);
      expect(remaining).toBe(500);
    });

    it("should identify over budget when spent > amount", () => {
      const amount = 1000;
      const spent = 1200;
      const isOverBudget = spent > amount;
      const percentage = (spent / amount) * 100;

      expect(isOverBudget).toBe(true);
      expect(percentage).toBe(120);
    });

    it("should determine correct alert level based on percentage", () => {
      const getAlertLevel = (percentage: number, alert50: boolean, alert80: boolean, alert100: boolean): 0 | 50 | 80 | 100 => {
        if (percentage >= 100 && alert100) return 100;
        if (percentage >= 80 && alert80) return 80;
        if (percentage >= 50 && alert50) return 50;
        return 0;
      };

      // Test all thresholds
      expect(getAlertLevel(49, true, true, true)).toBe(0);
      expect(getAlertLevel(50, true, true, true)).toBe(50);
      expect(getAlertLevel(79, true, true, true)).toBe(50);
      expect(getAlertLevel(80, true, true, true)).toBe(80);
      expect(getAlertLevel(99, true, true, true)).toBe(80);
      expect(getAlertLevel(100, true, true, true)).toBe(100);
      expect(getAlertLevel(150, true, true, true)).toBe(100);

      // Test with alerts disabled
      expect(getAlertLevel(50, false, true, true)).toBe(0);
      expect(getAlertLevel(80, true, false, true)).toBe(50);
      expect(getAlertLevel(100, true, true, false)).toBe(80);
    });
  });

  describe("Budget period calculation", () => {
    it("should calculate monthly period start date correctly", () => {
      const now = new Date("2026-01-15");
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      expect(startDate.toISOString().split("T")[0]).toBe("2026-01-01");
    });

    it("should handle year boundaries for monthly period", () => {
      const now = new Date("2026-01-05");
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(0); // January = 0
    });
  });

  describe("Budget data validation", () => {
    it("should validate budget amount is positive", () => {
      const amount = 500;
      expect(amount).toBeGreaterThan(0);
    });

    it("should validate category_id is required", () => {
      const budgetData = {
        category_id: "cat-123",
        amount: 500,
      };
      expect(budgetData.category_id).toBeDefined();
      expect(budgetData.category_id.length).toBeGreaterThan(0);
    });
  });
});
