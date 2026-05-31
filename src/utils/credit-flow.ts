import { addMonths, startOfMonth } from "date-fns";
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
