import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildMonthlyFlow, findMonthFlow, clampMonthRange, type PlanFlowReport } from "./flow";

const month = (year: number, m: number) => startOfMonth(new Date(year, m, 1)).getTime();

const baseReport = (overrides: Partial<PlanFlowReport> = {}): PlanFlowReport => ({
  recurring: { incomeTotal: 1000, budgetTotal: 400, creditPaymentTotal: 100, creditBalanceTotal: 5000 },
  range: { startMonth: month(2026, 0), endMonth: month(2026, 2) }, // Jan..Mar 2026
  expenseFlowByMonth: [],
  ...overrides,
});

describe("buildMonthlyFlow", () => {
  it("produces one entry per month in the range, inclusive", () => {
    const flows = buildMonthlyFlow(baseReport());
    expect(flows.map((f) => f.month)).toEqual([month(2026, 0), month(2026, 1), month(2026, 2)]);
  });

  it("keeps recurring values constant across months", () => {
    const flows = buildMonthlyFlow(baseReport());
    for (const f of flows) {
      expect(f.income).toBe(1000);
      expect(f.budget).toBe(400);
      expect(f.creditPayment).toBe(100);
    }
  });

  it("applies an expense-flow total only to its own month's standalone balance", () => {
    const flows = buildMonthlyFlow(
      baseReport({ expenseFlowByMonth: [{ month: month(2026, 1), total: 250 }] })
    );
    // Jan: 1000-400-100-0 = 500
    expect(flows[0].monthBalance).toBe(500);
    // Feb: 1000-400-100-250 = 250
    expect(flows[1].expenseFlow).toBe(250);
    expect(flows[1].monthBalance).toBe(250);
    // Mar back to 500
    expect(flows[2].monthBalance).toBe(500);
  });

  it("accumulates a surplus carryover across months", () => {
    const flows = buildMonthlyFlow(baseReport()); // +500 each month
    expect(flows[0].cumulativeBalance).toBe(500);
    expect(flows[1].cumulativeBalance).toBe(1000);
    expect(flows[2].cumulativeBalance).toBe(1500);
  });

  it("accumulates a deficit carryover (negative allowed)", () => {
    const flows = buildMonthlyFlow(
      baseReport({ recurring: { incomeTotal: 100, budgetTotal: 400, creditPaymentTotal: 0, creditBalanceTotal: 0 } })
    ); // -300 each month
    expect(flows[0].cumulativeBalance).toBe(-300);
    expect(flows[1].cumulativeBalance).toBe(-600);
    expect(flows[2].cumulativeBalance).toBe(-900);
  });

  it("handles a single-month range", () => {
    const flows = buildMonthlyFlow(baseReport({ range: { startMonth: month(2026, 5), endMonth: month(2026, 5) } }));
    expect(flows).toHaveLength(1);
    expect(flows[0].cumulativeBalance).toBe(500);
  });

  it("buckets an expense-flow timestamp anywhere in the month to that month", () => {
    // mid-month millisecond timestamp should still match the month key
    const midMonth = new Date(2026, 1, 17, 13, 45).getTime();
    const flows = buildMonthlyFlow(baseReport({ expenseFlowByMonth: [{ month: midMonth, total: 99 }] }));
    expect(flows[1].expenseFlow).toBe(99);
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

describe("buildMonthlyFlow empty window", () => {
  it("returns [] when the start month is after the end month", () => {
    const report: PlanFlowReport = {
      recurring: { incomeTotal: 1000, budgetTotal: 0, creditPaymentTotal: 0, creditBalanceTotal: 0 },
      range: { startMonth: month(2027, 0), endMonth: month(2026, 0) },
      expenseFlowByMonth: [],
    };
    expect(buildMonthlyFlow(report)).toEqual([]);
  });
});
