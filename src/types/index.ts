export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

export interface Goal {
  targetAmount: number;
  deadline: string;
  currentAmount?: number; // Calculated dynamically usually
  aiPlan?: string;
}

export interface UserState {
  theme: "light" | "dark" | "system";
  hasOnboarded: boolean;
}
