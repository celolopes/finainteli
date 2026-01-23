import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class Account extends Model {
  static table = "bank_accounts";

  @field("user_id") userId!: string;
  @field("name") name!: string;
  @field("account_type") accountType!: string;
  @field("currency_code") currencyCode!: string;
  @field("initial_balance") initialBalance!: number;
  @field("current_balance") currentBalance!: number;
  @field("color") color?: string;
  @field("icon") icon?: string;

  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
