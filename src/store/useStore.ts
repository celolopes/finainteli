import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { Transaction, Goal } from "../types";
import { seedData } from "../utils/seed";

interface AppState {
  transactions: Transaction[];
  goals: Goal[];
  theme: "light" | "dark";
  isLoading: boolean;

  // Actions
  addTransaction: (t: Transaction) => void;
  setTransactions: (t: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Goal) => void;
  setGoalPlan: (plan: string) => void;
  toggleTheme: () => void;
  initialize: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      transactions: [],
      goals: [],
      theme: "dark", // Default to dark for "Premium" feel
      isLoading: true,

      addTransaction: (t) => set((state) => ({ transactions: [t, ...state.transactions] })),
      setTransactions: (t) => set({ transactions: t }),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addGoal: (g) => set((state) => ({ goals: [...state.goals, g] })),
      setGoalPlan: (plan) =>
        set((state) => {
          const goals = [...state.goals];
          if (goals.length > 0) goals[0].aiPlan = plan; // Simple single goal support for now
          return { goals };
        }),

      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      initialize: async () => {
        set({ isLoading: true });
        const data = await seedData();
        if (data) set({ transactions: data });
        set({ isLoading: false });
      },
    }),
    {
      name: "finainteli-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
