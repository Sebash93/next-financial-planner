import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateMonthlyInterest,
  calculateMonthsToPayoff,
  formatPayoffMonth,
  calculateCreditInsights,
} from "./amortization";

describe("amortization", () => {
  describe("calculateMonthlyInterest", () => {
    it("calculates interest correctly", () => {
      // 2% monthly interest on $10,000 balance
      expect(calculateMonthlyInterest(10000, 0.02)).toBe(200);
    });

    it("returns 0 for zero balance", () => {
      expect(calculateMonthlyInterest(0, 0.02)).toBe(0);
    });

    it("returns 0 for zero interest rate", () => {
      expect(calculateMonthlyInterest(10000, 0)).toBe(0);
    });
  });

  describe("calculateMonthsToPayoff", () => {
    it("calculates months correctly with interest", () => {
      // $10,000 balance, $500 payment, 2% monthly interest
      const result = calculateMonthsToPayoff(10000, 500, 0.02, 0);
      expect(result).not.toBeNull();
      expect(result!.months).toBe(26);
    });

    it("calculates months with additional payment", () => {
      // $10,000 balance, $500 payment + $200 additional, 2% monthly interest
      const result = calculateMonthsToPayoff(10000, 500, 0.02, 200);
      expect(result).not.toBeNull();
      expect(result!.months).toBe(17);
    });

    it("returns null when payment equals interest", () => {
      // $10,000 balance, $200 payment, 2% monthly interest (interest = $200)
      const result = calculateMonthsToPayoff(10000, 200, 0.02, 0);
      expect(result).toBeNull();
    });

    it("returns null when payment is less than interest", () => {
      // $10,000 balance, $100 payment, 2% monthly interest (interest = $200)
      const result = calculateMonthsToPayoff(10000, 100, 0.02, 0);
      expect(result).toBeNull();
    });

    it("handles zero interest rate", () => {
      // $10,000 balance, $500 payment, 0% interest
      const result = calculateMonthsToPayoff(10000, 500, 0, 0);
      expect(result).not.toBeNull();
      expect(result!.months).toBe(20);
    });

    it("returns null for zero payment and zero interest", () => {
      const result = calculateMonthsToPayoff(10000, 0, 0, 0);
      expect(result).toBeNull();
    });

    it("returns a payoff date in the future", () => {
      const result = calculateMonthsToPayoff(10000, 500, 0.02, 0);
      expect(result).not.toBeNull();
      expect(result!.payoffDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("formatPayoffMonth", () => {
    it("formats date in Spanish locale", () => {
      const date = new Date(2025, 5, 15); // June 2025
      const result = formatPayoffMonth(date);
      expect(result).toBe("junio de 2025");
    });

    it("formats January correctly", () => {
      const date = new Date(2026, 0, 1); // January 2026
      const result = formatPayoffMonth(date);
      expect(result).toBe("enero de 2026");
    });
  });

  describe("calculateCreditInsights", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1)); // January 1, 2025
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns paid off message for zero balance", () => {
      const result = calculateCreditInsights(0, 500, 2, 0);
      expect(result.message).toBe("Credito pagado");
      expect(result.monthlyInterest).toBe(0);
    });

    it("returns paid off message for negative balance", () => {
      const result = calculateCreditInsights(-100, 500, 2, 0);
      expect(result.message).toBe("Credito pagado");
    });

    it("returns missing data message when payment is zero", () => {
      const result = calculateCreditInsights(10000, 0, 2, 0);
      expect(result.message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });

    it("returns missing data message when interest is zero", () => {
      const result = calculateCreditInsights(10000, 500, 0, 0);
      expect(result.message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });

    it("returns cannot cover interest message when payment is too low", () => {
      // 2% on $10,000 = $200 interest, but payment is only $150
      const result = calculateCreditInsights(10000, 150, 2, 0);
      expect(result.message).toBe("El pago no cubre los intereses");
      expect(result.monthlyInterest).toBe(200);
    });

    it("calculates insights correctly for valid data", () => {
      // $10,000 balance, $500 payment, 2% interest
      const result = calculateCreditInsights(10000, 500, 2, 0);
      expect(result.message).toBeNull();
      expect(result.monthlyInterest).toBe(200);
      expect(result.monthsToPayoff).toBe(26);
      expect(result.payoffDate).not.toBeNull();
    });

    it("handles null values gracefully", () => {
      const result = calculateCreditInsights(null, null, null, null);
      expect(result.message).toBe("Credito pagado"); // 0 balance = paid
    });

    it("handles undefined values gracefully", () => {
      const result = calculateCreditInsights(undefined, undefined, undefined, undefined);
      expect(result.message).toBe("Credito pagado");
    });

    it("includes additional payment in calculation", () => {
      // $10,000 balance, $500 payment + $200 additional, 2% interest
      const result = calculateCreditInsights(10000, 500, 2, 200);
      expect(result.monthsToPayoff).toBe(17);
    });

    it("calculates payoff next month for small balance with large payment", () => {
      // $2,000 balance, $1,500 payment, 1% interest
      // Month 1 (Jan): 2000 + 20 interest - 1500 = 520
      // Month 2 (Feb): 520 + 5.2 interest - 1500 = paid off
      const result = calculateCreditInsights(2000, 1500, 1, 0);
      expect(result.message).toBeNull();
      expect(result.monthlyInterest).toBe(20);
      expect(result.monthsToPayoff).toBe(2);
      // First payment is January, second payment is February -> payoff in February
      expect(result.payoffDate).toEqual(new Date(2025, 1, 1)); // February 2025
    });
  });
});
