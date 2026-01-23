import { database } from "../../database";
import { FinancialService } from "../financial";

// Mock do WatermelonDB
jest.mock("../../database", () => ({
  database: {
    get: jest.fn(),
    write: jest.fn((callback) => callback()),
  },
}));

describe("FinancialService - Balance Recalculation", () => {
  const mockAccount = {
    id: "acc_1",
    initialBalance: 1000,
    currentBalance: 1000,
    update: jest.fn(function (this: any, callback) {
      callback(this);
      return Promise.resolve();
    }),
  };

  const mockTransactions = [
    { id: "tx_1", amount: 100, type: "income" },
    { id: "tx_2", amount: 50, type: "expense" },
    { id: "tx_3", amount: 200, type: "income" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate balance correctly: initial + incomes - expenses", async () => {
    // Setup mocks
    const mockQuery = {
      fetch: jest.fn(),
    };

    (database.get as jest.Mock).mockImplementation((table: string) => ({
      query: jest.fn().mockReturnValue(mockQuery),
    }));

    // Primeira chamada: busca contas
    mockQuery.fetch.mockResolvedValueOnce([mockAccount]);
    // Segunda chamada: busca transações da conta acc_1
    mockQuery.fetch.mockResolvedValueOnce(mockTransactions);

    await FinancialService.recalculateAccountBalances();

    // Verificações
    // 1000 (init) + 100 + 200 - 50 = 1250
    expect(mockAccount.currentBalance).toBe(1250);
    expect(mockAccount.update).toHaveBeenCalled();
  });

  it("should handle accounts with no transactions", async () => {
    const mockQuery = {
      fetch: jest.fn(),
    };

    (database.get as jest.Mock).mockImplementation(() => ({
      query: jest.fn().mockReturnValue(mockQuery),
    }));

    mockQuery.fetch.mockResolvedValueOnce([mockAccount]);
    mockQuery.fetch.mockResolvedValueOnce([]); // No transactions

    // Reset currentBalance
    mockAccount.currentBalance = 1000;

    await FinancialService.recalculateAccountBalances();

    expect(mockAccount.currentBalance).toBe(1000);
    expect(mockAccount.update).toHaveBeenCalled();
  });
});
