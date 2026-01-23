import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import Category from "./Category";

export default class Budget extends Model {
  static table = "budgets";

  static associations: any = {
    categories: { type: "belongs_to", key: "category_id" },
  };

  @field("user_id") userId!: string;
  @field("category_id") categoryId!: string;
  @field("amount") amount!: number;
  @field("period") period!: string;
  @field("is_active") isActive!: boolean;
  @field("alert_50") alert50!: boolean;
  @field("alert_80") alert80!: boolean;
  @field("alert_100") alert100!: boolean;
  @field("last_alert_sent_at") lastAlertSentAt?: number;
  @field("last_alert_threshold") lastAlertThreshold?: number;

  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  @relation("categories", "category_id") category!: Relation<Category>;
}
