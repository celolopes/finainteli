import { create } from "zustand";
import { FinancialService } from "../services/financial";
import { supabase } from "../services/supabase";
import { Database } from "../types/schema";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  category: { name: string; icon: string | null; color: string | null } | null;
};

interface FinancialState {
  accounts: BankAccount[];
  transactions: Transaction[];
  monthlySummary: { income: number; expense: number; savings: number };
  spendingByCategory: { x: string; y: number; color: string }[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;

  fetchDashboardData: () => Promise<void>;
  reset: () => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  accounts: [],
  transactions: [],
  monthlySummary: { income: 0, expense: 0, savings: 0 },
  spendingByCategory: [],
  isLoading: false,
  error: null,
  initialized: false,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        set({
          accounts: [],
          transactions: [],
          monthlySummary: { income: 0, expense: 0, savings: 0 },
          isLoading: false,
        });
        return;
      }

      // Parallel fetching for performance
      const [accounts, transactions, summary, spending] = await Promise.all([
        FinancialService.getAccounts(),
        FinancialService.getRecentTransactions(5),
        FinancialService.getMonthlySummary(),
        FinancialService.getSpendingByCategory(),
      ]);

      // Cast transactions to include category manually if needed by TS,
      // but simpler to accept `any` in implementation or cast correctly.
      set({
        accounts,
        transactions: transactions as unknown as Transaction[],
        monthlySummary: summary,
        spendingByCategory: spending,
        initialized: true,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      accounts: [],
      transactions: [],
      monthlySummary: { income: 0, expense: 0, savings: 0 },
      initialized: false,
      error: null,
    });
  },
}));
