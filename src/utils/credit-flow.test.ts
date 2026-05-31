import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildExtraPaymentsByMonth, creditBalanceAfterPayment } from "./credit-flow";

const month = (y: number, m: number) => startOfMonth(new Date(y, m, 1)).getTime();

describe("buildExtraPaymentsByMonth", () => {
  it("sums payment amounts by start-of-month", () => {
    const map = buildExtraPaymentsByMonth([
      { date: new Date(2026, 1, 10).getTime(), amount: 300 },
      { date: new Date(2026, 1, 25).getTime(), amount: 200 },
      { date: new Date(2026, 2, 3).getTime(), amount: 100 },
    ]);
    expect(map.get(month(2026, 1))).toBe(500);
    expect(map.get(month(2026, 2))).toBe(100);
  });
});

describe("creditBalanceAfterPayment", () => {
  const credit = {
    balance: 10000,
    monthlyPayment: 500,
    interestRate: 0,
    balanceDateMs: month(2026, 0), // Jan
  };

  it("returns the balance at the end of the payment month including that payment", () => {
    const payments = [{ date: month(2026, 1), amount: 1000 }]; // Feb payment
    // through end of Feb: Jan event 9500, Feb event 9500-500-1000=8000
    expect(creditBalanceAfterPayment(credit, payments, month(2026, 1))).toBe(8000);
  });

  it("excludes payments dated after the row's month", () => {
    const payments = [
      { date: month(2026, 1), amount: 1000 },
      { date: month(2026, 3), amount: 5000 }, // April, after the row month
    ];
    // row month = Feb -> April payment must not affect it
    expect(creditBalanceAfterPayment(credit, payments, month(2026, 1))).toBe(8000);
  });

  it("ignores payments before the Fecha Saldo month", () => {
    const payments = [{ date: month(2025, 11), amount: 1000 }]; // Dec 2025
    // through end of Feb with no applicable extra: Jan 9500, Feb 9000
    expect(creditBalanceAfterPayment(credit, payments, month(2026, 1))).toBe(9000);
  });
});
