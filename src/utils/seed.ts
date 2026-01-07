import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "../types";

export const SEED_KEY = "@finainteli_seeded";

const CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Other"];

export const generateDemoData = async (): Promise<Transaction[]> => {
  const transactions: Transaction[] = [];
  const now = new Date();

  // Generate for last 3 months
  for (let i = 0; i < 90; i++) {
    if (Math.random() > 0.7) continue; // Skip some days

    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const isIncome = Math.random() > 0.9;
    const category = isIncome ? "Income" : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const amount = isIncome ? Math.floor(Math.random() * 2000) + 1000 : Math.floor(Math.random() * 100) + 10;

    transactions.push({
      id: Math.random().toString(36).substring(7),
      title: isIncome ? "Salary/Freelance" : `${category} Expense`,
      amount,
      type: isIncome ? "income" : "expense",
      category,
      date: date.toISOString(),
      notes: "Demo transaction",
    });
  }

  return transactions;
};

export const seedData = async () => {
  const hasSeeded = await AsyncStorage.getItem(SEED_KEY);
  if (hasSeeded) return;

  const demoData = await generateDemoData();
  await AsyncStorage.setItem("transactions", JSON.stringify(demoData));
  await AsyncStorage.setItem(SEED_KEY, "true");
  return demoData;
};
