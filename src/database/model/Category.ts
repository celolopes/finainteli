import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class Category extends Model {
  static table = "categories";

  @field("user_id") userId?: string;
  @field("name") name!: string;
  @field("icon") icon!: string;
  @field("color") color!: string;
  @field("type") type?: "income" | "expense" | "both";

  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
