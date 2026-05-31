import { eachMonthOfInterval, startOfMonth } from "date-fns";
import { buildCreditMonthlyView, type CreditInput } from "./credit-flow";

export type PlanFlowReport = {
  recurring: {
    incomeTotal: number;
    budgetTotal: number;
  };
  /** start-of-month timestamps in milliseconds */
  range: { startMonth: number; endMonth: number };
  /** month = start-of-month (ms); total = summed EXPENSE_FLOW amount */
  expenseFlowByMonth: { month: number; total: number }[];
  credits: CreditInput[];
  creditFlowPayments: { creditRecordId: number; date: number; amount: number }[];
};

export type MonthlyFlow = {
  month: number; // start-of-month (ms)
  income: number;
  budget: number;
  creditPayment: number; // recurring monthly payment total
  otherCosts: number; // recurring credit otherCosts total
  creditExtraPayment: number; // flow extra payments this month
  expenseFlow: number;
  debt: number; // projected total debt this month
  monthBalance: number; // income - budget - expenseFlow - creditPayment - otherCosts - creditExtraPayment
  cumulativeBalance: number; // running carryover up to & including this month
};

/**
 * Build a per-month flow with standalone and cumulative (carryover) balances.
 * Credit components (monthly payment, otherCosts, extra payments) and the
 * projected debt come from buildCreditMonthlyView.
 */
export function buildMonthlyFlow(report: PlanFlowReport): MonthlyFlow[] {
  const { recurring, range, expenseFlowByMonth, credits, creditFlowPayments } = report;

  if (range.startMonth > range.endMonth) return [];

  const expenseByMonth = new Map<number, number>();
  for (const { month, total } of expenseFlowByMonth) {
    const key = startOfMonth(month).getTime();
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + total);
  }

  const creditView = buildCreditMonthlyView(credits, creditFlowPayments, range);
  const creditByMonth = new Map(creditView.map((c) => [c.month, c]));

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });

  let cumulative = 0;
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const expenseFlow = expenseByMonth.get(month) ?? 0;
    const cv = creditByMonth.get(month);
    const creditPayment = cv?.monthlyPayment ?? 0;
    const otherCosts = cv?.otherCosts ?? 0;
    const creditExtraPayment = cv?.extraPayments ?? 0;
    const debt = cv?.debt ?? 0;
    const monthBalance =
      recurring.incomeTotal - recurring.budgetTotal - expenseFlow - creditPayment - otherCosts - creditExtraPayment;
    cumulative += monthBalance;
    return {
      month,
      income: recurring.incomeTotal,
      budget: recurring.budgetTotal,
      creditPayment,
      otherCosts,
      creditExtraPayment,
      expenseFlow,
      debt,
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

/**
 * Clamp the planning window to start no earlier than the current month.
 * All inputs are millisecond timestamps.
 */
export function clampMonthRange(
  planStartMs: number,
  nowMs: number,
  planEndMs: number
): { startMonth: number; endMonth: number } {
  const startMonth = Math.max(startOfMonth(planStartMs).getTime(), startOfMonth(nowMs).getTime());
  const endMonth = startOfMonth(planEndMs).getTime();
  return { startMonth, endMonth };
}
