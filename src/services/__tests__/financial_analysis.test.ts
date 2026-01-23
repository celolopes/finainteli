import { database } from "../../database";
import { FinancialService } from "../financial";

// Mock dependencies
jest.mock("../../database", () => ({
  database: {
    get: jest.fn(),
  },
}));

jest.mock("../sync", () => ({
  mySync: jest.fn().mockResolvedValue(undefined),
}));

describe("FinancialService Analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFinancialAnalysis", () => {
    it("should aggregate income and expenses correctly", async () => {
      // Mock data
      const mockCurrentTransactions = [
        { type: "income", amount: 1000, category: { id: "cat1" } }, // Salary
        { type: "expense", amount: 200, category: { id: "cat2" } }, // Food
        { type: "expense", amount: 100, category: { id: "cat3" } }, // Transport
      ];

      const mockPrevTransactions = [
        { type: "expense", amount: 150, category: { id: "cat2" } }, // Food prev
      ];

      const mockCategories = [
        { id: "cat1", name: "Salary" },
        { id: "cat2", name: "Food" },
        { id: "cat3", name: "Transport" },
      ];

      // Mock DB queries
      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest
          .fn()
          .mockResolvedValueOnce(mockCurrentTransactions) // current
          .mockResolvedValueOnce(mockPrevTransactions), // prev
      };

      (database.get as jest.Mock).mockImplementation((table) => {
        if (table === "transactions") return mockCollection;
        if (table === "categories") return { query: () => ({ fetch: () => Promise.resolve(mockCategories) }) };
        return { query: () => ({ fetch: () => Promise.resolve([]) }) };
      });

      // Mock aggregations inside getFinancialAnalysis calls getCategories internally
      // We need to ensure getCategories is mocked or working
      // Ideally we spy on private methods or internal calls, but here we mocked database response

      const result = await FinancialService.getFinancialAnalysis("month", "BRL");

      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpenses).toBe(300); // 200 + 100
      expect(result.savings).toBe(700);

      // Breakdown check
      expect(result.categoryBreakdown).toHaveLength(2);
      expect(result.categoryBreakdown[0].category).toBe("Food");
      expect(result.categoryBreakdown[0].amount).toBe(200);

      // Comparison check
      expect(result.previousPeriodComparison).toBeDefined();
      expect(result.previousPeriodComparison?.totalExpenses).toBe(150);
      // Diff: (300 - 150) / 150 = 100% increase?
      // Wait, comparison logic compares total expenses
    });
  });

  describe("getMonthlyEvolution", () => {
    it("should grouping transactions by month correctly", async () => {
      const today = new Date();
      const currentMonthConf = {
        y: today.getFullYear(),
        m: today.getMonth(), // 0-based
      };

      const mockTransactions: any[] = [
        {
          transactionDate: new Date(currentMonthConf.y, currentMonthConf.m, 15),
          type: "income",
          amount: 5000,
        },
        {
          transactionDate: new Date(currentMonthConf.y, currentMonthConf.m, 20),
          type: "expense",
          amount: 2000,
        },
      ];

      const mockCollection = {
        query: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue(mockTransactions),
      };

      (database.get as jest.Mock).mockReturnValue(mockCollection);

      const evolution = await FinancialService.getMonthlyEvolution("user1");

      // Verify structure
      // Should satisfy 6 months
      expect(evolution).toHaveLength(6);

      // Check current month (last item)
      const lastMonth = evolution[evolution.length - 1];
      expect(lastMonth.income).toBe(5000);
      expect(lastMonth.expense).toBe(2000);
      expect(lastMonth.balance).toBe(3000);
    });
  });
});
