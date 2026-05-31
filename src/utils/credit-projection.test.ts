import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { projectCreditBalance } from "./credit-projection";

const month = (y: number, m: number) => startOfMonth(new Date(y, m, 1)).getTime();

const base = {
  balance: 10000,
  monthlyPayment: 500,
  interestRate: 2, // percent
  balanceDateMs: month(2026, 0), // Jan 2026
};

describe("projectCreditBalance", () => {
  it("returns the entered balance when the target month is the Fecha Saldo month", () => {
    expect(projectCreditBalance(base, month(2026, 0))).toBe(10000);
  });

  it("returns the entered balance when the target month is before Fecha Saldo", () => {
    expect(projectCreditBalance(base, month(2025, 11))).toBe(10000);
  });

  it("applies interest then payment for one elapsed month", () => {
    // 10000 + 2% (200) - 500 = 9700
    expect(projectCreditBalance(base, month(2026, 1))).toBeCloseTo(9700, 2);
  });

  it("compounds across several months", () => {
    // m1: 9700; m2: 9700 + 194 - 500 = 9394; m3: 9394 + 187.88 - 500 = 9081.88
    expect(projectCreditBalance(base, month(2026, 3))).toBeCloseTo(9081.88, 2);
  });

  it("clamps the balance at 0 and stays there", () => {
    const small = { balance: 600, monthlyPayment: 1000, interestRate: 0, balanceDateMs: month(2026, 0) };
    // m1: max(0, 600 - 1000) = 0; m2 stays 0
    expect(projectCreditBalance(small, month(2026, 2))).toBe(0);
  });

  it("grows the balance when payment does not cover interest", () => {
    const underwater = { balance: 10000, monthlyPayment: 100, interestRate: 2, balanceDateMs: month(2026, 0) };
    // m1: 10000 + 200 - 100 = 10100
    expect(projectCreditBalance(underwater, month(2026, 1))).toBeCloseTo(10100, 2);
  });

  it("pays down linearly with zero interest", () => {
    const noInterest = { balance: 10000, monthlyPayment: 500, interestRate: 0, balanceDateMs: month(2026, 0) };
    // 4 months * 500 = 2000 paid -> 8000
    expect(projectCreditBalance(noInterest, month(2026, 4))).toBe(8000);
  });
});

describe("projectCreditBalance with extra payments", () => {
  const noInterest = {
    balance: 10000,
    monthlyPayment: 500,
    interestRate: 0,
    balanceDateMs: month(2026, 0), // Jan 2026
  };

  it("applies an extra payment in its month", () => {
    // Jan event: 10000 - 500 = 9500; Feb event: 9500 - 500 - 1000 = 8000 -> start of Mar
    const extra = new Map<number, number>([[month(2026, 1), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(8000);
  });

  it("ignores extra payments dated before the Fecha Saldo month", () => {
    // Dec 2025 is before Jan Fecha Saldo -> never an event month -> ignored
    const extra = new Map<number, number>([[month(2025, 11), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(9000);
  });

  it("applies an extra payment dated in the Fecha Saldo month itself", () => {
    // Jan event: 10000 - 500 - 1000 = 8500; Feb event: 8500 - 500 = 8000
    const extra = new Map<number, number>([[month(2026, 0), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(8000);
  });

  it("is unchanged when no extra-payments map is passed (backward compatible)", () => {
    expect(projectCreditBalance(noInterest, month(2026, 2))).toBe(9000);
  });
});
