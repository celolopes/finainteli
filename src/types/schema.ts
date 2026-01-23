export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      currencies: {
        Row: {
          code: string;
          name: string;
          symbol: string;
          decimal_places: number;
          is_active: boolean;
          created_at: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          account_type: "checking" | "savings" | "investment" | "cash" | "digital_wallet" | "other";
          currency_code: string;
          initial_balance: number;
          current_balance: number;
          color: string | null;
          icon: string | null;
          institution: string | null;
          is_active: boolean;
          is_included_in_total: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bank_accounts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["bank_accounts"]["Insert"]>;
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          currency_code: string;
          credit_limit: number;
          current_balance: number;
          available_limit: number;
          closing_day: number | null;
          due_day: number | null;
          brand: string | null;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_cards"]["Row"], "id" | "created_at" | "updated_at" | "available_limit">;
        Update: Partial<Database["public"]["Tables"]["credit_cards"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: "income" | "expense" | "both";
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          is_system: boolean;
          created_at: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "income" | "expense" | "transfer";
          status: "pending" | "completed" | "cancelled";
          amount: number;
          currency_code: string;
          account_id: string | null;
          credit_card_id: string | null;
          destination_account_id: string | null;
          category_id: string | null;
          description: string | null;
          notes: string | null;
          transaction_date: string;
          created_at: string;
          updated_at: string;
          is_installment: boolean;
          installment_number: number | null;
          total_installments: number | null;
          parent_transaction_id: string | null;
          tags: string[] | null;
          location: Json | null;
          attachments: string[] | null;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          name: string | null;
          amount: number;
          currency_code: string;
          period: "monthly" | "weekly";
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          alert_threshold: number | null;
          alert_50: boolean;
          alert_80: boolean;
          alert_100: boolean;
          last_alert_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["budgets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
      };
    };
  };
}
