export type InvoiceStatus = "pending" | "completed" | "cancelled";

export interface InvoiceTransactionLike {
  amount: number;
  type?: "income" | "expense" | "transfer" | string;
  status?: InvoiceStatus | string | null;
}

export interface InvoiceCycle {
  start: Date;
  end: Date;
  closingDate: Date;
  previousClosingDate: Date;
}

export interface OpenInvoiceRange {
  start: Date;
  end: Date;
  lastClosingDate: Date;
  nextClosingDate: Date;
}

const normalizeClosingDay = (closingDay?: number | null) => {
  const day = Number(closingDay);
  if (!day || Number.isNaN(day) || day < 1) return 1;
  return Math.min(day, 31);
};

const lastDayOfMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const clampDay = (day: number, year: number, month: number) => {
  return Math.min(day, lastDayOfMonth(year, month));
};

const buildDate = (year: number, month: number, day: number, endOfDay: boolean) => {
  if (endOfDay) {
    return new Date(year, month, day, 23, 59, 59, 999);
  }
  return new Date(year, month, day, 0, 0, 0, 0);
};

const dayAfter = (date: Date) => {
  return buildDate(date.getFullYear(), date.getMonth(), date.getDate() + 1, false);
};

const getClosingDateForMonth = (year: number, month: number, closingDay?: number | null) => {
  const day = clampDay(normalizeClosingDay(closingDay), year, month);
  return buildDate(year, month, day, true);
};

export const getInvoiceCycle = (year: number, month: number, closingDay?: number | null): InvoiceCycle => {
  const closingDate = getClosingDateForMonth(year, month, closingDay);

  const prevMonthDate = new Date(year, month, 1);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);

  const previousClosingDate = getClosingDateForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), closingDay);
  const start = dayAfter(previousClosingDate);
  const end = closingDate;

  return { start, end, closingDate, previousClosingDate };
};

export const getLastClosingDate = (now: Date, closingDay?: number | null) => {
  const closingThisMonth = getClosingDateForMonth(now.getFullYear(), now.getMonth(), closingDay);
  if (now.getTime() > closingThisMonth.getTime()) {
    return closingThisMonth;
  }

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  return getClosingDateForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), closingDay);
};

export const getOpenInvoiceRange = (now: Date, closingDay?: number | null): OpenInvoiceRange => {
  const lastClosingDate = getLastClosingDate(now, closingDay);
  const start = dayAfter(lastClosingDate);

  const closingThisMonth = getClosingDateForMonth(now.getFullYear(), now.getMonth(), closingDay);
  const nextClosingDate =
    now.getTime() > closingThisMonth.getTime()
      ? getClosingDateForMonth(now.getFullYear(), now.getMonth() + 1, closingDay)
      : closingThisMonth;

  return { start, end: nextClosingDate, lastClosingDate, nextClosingDate };
};

export const calcInvoiceTotal = (transactions: InvoiceTransactionLike[], options?: { includePending?: boolean }) => {
  const includePending = options?.includePending ?? false;

  return transactions.reduce((acc, t) => {
    const status = t.status ?? "completed";
    if (!includePending && status === "pending") return acc;
    if (status === "cancelled") return acc;

    const amount = Number(t.amount) || 0;
    if (t.type === "expense") return acc + amount;
    if (t.type === "income") return acc - amount;
    return acc;
  }, 0);
};
