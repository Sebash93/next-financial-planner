import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildMonthlyFlow, findMonthFlow, clampMonthRange, type PlanFlowReport } from "./flow";

const month = (year: number, m: number) => startOfMonth(new Date(year, m, 1)).getTime();

const baseReport = (overrides: Partial<PlanFlowReport> = {}): PlanFlowReport => ({
  recurring: { incomeTotal: 1000, budgetTotal: 400 },
  range: { startMonth: month(2026, 0), endMonth: month(2026, 2) }, // Jan..Mar 2026
  expenseFlowByMonth: [],
  credits: [],
  creditFlowPayments: [],
  ...overrides,
});

describe("buildMonthlyFlow", () => {
  it("produces one entry per month in the range, inclusive", () => {
    const flows = buildMonthlyFlow(baseReport());
    expect(flows.map((f) => f.month)).toEqual([month(2026, 0), month(2026, 1), month(2026, 2)]);
  });

  it("returns [] when the start month is after the end month", () => {
    const flows = buildMonthlyFlow(baseReport({ range: { startMonth: month(2027, 0), endMonth: month(2026, 0) } }));
    expect(flows).toEqual([]);
  });

  it("computes monthBalance from income, budget and expense flow when no credits", () => {
    const flows = buildMonthlyFlow(baseReport({ expenseFlowByMonth: [{ month: month(2026, 1), total: 250 }] }));
    expect(flows[0].monthBalance).toBe(600); // 1000 - 400
    expect(flows[1].monthBalance).toBe(350); // 1000 - 400 - 250
  });

  it("subtracts credit monthly payment, otherCosts and extra payments", () => {
    const flows = buildMonthlyFlow(baseReport({
      credits: [{ id: 1, currentBalance: 10000, monthlyPayment: 100, interestRate: 0, otherCosts: 50, balanceDateMs: month(2026, 0) }],
      creditFlowPayments: [{ creditRecordId: 1, date: month(2026, 1), amount: 300 }],
    }));
    // Jan: 1000 - 400 - 0 - 100 - 50 - 0 = 450
    expect(flows[0].monthBalance).toBe(450);
    expect(flows[0].creditPayment).toBe(100);
    expect(flows[0].otherCosts).toBe(50);
    // Feb: 1000 - 400 - 0 - 100 - 50 - 300 = 150
    expect(flows[1].creditExtraPayment).toBe(300);
    expect(flows[1].monthBalance).toBe(150);
  });

  it("reports projected debt per month and accumulates the balance", () => {
    const flows = buildMonthlyFlow(baseReport({
      credits: [{ id: 1, currentBalance: 10000, monthlyPayment: 100, interestRate: 0, otherCosts: 0, balanceDateMs: month(2026, 0) }],
    }));
    expect(flows.map((f) => f.debt)).toEqual([10000, 9900, 9800]);
    // monthBalance each month = 1000 - 400 - 100 = 500 -> cumulative 500, 1000, 1500
    expect(flows.map((f) => f.cumulativeBalance)).toEqual([500, 1000, 1500]);
  });
});

describe("findMonthFlow", () => {
  it("matches by start-of-month regardless of intra-month timestamp", () => {
    const flows = buildMonthlyFlow(baseReport());
    const found = findMonthFlow(flows, new Date(2026, 1, 20).getTime());
    expect(found?.month).toBe(month(2026, 1));
  });

  it("returns undefined when the month is outside the range", () => {
    const flows = buildMonthlyFlow(baseReport());
    expect(findMonthFlow(flows, month(2027, 0))).toBeUndefined();
  });
});

describe("clampMonthRange", () => {
  it("clamps the start up to the current month when the plan started earlier", () => {
    const planStart = new Date(2020, 0, 15).getTime();
    const now = new Date(2026, 4, 10).getTime();
    const planEnd = new Date(2026, 11, 1).getTime();
    const r = clampMonthRange(planStart, now, planEnd);
    expect(r.startMonth).toBe(startOfMonth(now).getTime());
    expect(r.endMonth).toBe(startOfMonth(planEnd).getTime());
  });

  it("keeps the plan start when it is in the future", () => {
    const planStart = new Date(2027, 2, 1).getTime();
    const now = new Date(2026, 4, 10).getTime();
    const planEnd = new Date(2027, 11, 1).getTime();
    const r = clampMonthRange(planStart, now, planEnd);
    expect(r.startMonth).toBe(startOfMonth(planStart).getTime());
  });

  it("normalizes all bounds to start-of-month", () => {
    const r = clampMonthRange(
      new Date(2026, 5, 17, 9).getTime(),
      new Date(2026, 4, 17, 9).getTime(),
      new Date(2026, 8, 20, 9).getTime()
    );
    expect(r.startMonth).toBe(startOfMonth(new Date(2026, 5, 1)).getTime());
    expect(r.endMonth).toBe(startOfMonth(new Date(2026, 8, 1)).getTime());
  });
});

