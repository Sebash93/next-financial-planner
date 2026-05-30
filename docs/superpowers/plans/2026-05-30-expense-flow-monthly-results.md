# Expense Flow — Month-aware Plan Results & Flow View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plan-page results month-aware (a month selector driving a per-month summary with standalone + cumulative balances) and add a Flow View line chart of the carryover balance across the plan's date range.

**Architecture:** One server action (`getPlanFlowReport`) fetches month-invariant recurring totals + expense-flow-by-month + the plan range in a single round trip. A pure util (`buildMonthlyFlow`) computes per-month and cumulative balances. A small client island owns the selected-month state; the chart is range-wide and independent of selection.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), date-fns v4, Recharts via shadcn `ChartContainer`, Vitest + React Testing Library.

> **Git note:** This repo commits when the user asks. Commit steps below are grouped logically — confirm with the user (and branch off `main` first) before committing, or batch the commits at the end.

**Spec:** `docs/superpowers/specs/2026-05-30-expense-flow-monthly-results-design.md`

---

## File Structure

- **Create** `src/utils/flow.ts` — types (`PlanFlowReport`, `MonthlyFlow`) + pure logic (`buildMonthlyFlow`, `findMonthFlow`).
- **Create** `src/utils/flow.test.ts` — unit tests for the pure logic.
- **Modify** `src/app/actions/reports/plan-reports.ts` — add `getPlanFlowReport`; remove the now-superseded `getPlanReport` + `PlanReport` type.
- **Create** `src/components/custom/charts/flow-balance-chart.tsx` — Recharts line chart of cumulative balance.
- **Create** `src/components/custom/charts/monthly-summary-card.tsx` — selected-month summary card.
- **Create** `src/app/(main)/plan/[planId]/components/monthlyResults.tsx` — client island: month selector + summary card.
- **Modify** `src/app/(main)/plan/[planId]/components/planResults.tsx` — server-fetch + compute, render island + chart + bucket distribution.
- **Delete** `src/components/custom/charts/plan-summary-report.tsx` — superseded.

---

## Task 1: Pure util `buildMonthlyFlow` (TDD)

**Files:**
- Create: `src/utils/flow.ts`
- Test: `src/utils/flow.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/flow.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildMonthlyFlow, findMonthFlow, type PlanFlowReport } from "./flow";

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: FAIL — `Failed to resolve import "./flow"` / `buildMonthlyFlow is not a function`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/flow.ts`:

```ts
import { eachMonthOfInterval, startOfMonth } from "date-fns";

export type PlanFlowReport = {
  recurring: {
    incomeTotal: number;
    budgetTotal: number;
    creditPaymentTotal: number;
    creditBalanceTotal: number;
  };
  /** start-of-month timestamps in milliseconds */
  range: { startMonth: number; endMonth: number };
  /** month = start-of-month (ms); total = summed EXPENSE_FLOW amount */
  expenseFlowByMonth: { month: number; total: number }[];
};

export type MonthlyFlow = {
  month: number; // start-of-month (ms)
  income: number;
  budget: number;
  creditPayment: number;
  expenseFlow: number;
  monthBalance: number; // income - budget - creditPayment - expenseFlow
  cumulativeBalance: number; // running carryover up to & including this month
};

/**
 * Build a per-month flow with standalone and cumulative (carryover) balances.
 * Recurring totals repeat every month; only expenseFlow varies by month.
 */
export function buildMonthlyFlow(report: PlanFlowReport): MonthlyFlow[] {
  const { recurring, range, expenseFlowByMonth } = report;

  const expenseByMonth = new Map<number, number>();
  for (const { month, total } of expenseFlowByMonth) {
    const key = startOfMonth(month).getTime();
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + total);
  }

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });

  let cumulative = 0;
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const expenseFlow = expenseByMonth.get(month) ?? 0;
    const monthBalance =
      recurring.incomeTotal - recurring.budgetTotal - recurring.creditPaymentTotal - expenseFlow;
    cumulative += monthBalance;
    return {
      month,
      income: recurring.incomeTotal,
      budget: recurring.budgetTotal,
      creditPayment: recurring.creditPaymentTotal,
      expenseFlow,
      monthBalance,
      cumulativeBalance: cumulative,
    };
  });
}

/** Find the flow entry matching a timestamp's month (start-of-month). */
export function findMonthFlow(flows: MonthlyFlow[], monthTs: number): MonthlyFlow | undefined {
  const target = startOfMonth(monthTs).getTime();
  return flows.find((f) => f.month === target);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: PASS — all `buildMonthlyFlow` and `findMonthFlow` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/flow.ts src/utils/flow.test.ts
git commit -m "feat: add buildMonthlyFlow util for month-aware plan flow"
```

---

## Task 2: Server action `getPlanFlowReport`

**Files:**
- Modify: `src/app/actions/reports/plan-reports.ts`

- [ ] **Step 1: Add the action and remove the superseded one**

In `src/app/actions/reports/plan-reports.ts`:

1. Replace the top imports/type with:

```ts
"use server";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";
import type { PlanFlowReport } from "@/utils/flow";
```

(Delete the old `type PlanReport = {...}` block.)

2. Delete the entire `getPlanReport` function (it is replaced by `getPlanFlowReport`).

3. Add this function (keep `getPlanBucketTotals` untouched below it):

```ts
/**
 * Server action: month-aware report for a plan.
 * Returns month-invariant recurring totals, the plan's month range, and
 * EXPENSE_FLOW totals bucketed by month. Pure per-month math lives in
 * buildMonthlyFlow (src/utils/flow.ts).
 */
export async function getPlanFlowReport(planId: string): Promise<PlanFlowReport> {
  const id = parseInt(planId, 10);
  if (isNaN(id)) {
    throw new Error(`Invalid planId: ${planId}`);
  }

  const plan = await prisma.plan.findUnique({
    where: { id },
    select: { initialDate: true, endDate: true },
  });
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const [budgetRes, incomeRes, creditPaymentRes, creditBalanceRes, expenseFlowRecords] =
    await Promise.all([
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "BUDGET" } },
      }),
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "INCOME" } },
      }),
      prisma.record.aggregate({
        _sum: { monthlyPayment: true, additionalPayment: true },
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.aggregate({
        _sum: { currentBalance: true },
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "EXPENSE_FLOW" }, date: { not: null } },
        select: { date: true, amount: true },
      }),
    ]);

  const recurring = {
    incomeTotal: incomeRes._sum?.amount ?? 0,
    budgetTotal: budgetRes._sum?.amount ?? 0,
    creditPaymentTotal:
      (creditPaymentRes._sum?.monthlyPayment ?? 0) + (creditPaymentRes._sum?.additionalPayment ?? 0),
    creditBalanceTotal: creditBalanceRes._sum?.currentBalance ?? 0,
  };

  // Plan dates are stored as epoch SECONDS; convert to ms before use.
  const range = {
    startMonth: startOfMonth(plan.initialDate * 1000).getTime(),
    endMonth: startOfMonth(plan.endDate * 1000).getTime(),
  };

  // EXPENSE_FLOW date is epoch MILLISECONDS (BigInt). Bucket by start-of-month.
  const byMonth = new Map<number, number>();
  for (const rec of expenseFlowRecords) {
    if (rec.date == null) continue;
    const key = startOfMonth(Number(rec.date)).getTime();
    byMonth.set(key, (byMonth.get(key) ?? 0) + rec.amount);
  }
  const expenseFlowByMonth = Array.from(byMonth, ([month, total]) => ({ month, total }));

  return { recurring, range, expenseFlowByMonth };
}
```

- [ ] **Step 2: Verify no stale references to the removed `getPlanReport`**

Run: `grep -rn "getPlanReport" src/`
Expected: only matches are inside `plan-summary-report.tsx` (deleted in Task 6). If any other file references it, note it — it must be migrated to `getPlanFlowReport` + `buildMonthlyFlow`.

- [ ] **Step 3: Type-check the action**

Run: `npx tsc --noEmit`
Expected: PASS (or only pre-existing unrelated errors). The new action and `PlanFlowReport` import resolve.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/reports/plan-reports.ts
git commit -m "feat: add getPlanFlowReport server action"
```

---

## Task 3: `FlowBalanceChart` component

**Files:**
- Create: `src/components/custom/charts/flow-balance-chart.tsx`

- [ ] **Step 1: Create the chart component**

Create `src/components/custom/charts/flow-balance-chart.tsx`:

```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  cumulativeBalance: { label: "Saldo Acumulado", color: "#0bb4ff" },
} satisfies ChartConfig;

const formatMonth = (ts: number) =>
  new Date(ts).toLocaleString("default", { month: "short", year: "2-digit" });

type FlowBalanceChartProps = {
  flows: MonthlyFlow[];
};

export default function FlowBalanceChart({ flows }: FlowBalanceChartProps) {
  const data = flows.map((f) => ({
    month: formatMonth(f.month),
    cumulativeBalance: f.cumulativeBalance,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flow View</CardTitle>
        <CardDescription>Saldo acumulado por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[300px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="capitalize" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={80}
              tickFormatter={(v) => numberToCurrency(v as number)}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => numberToCurrency(value as number)}
            />
            <Line
              dataKey="cumulativeBalance"
              type="monotone"
              stroke="var(--color-cumulativeBalance)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. (Recharts `XAxis`/`YAxis`/`Line` and shadcn `ChartContainer` resolve; `MonthlyFlow` import resolves.)

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/charts/flow-balance-chart.tsx
git commit -m "feat: add FlowBalanceChart cumulative-balance line chart"
```

---

## Task 4: `MonthlySummaryCard` component

**Files:**
- Create: `src/components/custom/charts/monthly-summary-card.tsx`

- [ ] **Step 1: Create the summary card**

Create `src/components/custom/charts/monthly-summary-card.tsx`:

```tsx
"use client";

import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";

type MonthlySummaryCardProps = {
  flow: MonthlyFlow;
  creditBalanceTotal: number;
};

export default function MonthlySummaryCard({ flow, creditBalanceTotal }: MonthlySummaryCardProps) {
  return (
    <DataDisplay
      title="Saldo del Mes"
      description="Balance del mes seleccionado"
      value={numberToCurrency(flow.monthBalance)}
    >
      <div className="flex w-full flex-col items-start gap-2 text-sm">
        <div className="font-medium leading-none">
          Saldo Acumulado a fin de Mes: {numberToCurrency(flow.cumulativeBalance)}
        </div>
        <div className="leading-none text-muted-foreground">
          Ingresos de {numberToCurrency(flow.income)}
        </div>
        <div className="leading-none text-muted-foreground">
          Gastos de {numberToCurrency(flow.budget)}
        </div>
        {flow.creditPayment > 0 && (
          <div className="leading-none text-muted-foreground">
            Pagos de Crédito de {numberToCurrency(flow.creditPayment)}
          </div>
        )}
        {flow.expenseFlow > 0 && (
          <div className="leading-none text-muted-foreground">
            Flujo de Gastos del mes de {numberToCurrency(flow.expenseFlow)}
          </div>
        )}
        {creditBalanceTotal > 0 && (
          <div className="leading-none text-muted-foreground">
            Deuda Total: {numberToCurrency(creditBalanceTotal)}
          </div>
        )}
      </div>
    </DataDisplay>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/charts/monthly-summary-card.tsx
git commit -m "feat: add MonthlySummaryCard with standalone + cumulative balances"
```

---

## Task 5: `MonthlyResults` client island (selector + summary)

**Files:**
- Create: `src/app/(main)/plan/[planId]/components/monthlyResults.tsx`

- [ ] **Step 1: Create the client island**

Create `src/app/(main)/plan/[planId]/components/monthlyResults.tsx`:

```tsx
"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import MonthYearPicker from "@/components/custom/month-year-picker";
import MonthlySummaryCard from "@/components/custom/charts/monthly-summary-card";
import { findMonthFlow, type MonthlyFlow } from "@/utils/flow";

type MonthlyResultsProps = {
  flows: MonthlyFlow[];
  range: { startMonth: number; endMonth: number };
  creditBalanceTotal: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function MonthlyResults({ flows, range, creditBalanceTotal }: MonthlyResultsProps) {
  const initial = clamp(startOfMonth(new Date()).getTime(), range.startMonth, range.endMonth);
  const [selectedMonth, setSelectedMonth] = useState(initial);

  // Always resolve to a real flow entry; fall back to the first month.
  const flow = findMonthFlow(flows, selectedMonth) ?? flows[0];

  return (
    <div className="flex flex-col gap-4">
      <MonthYearPicker
        value={selectedMonth}
        onChange={(value) => setSelectedMonth(startOfMonth(value).getTime())}
      />
      {flow && <MonthlySummaryCard flow={flow} creditBalanceTotal={creditBalanceTotal} />}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. `MonthYearPicker` default export and `findMonthFlow` resolve.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/plan/[planId]/components/monthlyResults.tsx"
git commit -m "feat: add MonthlyResults client island with month selector"
```

---

## Task 6: Wire into `PlanResults` and remove superseded summary

**Files:**
- Modify: `src/app/(main)/plan/[planId]/components/planResults.tsx`
- Delete: `src/components/custom/charts/plan-summary-report.tsx`

- [ ] **Step 1: Replace `planResults.tsx`**

Overwrite `src/app/(main)/plan/[planId]/components/planResults.tsx` with:

```tsx
import { getPlanFlowReport } from "@/app/actions/reports/plan-reports";
import { PlanBucketDistribution } from "@/components/custom/charts/plan-bucket-distribution";
import FlowBalanceChart from "@/components/custom/charts/flow-balance-chart";
import MonthlyResults from "./monthlyResults";
import { buildMonthlyFlow } from "@/utils/flow";

type PlanResultsProps = {
    planId: string;
}

export const PlanResults = async ({ planId }: PlanResultsProps) => {
    const report = await getPlanFlowReport(planId);
    const flows = buildMonthlyFlow(report);
    return (
        <div className="border-t pt-4 mt-8">
            <h2 className="text-lg font-semibold pb-4">Resultados</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <MonthlyResults
                    flows={flows}
                    range={report.range}
                    creditBalanceTotal={report.recurring.creditBalanceTotal}
                />
                <PlanBucketDistribution planId={planId} />
            </div>
            <div className="mt-4">
                <FlowBalanceChart flows={flows} />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Delete the superseded plan-wide summary**

Run: `rm src/components/custom/charts/plan-summary-report.tsx`

- [ ] **Step 3: Confirm nothing else imports the deleted file, and clean a stale comment**

Run: `grep -rn "plan-summary-report\|PlanSummaryReport" src/`
Expected: the only remaining match is a commented-out line in `src/app/(main)/tools/page.tsx:7` (dead JSX, no import — harmless). Remove that stale comment line so the reference is fully gone:

In `src/app/(main)/tools/page.tsx`, delete the line:

```tsx
                {/* <PlanSummaryReport planId={planId} /> */}
```

Re-run `grep -rn "PlanSummaryReport" src/` → expected: no matches.

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — compiled successfully, `/plan/[planId]` route builds. (`PlanResults` is now async; it's rendered inside the page's `ReactQueryProvider`, which is valid for a server child of a client component.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/plan/[planId]/components/planResults.tsx"
git commit -m "feat: wire month-aware results and Flow View into plan page"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: all tests pass (the prior 57 + the new `flow.test.ts` cases).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing warnings in `creditSheetGrid.tsx` and `sheet-grid.tsx` are acceptable).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiled successfully.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open a plan with INCOME/BUDGET/CREDIT records and an EXPENSE_FLOW sheet with records in different months. Verify:
1. The month selector defaults to the current month (clamped into the plan range).
2. "Saldo del Mes" changes when the EXPENSE_FLOW for that month differs; "Saldo Acumulado a fin de Mes" reflects carryover up to the selected month.
3. The "Flujo de Gastos del mes" line appears only in months with expense-flow records.
4. The Flow View line chart shows one point per month across the plan's date range, trending by carryover.

- [ ] **Step 5: Final commit (if any uncommitted verification fixes)**

```bash
git add -A
git commit -m "test: verify month-aware plan results end-to-end"
```

---

## Notes for the implementer

- **Unit mismatch is intentional and critical:** plan `initialDate`/`endDate` are epoch **seconds** (multiply by 1000); EXPENSE_FLOW `date` is epoch **milliseconds** (`BigInt`, convert with `Number(...)`). Both are normalized via `startOfMonth(...).getTime()` so month keys line up.
- **The chart is independent of the selector** — it always shows the whole range, so it lives directly in `PlanResults`, not inside the `MonthlyResults` client island. Only the summary card depends on the selected month.
- **`MonthYearPicker`** is reused as-is (`value: number` timestamp, `onChange: (number) => void`); its options are not restricted to the plan range in v1 (selection is clamped in logic; out-of-range selections fall back to `flows[0]`).
