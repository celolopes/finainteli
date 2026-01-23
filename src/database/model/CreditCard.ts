import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class CreditCard extends Model {
  static table = "credit_cards";

  @field("user_id") userId!: string;
  @field("name") name!: string;
  @field("brand") brand?: string;
  @field("closing_day") closingDay!: number;
  @field("due_day") dueDay!: number;
  @field("credit_limit") creditLimit!: number;
  @field("current_balance") currentBalance!: number;
  @field("currency_code") currencyCode!: string;
  @field("color") color?: string;
  @field("is_active") isActive!: boolean;

  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
