import { synchronize } from "@nozbe/watermelondb/sync";
import { database } from "../../database";
import { supabase } from "../supabase";

export async function mySync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = lastPulledAt ? new Date(lastPulledAt).toISOString() : new Date(0).toISOString();

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

      // Group changes by created/updated vs deleted (using deleted_at)
      const mapChanges = (items: any[]) => ({
        created: items.filter((i) => !i.deleted_at && new Date(i.created_at) > new Date(lastPulledAt || 0)),
        updated: items.filter((i) => !i.deleted_at && new Date(i.created_at) <= new Date(lastPulledAt || 0)),
        deleted: items.filter((i) => i.deleted_at).map((i) => i.id),
      });

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

      for (const [table, change] of Object.entries(changes) as [string, any][]) {
        // Push Created & Updated
        const toUpsert = [...change.created, ...change.updated].map((item) => {
          const { _status, _changed, ...rest } = item;
          return {
            ...rest,
            user_id: user.id,
          };
        });

        if (toUpsert.length > 0) {
          const { error } = await supabase.from(table).upsert(toUpsert);
          if (error) throw error;
        }

        // Push Deleted (Soft Delete on Supabase)
        if (change.deleted.length > 0) {
          const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).in("id", change.deleted);
          if (error) throw error;
        }
      }
    },
    migrationsEnabledAtVersion: 1,
  });
}
