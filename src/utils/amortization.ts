export type CreditInsights = {
  monthlyInterest: number;
  monthsToPayoff: number | null;
  payoffDate: Date | null;
  message: string | null;
};

/**
 * Calculate monthly interest amount
 * @param balance Current balance
 * @param monthlyInterestRate Monthly interest rate as decimal (e.g., 0.02 for 2%)
 */
export function calculateMonthlyInterest(
  balance: number,
  monthlyInterestRate: number
): number {
  return balance * monthlyInterestRate;
}

/**
 * Calculate months to payoff using amortization formula
 * n = -ln(1 - (r × B) / P) / ln(1 + r)
 * @param balance Current balance
 * @param monthlyPayment Monthly payment amount
 * @param monthlyInterestRate Monthly interest rate as decimal
 * @param additionalPayment Additional payment amount
 * @returns Object with months and payoff date, or null if unpayable
 */
export function calculateMonthsToPayoff(
  balance: number,
  monthlyPayment: number,
  monthlyInterestRate: number,
  additionalPayment: number = 0
): { months: number; payoffDate: Date } | null {
  const totalPayment = monthlyPayment + additionalPayment;

  // If no interest, simple division
  if (monthlyInterestRate === 0) {
    if (totalPayment <= 0) return null;
    const months = Math.ceil(balance / totalPayment);
    const payoffDate = new Date();
    // First payment is this month, so payoff is (months - 1) months from now
    payoffDate.setMonth(payoffDate.getMonth() + months - 1);
    return { months, payoffDate };
  }

  // Check if payment covers interest
  const monthlyInterest = balance * monthlyInterestRate;
  if (totalPayment <= monthlyInterest) {
    return null; // Payment doesn't cover interest, will never pay off
  }

  // Amortization formula: n = -ln(1 - (r × B) / P) / ln(1 + r)
  const r = monthlyInterestRate;
  const B = balance;
  const P = totalPayment;

  const numerator = -Math.log(1 - (r * B) / P);
  const denominator = Math.log(1 + r);
  const months = Math.ceil(numerator / denominator);

  const payoffDate = new Date();
  // First payment is this month, so payoff is (months - 1) months from now
  payoffDate.setMonth(payoffDate.getMonth() + months - 1);

  return { months, payoffDate };
}

/**
 * Format a date to Spanish locale month and year
 * @param date Date to format
 */
export function formatPayoffMonth(date: Date): string {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/**
 * Calculate all credit insights for a credit record
 * @param balance Current balance
 * @param monthlyPayment Monthly payment
 * @param interestRate Monthly interest rate as percentage (e.g., 2 for 2%)
 * @param additionalPayment Additional payment
 */
export function calculateCreditInsights(
  balance: number | null | undefined,
  monthlyPayment: number | null | undefined,
  interestRate: number | null | undefined,
  additionalPayment: number | null | undefined
): CreditInsights {
  const safeBalance = balance ?? 0;
  const safeMonthlyPayment = monthlyPayment ?? 0;
  const safeInterestRate = interestRate ?? 0;
  const safeAdditionalPayment = additionalPayment ?? 0;

  // Convert percentage to decimal
  const monthlyInterestRate = safeInterestRate / 100;

  // Edge case: Already paid off
  if (safeBalance <= 0) {
    return {
      monthlyInterest: 0,
      monthsToPayoff: null,
      payoffDate: null,
      message: "Credito pagado",
    };
  }

  // Edge case: Missing payment or interest data
  if (safeMonthlyPayment === 0 || safeInterestRate === 0) {
    return {
      monthlyInterest: calculateMonthlyInterest(safeBalance, monthlyInterestRate),
      monthsToPayoff: null,
      payoffDate: null,
      message: "Ingresa el pago mensual y la tasa de interes para ver los calculos",
    };
  }

  const monthlyInterest = calculateMonthlyInterest(safeBalance, monthlyInterestRate);
  const payoffResult = calculateMonthsToPayoff(
    safeBalance,
    safeMonthlyPayment,
    monthlyInterestRate,
    safeAdditionalPayment
  );

  // Edge case: Payment doesn't cover interest
  if (payoffResult === null) {
    return {
      monthlyInterest,
      monthsToPayoff: null,
      payoffDate: null,
      message: "El pago no cubre los intereses",
    };
  }

  return {
    monthlyInterest,
    monthsToPayoff: payoffResult.months,
    payoffDate: payoffResult.payoffDate,
    message: null,
  };
}
