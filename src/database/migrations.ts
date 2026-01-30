import { addColumns, createTable, schemaMigrations } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "transactions",
          columns: [{ name: "credit_card_id", type: "string", isIndexed: true, isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: "budgets",
          columns: [
            { name: "last_alert_sent_at", type: "number", isOptional: true },
            { name: "last_alert_threshold", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: "transactions",
          columns: [{ name: "status", type: "string", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        createTable({
          name: "ai_usage_logs",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "model_id", type: "string" },
            { name: "prompt_tokens", type: "number" },
            { name: "candidates_tokens", type: "number" },
            { name: "total_tokens", type: "number" },
            { name: "cost_brl", type: "number" },
            { name: "feature_name", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
  ],
});
