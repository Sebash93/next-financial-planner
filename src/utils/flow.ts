import { eachMonthOfInterval, startOfMonth } from "date-fns";

export type PlanFlowReport = {
  recurring: {
    incomeTotal: number;
    budgetTotal: number;
    creditPaymentTotal: number;
    creditBalanceTotal: number;
  };
  /** start-of-month timestamps in milliseconds */
  range: { startMonth: number; endMonth: number };
  /** month = start-of-month (ms); total = summed EXPENSE_FLOW amount */
  expenseFlowByMonth: { month: number; total: number }[];
};

export type MonthlyFlow = {
  month: number; // start-of-month (ms)
  income: number;
  budget: number;
  creditPayment: number;
  expenseFlow: number;
  monthBalance: number; // income - budget - creditPayment - expenseFlow
  cumulativeBalance: number; // running carryover up to & including this month
};

/**
 * Build a per-month flow with standalone and cumulative (carryover) balances.
 * Recurring totals repeat every month; only expenseFlow varies by month.
 */
export function buildMonthlyFlow(report: PlanFlowReport): MonthlyFlow[] {
  const { recurring, range, expenseFlowByMonth } = report;

  const expenseByMonth = new Map<number, number>();
  for (const { month, total } of expenseFlowByMonth) {
    const key = startOfMonth(month).getTime();
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + total);
  }

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });

  let cumulative = 0;
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const expenseFlow = expenseByMonth.get(month) ?? 0;
    const monthBalance =
      recurring.incomeTotal - recurring.budgetTotal - recurring.creditPaymentTotal - expenseFlow;
    cumulative += monthBalance;
    return {
      month,
      income: recurring.incomeTotal,
      budget: recurring.budgetTotal,
      creditPayment: recurring.creditPaymentTotal,
      expenseFlow,
      monthBalance,
      cumulativeBalance: cumulative,
    };
  });
}

/** Find the flow entry matching a timestamp's month (start-of-month). */
export function findMonthFlow(flows: MonthlyFlow[], monthTs: number): MonthlyFlow | undefined {
  const target = startOfMonth(monthTs).getTime();
  return flows.find((f) => f.month === target);
}
