import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import i18n from "../i18n";
import { Transaction } from "../types";

export interface TransactionSection {
  title: string;
  data: Transaction[];
}

export const groupTransactionsByDate = (transactions: Transaction[]): TransactionSection[] => {
  const grouped: { [key: string]: Transaction[] } = {};

  transactions.forEach((transaction) => {
    if (!transaction.date) return;

    // Ensure we work with YYYY-MM-DD
    const dateObj = typeof transaction.date === "string" ? parseISO(transaction.date) : transaction.date;
    const dateKey = format(dateObj, "yyyy-MM-dd");

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(transaction);
  });

  // Sort keys descending (newest first)
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    const date = parseISO(key);
    let title = format(date, "dd 'de' MMMM", { locale: ptBR });

    if (isToday(date)) {
      title = i18n.t("transactions.today");
    } else if (isYesterday(date)) {
      title = i18n.t("transactions.yesterday");
    } else {
      // Capitalize month if needed, but standard pt-BR is lowercase usually.
      // Let's capitalize: "28 de Janeiro"
      // date-fns returns "28 de janeiro".
      // Split and capitalize month?
      // Let's leave it natural for now or capitalize for style.
      // User print usually shows "Hoje", so cleanliness is key.
    }

    return {
      title,
      data: grouped[key],
    };
  });
};
