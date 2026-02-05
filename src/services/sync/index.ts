import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "../../database";
import { supabase } from "../supabase";

let isSyncing = false;

export async function mySync() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        let timestamp: string;
        try {
          // FORCE SYNC RESET: If the sync was done with the broken version (which saved 1970 dates),
          // we force a full pull (lastPulledAt = 0) to repair the local database.
          // The broken sync likely happened around 2026-01-29.
          const REPAIR_THRESHOLD = 1838191600000; // Future date to force repair
          const safeLastPulledAt = lastPulledAt && lastPulledAt > REPAIR_THRESHOLD ? lastPulledAt : 0;

          const date = safeLastPulledAt ? new Date(safeLastPulledAt) : new Date(0);
          // Sanity check: if date is invalid or too far in future/past, reset
          if (isNaN(date.getTime()) || date.getFullYear() > 2100) {
            timestamp = new Date(0).toISOString();
          } else {
            timestamp = date.toISOString();
          }
        } catch (e) {
          timestamp = new Date(0).toISOString();
        }

        // PULL from Supabase
        const [transactions, categories, accounts, budgets, cards] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).gt("updated_at", timestamp),
          supabase.from("categories").select("*").or(`user_id.eq.${user.id},user_id.is.null`).gt("updated_at", timestamp),
          supabase.from("bank_accounts").select("*").eq("user_id", user.id).gt("updated_at", timestamp),
          supabase.from("budgets").select("*").eq("user_id", user.id).gt("updated_at", timestamp),
          supabase.from("credit_cards").select("*").eq("user_id", user.id).gt("updated_at", timestamp),
        ]);

        if (transactions.error) throw transactions.error;
        if (categories.error) throw categories.error;
        if (accounts.error) throw accounts.error;
        if (budgets.error) throw budgets.error;
        if (cards.error) throw cards.error;

        console.log(`[SYNC DEBUG] User: ${user.id}`);
        console.log(`[SYNC DEBUG] Pulled: ${transactions.data.length} transactions, ${accounts.data.length} accounts`);

        // Group changes by created/updated vs deleted (using deleted_at)
        const dateFields = ["created_at", "updated_at", "deleted_at", "transaction_date", "date", "last_alert_sent_at"];

        const mapChanges = (items: any[]) => {
          const processedItems = items.map((item) => {
            const newItem = { ...item };
            dateFields.forEach((field) => {
              if (newItem[field] && typeof newItem[field] === "string") {
                // Better date parsing for React Native / Hermes
                // Convert "2026-01-29 18:00:00" to "2026-01-29T18:00:00"
                // And ensure "2026-01-29" is parsed as noon UTC to avoid timezone shifts
                let dateStr = newItem[field].replace(" ", "T");
                if (dateStr.length === 10) {
                  dateStr += "T12:00:00Z";
                }

                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  newItem[field] = date.getTime();
                } else {
                  console.warn(`[Sync] Failed to parse date: ${newItem[field]} for field ${field}`);
                  // Fallback for critical fields
                  if (field === "transaction_date" || field === "created_at") {
                    newItem[field] = Date.now();
                  }
                }
              }
            });
            return newItem;
          });

          // Logic for first pull vs incremental pull
          // If safeLastPulledAt was 0, we consider everything updated (to overwrite existing corrupted local data)
          const isFreshPull = !lastPulledAt || lastPulledAt <= 1838191600000;

          return {
            created: isFreshPull ? [] : processedItems.filter((i) => !i.deleted_at && i.created_at > (lastPulledAt || 0)),
            updated: isFreshPull ? processedItems.filter((i) => !i.deleted_at) : processedItems.filter((i) => !i.deleted_at && i.created_at <= (lastPulledAt || 0)),
            deleted: processedItems.filter((i) => i.deleted_at).map((i) => i.id),
          };
        };

        return {
          changes: {
            transactions: mapChanges(transactions.data),
            categories: mapChanges(categories.data),
            bank_accounts: mapChanges(accounts.data),
            budgets: mapChanges(budgets.data),
            credit_cards: mapChanges(cards.data),
          },
          timestamp: Date.now(),
        };
      },
      pushChanges: async ({ changes }) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const PUSH_PRIORITY = ["categories", "bank_accounts", "credit_cards", "budgets", "transactions"];
        const tables = Object.keys(changes).sort((a, b) => {
          const idxA = PUSH_PRIORITY.indexOf(a);
          const idxB = PUSH_PRIORITY.indexOf(b);
          // If both are known, sort by index. If unknown, push to end.
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });

        for (const table of tables) {
          const change = (changes as any)[table];
          // Push Created & Updated
          const toUpsert = [...change.created, ...change.updated]
            .filter((item) => {
              // Filter out non-UUID ids (length 36) to prevent sync crash
              if (item.id && item.id.length !== 36) {
                console.warn(`[Sync] Skipping item with invalid UUID: ${item.id} in table ${table}`);
                return false;
              }
              return true;
            })
            .map((item) => {
              const { _status, _changed, ...rest } = item;

              // Convert WatermelonDB timestamps (numbers) to ISO strings for Supabase
              const converted = { ...rest };
              const dateFields = ["created_at", "updated_at", "deleted_at", "transaction_date", "date"];

              dateFields.forEach((field) => {
                if (typeof converted[field] === "number" && converted[field] > 0) {
                  converted[field] = new Date(converted[field]).toISOString();
                } else if (typeof converted[field] === "number") {
                  // Se o timestamp for 0 ou inválido, evitamos enviar 1970 se possível
                  if (field === "transaction_date") {
                    converted[field] = new Date().toISOString();
                  } else {
                    delete converted[field];
                  }
                }
              });

              return {
                ...converted,
                user_id: user.id,
              };
            });

          try {
            if (toUpsert.length > 0) {
              const { error } = await supabase.from(table).upsert(toUpsert);
              if (error) throw error;
            }

            // Push Deleted (Soft Delete on Supabase)
            if (change.deleted.length > 0) {
              const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).in("id", change.deleted);
              if (error) throw error;
            }
          } catch (err: any) {
            // Gracefully handle schema errors for new tables (like ai_usage_logs)
            // PGRST204: Could not find the 'updated_at' column in the schema cache
            if (table === "ai_usage_logs" && (err.code === "PGRST204" || err.message?.includes("schema cache"))) {
              console.warn(`[Sync] Skipping ${table} due to schema mismatch. Check Supabase migrations.`);
            } else {
              throw err;
            }
          }
        }
      },
      migrationsEnabledAtVersion: 1,
      sendCreatedAsUpdated: true,
    });
  } finally {
    isSyncing = false;
  }
}
