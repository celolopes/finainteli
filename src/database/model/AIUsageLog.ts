import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class AIUsageLog extends Model {
  static table = "ai_usage_logs";

  @field("user_id") userId!: string;
  @field("model_id") modelId!: string;
  @field("prompt_tokens") promptTokens!: number;
  @field("candidates_tokens") candidatesTokens!: number;
  @field("total_tokens") totalTokens!: number;
  @field("cost_brl") costBrl!: number;
  @field("feature_name") featureName!: string;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
