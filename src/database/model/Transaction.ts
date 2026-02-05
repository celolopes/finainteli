import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import Account from "./Account";
import Category from "./Category";
import CreditCard from "./CreditCard";

export default class Transaction extends Model {
  static table = "transactions";

  static associations: any = {
    categories: { type: "belongs_to", key: "category_id" },
    bank_accounts: { type: "belongs_to", key: "account_id" },
    credit_cards: { type: "belongs_to", key: "credit_card_id" },
  };

  @field("user_id") userId!: string;
  @field("amount") amount!: number;
  @field("type") type!: "income" | "expense" | "transfer";
  @field("description") description!: string;
  @field("notes") notes?: string;
  @field("currency_code") currencyCode!: string;
  @field("status") status?: "pending" | "completed" | "cancelled";

  @date("transaction_date") transactionDate!: Date;
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  @field("is_installment") isInstallment!: boolean;
  @field("installment_number") installmentNumber?: number;
  @field("total_installments") totalInstallments?: number;
  @field("parent_transaction_id") parentTransactionId?: string;

  @relation("categories", "category_id") category!: Relation<Category>;
  @relation("bank_accounts", "account_id") account!: Relation<Account>;
  @relation("credit_cards", "credit_card_id") creditCard!: Relation<CreditCard>;
}
