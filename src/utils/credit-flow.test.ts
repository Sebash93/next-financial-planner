import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildExtraPaymentsByMonth, creditBalanceAfterPayment, buildCreditMonthlyView, type CreditInput } from "./credit-flow";

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

describe("buildCreditMonthlyView", () => {
  const range = { startMonth: month(2026, 0), endMonth: month(2026, 2) }; // Jan..Mar
  const credit = (over: Partial<CreditInput> = {}): CreditInput => ({
    id: 1,
    currentBalance: 10000,
    monthlyPayment: 100,
    interestRate: 0,
    otherCosts: 50,
    balanceDateMs: month(2026, 0),
    ...over,
  });

  it("returns [] for an inverted range", () => {
    expect(buildCreditMonthlyView([credit()], [], { startMonth: month(2027, 0), endMonth: month(2026, 0) })).toEqual([]);
  });

  it("keeps monthlyPayment and otherCosts constant across months", () => {
    const view = buildCreditMonthlyView([credit(), credit({ id: 2, monthlyPayment: 200, otherCosts: 25 })], [], range);
    for (const m of view) {
      expect(m.monthlyPayment).toBe(300);
      expect(m.otherCosts).toBe(75);
    }
  });

  it("projects total debt down each month", () => {
    // single credit, 0% interest, 100/mo: Jan 10000, Feb 9900, Mar 9800
    const view = buildCreditMonthlyView([credit()], [], range);
    expect(view.map((m) => m.debt)).toEqual([10000, 9900, 9800]);
  });

  it("attributes extra payments to their month and reduces debt from then on", () => {
    const payments = [{ creditRecordId: 1, date: month(2026, 1), amount: 1000 }]; // Feb
    const view = buildCreditMonthlyView([credit()], payments, range);
    expect(view[1].extraPayments).toBe(1000);
    expect(view[0].extraPayments).toBe(0);
    // debt is start-of-month: Jan 10000; Feb (after Jan event) 9900;
    // the Feb extra applies during Feb, so it shows in Mar: 9900-100-1000=8800
    expect(view.map((m) => m.debt)).toEqual([10000, 9900, 8800]);
  });

  it("isolates a payment to its own credit", () => {
    const credits = [credit(), credit({ id: 2 })];
    const payments = [{ creditRecordId: 2, date: month(2026, 1), amount: 5000 }];
    const view = buildCreditMonthlyView(credits, payments, range);
    // Mar (start-of-month): credit 1 = 9800; credit 2 = 9900-100-5000 = 4800 -> 14600
    expect(view[2].debt).toBe(14600);
  });
});
