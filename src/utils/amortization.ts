import { addMonths } from "date-fns";

export type CreditInsights = {
  monthlyInterest: number;
  monthsToPayoff: number | null;
  payoffDate: Date | null;
  message: string | null;
};

/**
 * Calculate monthly interest amount.
 * @param balance Current balance
 * @param monthlyInterestRate Monthly interest rate as decimal (e.g., 0.02 for 2%)
 */
export function calculateMonthlyInterest(balance: number, monthlyInterestRate: number): number {
  return balance * monthlyInterestRate;
}

/**
 * Months to pay off a balance with a fixed monthly payment.
 * n = -ln(1 - (r × B) / P) / ln(1 + r)
 * @returns number of months, or null if the payment never clears the balance.
 */
export function calculateMonthsToPayoff(
  balance: number,
  monthlyPayment: number,
  monthlyInterestRate: number
): number | null {
  if (monthlyInterestRate === 0) {
    if (monthlyPayment <= 0) return null;
    return Math.ceil(balance / monthlyPayment);
  }

  const monthlyInterest = balance * monthlyInterestRate;
  if (monthlyPayment <= monthlyInterest) return null;

  const r = monthlyInterestRate;
  const B = balance;
  const P = monthlyPayment;
  return Math.ceil(-Math.log(1 - (r * B) / P) / Math.log(1 + r));
}

/**
 * Format a date to Spanish locale month and year.
 */
export function formatPayoffMonth(date: Date): string {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/**
 * Credit insights computed from a balance already projected to `asOfMonthMs`.
 * @param projectedBalance Balance as of asOfMonthMs (see projectCreditBalance)
 * @param monthlyPayment Monthly payment
 * @param interestRate Monthly interest rate as percentage (e.g., 2 for 2%)
 * @param asOfMonthMs The month the projected balance is measured at (ms)
 */
export function calculateCreditInsights(
  projectedBalance: number | null | undefined,
  monthlyPayment: number | null | undefined,
  interestRate: number | null | undefined,
  asOfMonthMs: number
): CreditInsights {
  const safeBalance = projectedBalance ?? 0;
  const safeMonthlyPayment = monthlyPayment ?? 0;
  const safeInterestRate = interestRate ?? 0;
  const monthlyInterestRate = safeInterestRate / 100;

  if (safeBalance <= 0) {
    return { monthlyInterest: 0, monthsToPayoff: null, payoffDate: null, message: "Credito pagado" };
  }

  if (safeMonthlyPayment === 0 || safeInterestRate === 0) {
    return {
      monthlyInterest: calculateMonthlyInterest(safeBalance, monthlyInterestRate),
      monthsToPayoff: null,
      payoffDate: null,
      message: "Ingresa el pago mensual y la tasa de interes para ver los calculos",
    };
  }

  const monthlyInterest = calculateMonthlyInterest(safeBalance, monthlyInterestRate);
  const months = calculateMonthsToPayoff(safeBalance, safeMonthlyPayment, monthlyInterestRate);

  if (months === null) {
    return {
      monthlyInterest,
      monthsToPayoff: null,
      payoffDate: null,
      message: "El pago no cubre los intereses",
    };
  }

  // First payment is the as-of month, so payoff is (months - 1) months later.
  const payoffDate = addMonths(new Date(asOfMonthMs), months - 1);
  return { monthlyInterest, monthsToPayoff: months, payoffDate, message: null };
}
