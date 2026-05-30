import { differenceInCalendarMonths, startOfMonth } from "date-fns";

export type CreditProjectionInput = {
  balance: number;        // Saldo Actual at Fecha Saldo
  monthlyPayment: number;
  interestRate: number;   // percent, e.g. 2 = 2%
  balanceDateMs: number;  // Fecha Saldo (ms)
};

/**
 * Roll a credit balance from its Fecha Saldo month to the target month.
 * Each elapsed month: interest accrues, then the monthly payment applies
 * (balance clamped at 0). Pure and deterministic.
 */
export function projectCreditBalance(input: CreditProjectionInput, targetMonthMs: number): number {
  const months = differenceInCalendarMonths(
    startOfMonth(targetMonthMs),
    startOfMonth(input.balanceDateMs)
  );
  if (months <= 0) return input.balance;

  const rate = input.interestRate / 100;
  let balance = input.balance;
  for (let i = 0; i < months; i++) {
    balance = Math.max(0, balance + balance * rate - input.monthlyPayment);
  }
  return balance;
}
