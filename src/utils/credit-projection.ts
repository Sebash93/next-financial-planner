import { addMonths, differenceInCalendarMonths, startOfMonth } from "date-fns";

export type CreditProjectionInput = {
  balance: number;        // Saldo Actual at Fecha Saldo
  monthlyPayment: number;
  interestRate: number;   // percent, e.g. 2 = 2%
  balanceDateMs: number;  // Fecha Saldo (ms)
};

/**
 * Roll a credit balance from its Fecha Saldo month to the target month.
 * Month event m (starting at the Fecha Saldo month): interest accrues, then the
 * monthly payment and any extra payments dated in month m are applied (clamp 0).
 * Because iteration starts at the Fecha Saldo month, extra payments dated earlier
 * are never applied. Pure and deterministic.
 * @param extraPaymentsByMonth start-of-month ms -> total extra payment that month
 */
export function projectCreditBalance(
  input: CreditProjectionInput,
  targetMonthMs: number,
  extraPaymentsByMonth?: Map<number, number>
): number {
  const startMonth = startOfMonth(input.balanceDateMs);
  const months = differenceInCalendarMonths(startOfMonth(targetMonthMs), startMonth);
  if (months <= 0) return input.balance;

  const rate = input.interestRate / 100;
  let balance = input.balance;
  for (let i = 0; i < months; i++) {
    const monthMs = startOfMonth(addMonths(startMonth, i)).getTime();
    const extra = extraPaymentsByMonth?.get(monthMs) ?? 0;
    balance = Math.max(0, balance + balance * rate - input.monthlyPayment - extra);
  }
  return balance;
}
