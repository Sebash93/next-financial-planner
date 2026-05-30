import { describe, it, expect } from "vitest";
import {
  calculateMonthlyInterest,
  calculateMonthsToPayoff,
  formatPayoffMonth,
  calculateCreditInsights,
} from "./amortization";

const asOf = new Date(2025, 0, 1).getTime(); // January 2025

describe("amortization", () => {
  describe("calculateMonthlyInterest", () => {
    it("calculates interest correctly", () => {
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
      expect(calculateMonthsToPayoff(10000, 500, 0.02)).toBe(26);
    });
    it("returns null when payment equals interest", () => {
      expect(calculateMonthsToPayoff(10000, 200, 0.02)).toBeNull();
    });
    it("returns null when payment is less than interest", () => {
      expect(calculateMonthsToPayoff(10000, 100, 0.02)).toBeNull();
    });
    it("handles zero interest rate", () => {
      expect(calculateMonthsToPayoff(10000, 500, 0)).toBe(20);
    });
    it("returns null for zero payment and zero interest", () => {
      expect(calculateMonthsToPayoff(10000, 0, 0)).toBeNull();
    });
  });

  describe("formatPayoffMonth", () => {
    it("formats date in Spanish locale", () => {
      expect(formatPayoffMonth(new Date(2025, 5, 15))).toBe("junio de 2025");
    });
    it("formats January correctly", () => {
      expect(formatPayoffMonth(new Date(2026, 0, 1))).toBe("enero de 2026");
    });
  });

  describe("calculateCreditInsights", () => {
    it("returns paid off message for zero balance", () => {
      const result = calculateCreditInsights(0, 500, 2, asOf);
      expect(result.message).toBe("Credito pagado");
      expect(result.monthlyInterest).toBe(0);
    });
    it("returns paid off message for negative balance", () => {
      expect(calculateCreditInsights(-100, 500, 2, asOf).message).toBe("Credito pagado");
    });
    it("returns missing data message when payment is zero", () => {
      expect(calculateCreditInsights(10000, 0, 2, asOf).message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });
    it("returns missing data message when interest is zero", () => {
      expect(calculateCreditInsights(10000, 500, 0, asOf).message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });
    it("returns cannot cover interest message when payment is too low", () => {
      const result = calculateCreditInsights(10000, 150, 2, asOf);
      expect(result.message).toBe("El pago no cubre los intereses");
      expect(result.monthlyInterest).toBe(200);
    });
    it("calculates insights correctly for valid data", () => {
      const result = calculateCreditInsights(10000, 500, 2, asOf);
      expect(result.message).toBeNull();
      expect(result.monthlyInterest).toBe(200);
      expect(result.monthsToPayoff).toBe(26);
      expect(result.payoffDate).not.toBeNull();
    });
    it("handles null values gracefully", () => {
      expect(calculateCreditInsights(null, null, null, asOf).message).toBe("Credito pagado");
    });
    it("handles undefined values gracefully", () => {
      expect(calculateCreditInsights(undefined, undefined, undefined, asOf).message).toBe(
        "Credito pagado"
      );
    });
    it("computes payoff date relative to the as-of month", () => {
      // 2000 @ 1% with 1500 payment: m1 Jan -> 520, m2 Feb -> paid; payoff = Feb 2025
      const result = calculateCreditInsights(2000, 1500, 1, asOf);
      expect(result.monthsToPayoff).toBe(2);
      expect(result.payoffDate).toEqual(new Date(2025, 1, 1));
    });
  });
});
