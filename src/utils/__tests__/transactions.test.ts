import { Transaction } from "../../types";
import { groupTransactionsByDate } from "../transactions";

// Mock i18n
jest.mock("../../i18n", () => ({
  t: (key: string) => {
    if (key === "transactions.today") return "Hoje";
    if (key === "transactions.yesterday") return "Ontem";
    return key;
  },
}));

describe("groupTransactionsByDate", () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];
  const olderDate = "2023-01-01";

  const mockTransactions: Transaction[] = [
    { id: "1", title: "T1", amount: 10, type: "expense", category: "Food", date: today },
    { id: "2", title: "T2", amount: 20, type: "income", category: "Salary", date: today },
    { id: "3", title: "T3", amount: 30, type: "expense", category: "Transport", date: yesterday },
    { id: "4", title: "T4", amount: 40, type: "expense", category: "Old", date: olderDate },
  ];

  it("should group transactions by date correctly", () => {
    const sections = groupTransactionsByDate(mockTransactions);

    expect(sections).toHaveLength(3);

    // Check Today
    const todaySection = sections.find((s) => s.title === "Hoje");
    expect(todaySection).toBeDefined();
    expect(todaySection?.data).toHaveLength(2);
    expect(todaySection?.data.map((t) => t.id)).toEqual(expect.arrayContaining(["1", "2"]));

    // Check Yesterday
    const yesterdaySection = sections.find((s) => s.title === "Ontem");
    expect(yesterdaySection).toBeDefined();
    expect(yesterdaySection?.data).toHaveLength(1);
    expect(yesterdaySection?.data[0].id).toBe("3");

    // Check Older
    // Note: date-fns formatting might depend on locale, but checking existence is enough
    const olderSection = sections.find((s) => s.data[0].date === olderDate);
    expect(olderSection).toBeDefined();
    expect(olderSection?.data).toHaveLength(1);
  });

  it("should sort sections by date descending (newest first)", () => {
    const sections = groupTransactionsByDate(mockTransactions);

    // Since we know the input dates: Today > Yesterday > Older
    // Index 0 should be Today, 1 should be Yesterday, 2 should be Older

    expect(sections[0].title).toBe("Hoje");
    expect(sections[1].title).toBe("Ontem");
    // The older one will have a formatted date title
  });

  it("should handle empty input", () => {
    const sections = groupTransactionsByDate([]);
    expect(sections).toHaveLength(0);
  });
});
