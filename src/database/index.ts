import { setGenerator } from "@nozbe/watermelondb/utils/common/randomId";

// Pure JS UUID v4 generator to avoid 'crypto' polyfill issues and native rebuilds
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Configure WatermelonDB to use UUIDs compatible with Supabase
setGenerator(() => uuidv4());

import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "./migrations";
import Account from "./model/Account";
import Budget from "./model/Budget";
import Category from "./model/Category";
import CreditCard from "./model/CreditCard";
import Transaction from "./model/Transaction";
import schema from "./schema";

// 1. Create the adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // (Optional) Database name
  dbName: "FinAInteliDB",
  // (Recommended) JavaScript Interface usage (Native only)
  jsi: true,
  onSetUpError: (error) => {
    // Database failed to load -- agile with the user
    console.error("WatermelonDB setup error:", error);
  },
});

// 2. Create the database
export const database = new Database({
  adapter,
  modelClasses: [Transaction, Category, Account, Budget, CreditCard],
});
