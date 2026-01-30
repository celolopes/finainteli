export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  date: string;
  notes?: string;
  sync_status?: string;
  credit_card_id?: string | null;
}

export interface DetailedTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string | null;
  notes?: string;
  currency_code: string;
  transaction_date: string;
  category_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  status: string;
  sync_status?: string;
  category: { id: string; name: string; icon: string; color?: string } | null;
  account: { id: string; name: string; color?: string } | null;
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
