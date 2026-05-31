import { addMonths, eachMonthOfInterval, startOfMonth } from "date-fns";
import { projectCreditBalance, type CreditProjectionInput } from "./credit-projection";

export type FlowPayment = { date: number; amount: number };

/** Sum CREDIT_FLOW payment amounts by start-of-month (ms). */
export function buildExtraPaymentsByMonth(payments: FlowPayment[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of payments) {
    const key = startOfMonth(p.date).getTime();
    map.set(key, (map.get(key) ?? 0) + p.amount);
  }
  return map;
}

/**
 * A credit's balance at the END of `paymentMonthMs` (start of the next month),
 * applying all flow payments for that credit (payments after the row's month are
 * naturally excluded because the projection stops at paymentMonth+1).
 */
export function creditBalanceAfterPayment(
  credit: CreditProjectionInput,
  payments: FlowPayment[],
  paymentMonthMs: number
): number {
  const extra = buildExtraPaymentsByMonth(payments);
  const target = startOfMonth(addMonths(startOfMonth(paymentMonthMs), 1)).getTime();
  return projectCreditBalance(credit, target, extra);
}

export type CreditInput = {
  id: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number; // percent
  otherCosts: number;
  balanceDateMs: number; // Fecha Saldo (ms)
};

export type CreditMonth = {
  month: number; // start-of-month ms
  monthlyPayment: number; // Σ credits' monthlyPayment (constant)
  otherCosts: number; // Σ credits' otherCosts (constant)
  extraPayments: number; // Σ flow payments dated this month
  debt: number; // Σ each credit's projected balance at this month
};

/**
 * Per-month credit aggregates across all credits in a plan: constant monthly
 * payment / otherCosts totals, that month's flow extra payments, and the total
 * projected debt (each credit rolled forward from its Fecha Saldo, applying its
 * own flow payments).
 */
export function buildCreditMonthlyView(
  credits: CreditInput[],
  flowPayments: { creditRecordId: number; date: number; amount: number }[],
  range: { startMonth: number; endMonth: number }
): CreditMonth[] {
  if (range.startMonth > range.endMonth) return [];

  const monthlyPaymentTotal = credits.reduce((s, c) => s + c.monthlyPayment, 0);
  const otherCostsTotal = credits.reduce((s, c) => s + c.otherCosts, 0);

  const extraByCredit = new Map<number, Map<number, number>>();
  for (const c of credits) extraByCredit.set(c.id, new Map());
  const extraTotalByMonth = new Map<number, number>();
  for (const p of flowPayments) {
    const key = startOfMonth(p.date).getTime();
    extraTotalByMonth.set(key, (extraTotalByMonth.get(key) ?? 0) + p.amount);
    const perCredit = extraByCredit.get(p.creditRecordId);
    if (perCredit) perCredit.set(key, (perCredit.get(key) ?? 0) + p.amount);
  }

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const debt = credits.reduce(
      (sum, c) =>
        sum +
        projectCreditBalance(
          {
            balance: c.currentBalance,
            monthlyPayment: c.monthlyPayment,
            interestRate: c.interestRate,
            balanceDateMs: c.balanceDateMs,
          },
          month,
          extraByCredit.get(c.id)
        ),
      0
    );
    return {
      month,
      monthlyPayment: monthlyPaymentTotal,
      otherCosts: otherCostsTotal,
      extraPayments: extraTotalByMonth.get(month) ?? 0,
      debt,
    };
  });
}
