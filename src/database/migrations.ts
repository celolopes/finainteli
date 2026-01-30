import { addColumns, schemaMigrations } from "@nozbe/watermelondb/Schema/migrations";

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
  ],
});
