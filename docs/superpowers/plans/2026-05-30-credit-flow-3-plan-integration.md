# CREDIT_FLOW Sub-project 3 — Plan-page Integration + Credit View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plan page credit-aware — fold credit monthly payments, `otherCosts`, and CREDIT_FLOW extra payments into the monthly balance; show projected "Deuda Total" for the selected month; and add a Credit View chart (debt / extra payments / monthly payments / otherCosts per month).

**Architecture:** A pure `buildCreditMonthlyView` (reusing `projectCreditBalance`) computes per-month credit aggregates; `buildMonthlyFlow` folds them into one enriched `MonthlyFlow[]` that feeds the summary card and both charts. `getPlanFlowReport` fetches raw credit + CREDIT_FLOW data and drops the old `additionalPayment`/`currentBalance` aggregates.

**Tech Stack:** Next.js 15, Prisma, date-fns v4, Recharts (shadcn ChartContainer), Vitest.

> **Git note:** This repo commits when the user asks; subagents/coordinator do NOT commit (working tree only). Skip the commit steps unless told otherwise. No migration in this sub-project.

**Spec:** `docs/superpowers/specs/2026-05-30-credit-flow-3-plan-integration-design.md`
**Builds on:** #1 (`projectCreditBalance`), #2 (`credit-flow.ts`, CREDIT_FLOW sheet).

---

## File Structure

- **Modify** `src/utils/credit-flow.ts` (+ test) — add `CreditInput`, `CreditMonth`, `buildCreditMonthlyView`.
- **Modify** `src/utils/flow.ts` (+ test) — new `PlanFlowReport`/`MonthlyFlow`; `buildMonthlyFlow` folds credit view.
- **Modify** `src/app/actions/reports/plan-reports.ts` — fetch credits + CREDIT_FLOW payments; drop credit aggregates.
- **Modify** `src/components/custom/charts/monthly-summary-card.tsx` — new credit lines + projected Deuda Total.
- **Modify** `src/app/(main)/plan/[planId]/components/monthlyResults.tsx` — drop `creditBalanceTotal` prop.
- **Create** `src/components/custom/charts/credit-view-chart.tsx` — 4-line Credit View chart.
- **Modify** `src/app/(main)/plan/[planId]/components/planResults.tsx` — drop `creditBalanceTotal`; render Credit View.

---

## Task 1: `buildCreditMonthlyView` + types (TDD)

**Files:** Modify `src/utils/credit-flow.ts`, `src/utils/credit-flow.test.ts`

- [ ] **Step 1: Append failing tests** to `src/utils/credit-flow.test.ts`

First, **merge** `buildCreditMonthlyView` and `type CreditInput` into the file's existing `./credit-flow` import (don't add a second import line — that trips `no-duplicate-imports`). The existing import becomes:
```ts
import { buildExtraPaymentsByMonth, creditBalanceAfterPayment, buildCreditMonthlyView, type CreditInput } from "./credit-flow";
```
Then append this describe block (the `month` helper already exists in this file):

```ts
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
    // Jan 10000; Feb event 10000-100-1000=8900; Mar 8900-100=8800
    expect(view.map((m) => m.debt)).toEqual([10000, 8900, 8800]);
  });

  it("isolates a payment to its own credit", () => {
    const credits = [credit(), credit({ id: 2 })];
    const payments = [{ creditRecordId: 2, date: month(2026, 1), amount: 5000 }];
    const view = buildCreditMonthlyView(credits, payments, range);
    // credit 1 unaffected (Feb 9900), credit 2 Feb 10000-100-5000=4900 -> total 14800
    expect(view[1].debt).toBe(14800);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/utils/credit-flow.test.ts`
Expected: FAIL — `buildCreditMonthlyView` / `CreditInput` not exported.

- [ ] **Step 3: Implement** — append to `src/utils/credit-flow.ts` (and add `eachMonthOfInterval` to the date-fns import at the top, i.e. `import { addMonths, eachMonthOfInterval, startOfMonth } from "date-fns";`):

```ts
export type CreditInput = {
  id: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number; // percent
  otherCosts: number;
  balanceDateMs: number; // Fecha Saldo (ms)
};

export type CreditMonth = {
  month: number; // start-of-month ms
  monthlyPayment: number; // Σ credits' monthlyPayment (constant)
  otherCosts: number; // Σ credits' otherCosts (constant)
  extraPayments: number; // Σ flow payments dated this month
  debt: number; // Σ each credit's projected balance at this month
};

/**
 * Per-month credit aggregates across all credits in a plan: constant monthly
 * payment / otherCosts totals, that month's flow extra payments, and the total
 * projected debt (each credit rolled forward from its Fecha Saldo, applying its
 * own flow payments).
 */
export function buildCreditMonthlyView(
  credits: CreditInput[],
  flowPayments: { creditRecordId: number; date: number; amount: number }[],
  range: { startMonth: number; endMonth: number }
): CreditMonth[] {
  if (range.startMonth > range.endMonth) return [];

  const monthlyPaymentTotal = credits.reduce((s, c) => s + c.monthlyPayment, 0);
  const otherCostsTotal = credits.reduce((s, c) => s + c.otherCosts, 0);

  const extraByCredit = new Map<number, Map<number, number>>();
  for (const c of credits) extraByCredit.set(c.id, new Map());
  const extraTotalByMonth = new Map<number, number>();
  for (const p of flowPayments) {
    const key = startOfMonth(p.date).getTime();
    extraTotalByMonth.set(key, (extraTotalByMonth.get(key) ?? 0) + p.amount);
    const perCredit = extraByCredit.get(p.creditRecordId);
    if (perCredit) perCredit.set(key, (perCredit.get(key) ?? 0) + p.amount);
  }

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const debt = credits.reduce(
      (sum, c) =>
        sum +
        projectCreditBalance(
          {
            balance: c.currentBalance,
            monthlyPayment: c.monthlyPayment,
            interestRate: c.interestRate,
            balanceDateMs: c.balanceDateMs,
          },
          month,
          extraByCredit.get(c.id)
        ),
      0
    );
    return {
      month,
      monthlyPayment: monthlyPaymentTotal,
      otherCosts: otherCostsTotal,
      extraPayments: extraTotalByMonth.get(month) ?? 0,
      debt,
    };
  });
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/utils/credit-flow.test.ts`
Expected: PASS (existing + new cases).

- [ ] **Step 5: Commit** (skip unless asked)
```bash
git add src/utils/credit-flow.ts src/utils/credit-flow.test.ts && git commit -m "feat: add buildCreditMonthlyView per-month credit aggregates"
```

---

## Task 2: Refactor `flow.ts` + tests (TDD)

**Files:** Modify `src/utils/flow.ts`, `src/utils/flow.test.ts`

- [ ] **Step 1: Rewrite the `buildMonthlyFlow` portion of `src/utils/flow.test.ts`**

Replace the import line and the `baseReport` helper + the `buildMonthlyFlow` describe block (keep the `clampMonthRange` and `findMonthFlow` describe blocks intact). New import + helper + tests:

```ts
import { buildMonthlyFlow, findMonthFlow, clampMonthRange, type PlanFlowReport } from "./flow";
// (startOfMonth import stays)

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
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: FAIL — `PlanFlowReport`/`MonthlyFlow` shape mismatch; `buildMonthlyFlow` doesn't subtract credit components.

- [ ] **Step 3: Refactor `src/utils/flow.ts`**

Replace the imports, `PlanFlowReport`, `MonthlyFlow`, and `buildMonthlyFlow` (keep `findMonthFlow` and `clampMonthRange` exactly as they are):

```ts
import { eachMonthOfInterval, startOfMonth } from "date-fns";
import { buildCreditMonthlyView, type CreditInput } from "./credit-flow";

export type PlanFlowReport = {
  recurring: {
    incomeTotal: number;
    budgetTotal: number;
  };
  /** start-of-month timestamps in milliseconds */
  range: { startMonth: number; endMonth: number };
  /** month = start-of-month (ms); total = summed EXPENSE_FLOW amount */
  expenseFlowByMonth: { month: number; total: number }[];
  credits: CreditInput[];
  creditFlowPayments: { creditRecordId: number; date: number; amount: number }[];
};

export type MonthlyFlow = {
  month: number; // start-of-month (ms)
  income: number;
  budget: number;
  creditPayment: number; // recurring monthly payment total
  otherCosts: number; // recurring credit otherCosts total
  creditExtraPayment: number; // flow extra payments this month
  expenseFlow: number;
  debt: number; // projected total debt this month
  monthBalance: number; // income - budget - expenseFlow - creditPayment - otherCosts - creditExtraPayment
  cumulativeBalance: number; // running carryover up to & including this month
};

/**
 * Build a per-month flow with standalone and cumulative (carryover) balances.
 * Credit components (monthly payment, otherCosts, extra payments) and the
 * projected debt come from buildCreditMonthlyView.
 */
export function buildMonthlyFlow(report: PlanFlowReport): MonthlyFlow[] {
  const { recurring, range, expenseFlowByMonth, credits, creditFlowPayments } = report;

  if (range.startMonth > range.endMonth) return [];

  const expenseByMonth = new Map<number, number>();
  for (const { month, total } of expenseFlowByMonth) {
    const key = startOfMonth(month).getTime();
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + total);
  }

  const creditView = buildCreditMonthlyView(credits, creditFlowPayments, range);
  const creditByMonth = new Map(creditView.map((c) => [c.month, c]));

  const months = eachMonthOfInterval({ start: range.startMonth, end: range.endMonth });

  let cumulative = 0;
  return months.map((date) => {
    const month = startOfMonth(date).getTime();
    const expenseFlow = expenseByMonth.get(month) ?? 0;
    const cv = creditByMonth.get(month);
    const creditPayment = cv?.monthlyPayment ?? 0;
    const otherCosts = cv?.otherCosts ?? 0;
    const creditExtraPayment = cv?.extraPayments ?? 0;
    const debt = cv?.debt ?? 0;
    const monthBalance =
      recurring.incomeTotal - recurring.budgetTotal - expenseFlow - creditPayment - otherCosts - creditExtraPayment;
    cumulative += monthBalance;
    return {
      month,
      income: recurring.incomeTotal,
      budget: recurring.budgetTotal,
      creditPayment,
      otherCosts,
      creditExtraPayment,
      expenseFlow,
      debt,
      monthBalance,
      cumulativeBalance: cumulative,
    };
  });
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: PASS (buildMonthlyFlow + clampMonthRange + findMonthFlow).

- [ ] **Step 5: Commit** (skip unless asked)
```bash
git add src/utils/flow.ts src/utils/flow.test.ts && git commit -m "feat: fold credit monthly view into buildMonthlyFlow"
```

---

## Task 3: `getPlanFlowReport` refactor

**Files:** Modify `src/app/actions/reports/plan-reports.ts`

- [ ] **Step 1: Replace credit aggregation with raw fetches**

Replace the `Promise.all([...])` block and the `recurring` object (lines ~28-58) with:

```ts
  const [budgetRes, incomeRes, expenseFlowRecords, creditRecords, creditFlowRecords] =
    await Promise.all([
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "BUDGET" } },
      }),
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "INCOME" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "EXPENSE_FLOW" }, date: { not: null } },
        select: { date: true, amount: true },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "CREDIT_FLOW" }, date: { not: null }, creditRecordId: { not: null } },
        select: { creditRecordId: true, date: true, amount: true },
      }),
    ]);

  const recurring = {
    incomeTotal: incomeRes._sum?.amount ?? 0,
    budgetTotal: budgetRes._sum?.amount ?? 0,
  };

  const currentMonthMs = startOfMonth(Date.now()).getTime();
  const credits = creditRecords.map((c) => ({
    id: c.id,
    currentBalance: c.currentBalance ?? 0,
    monthlyPayment: c.monthlyPayment ?? 0,
    interestRate: c.interestRate ?? 0,
    otherCosts: c.otherCosts ?? 0,
    balanceDateMs: c.date != null ? Number(c.date) : currentMonthMs,
  }));

  const creditFlowPayments = creditFlowRecords
    .filter((r) => r.creditRecordId != null && r.date != null)
    .map((r) => ({ creditRecordId: r.creditRecordId as number, date: Number(r.date), amount: r.amount }));
```

- [ ] **Step 2: Update the return**

Change the final `return { recurring, range, expenseFlowByMonth };` to:
```ts
  return { recurring, range, expenseFlowByMonth, credits, creditFlowPayments };
```

(The `range` and `expenseFlowByMonth` blocks between are unchanged.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in consumers still using the old shape (`monthlyResults.tsx`/`planResults.tsx`/`monthly-summary-card.tsx`) — fixed in Tasks 4-7. No error in this file.

- [ ] **Step 4: Commit** (skip unless asked)
```bash
git add src/app/actions/reports/plan-reports.ts && git commit -m "feat: getPlanFlowReport returns raw credit + flow data"
```

---

## Task 4: `MonthlySummaryCard` — credit lines + projected Deuda Total

**Files:** Modify `src/components/custom/charts/monthly-summary-card.tsx`

- [ ] **Step 1: Replace the component**

Overwrite `src/components/custom/charts/monthly-summary-card.tsx`:
```tsx
"use client";

import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";

type MonthlySummaryCardProps = {
  flow: MonthlyFlow;
};

export default function MonthlySummaryCard({ flow }: MonthlySummaryCardProps) {
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
        {flow.otherCosts > 0 && (
          <div className="leading-none text-muted-foreground">
            Otros Gastos de Crédito de {numberToCurrency(flow.otherCosts)}
          </div>
        )}
        {flow.creditExtraPayment > 0 && (
          <div className="leading-none text-muted-foreground">
            Pagos Extra de Crédito de {numberToCurrency(flow.creditExtraPayment)}
          </div>
        )}
        {flow.expenseFlow > 0 && (
          <div className="leading-none text-muted-foreground">
            Flujo de Gastos del mes de {numberToCurrency(flow.expenseFlow)}
          </div>
        )}
        {flow.debt > 0 && (
          <div className="leading-none text-muted-foreground">
            Deuda Total: {numberToCurrency(flow.debt)}
          </div>
        )}
      </div>
    </DataDisplay>
  );
}
```

- [ ] **Step 2: Commit** (skip unless asked)
```bash
git add src/components/custom/charts/monthly-summary-card.tsx && git commit -m "feat: month summary shows credit lines and projected debt"
```

---

## Task 5: `MonthlyResults` — drop `creditBalanceTotal`

**Files:** Modify `src/app/(main)/plan/[planId]/components/monthlyResults.tsx`

- [ ] **Step 1: Remove the prop and pass-through**

In `src/app/(main)/plan/[planId]/components/monthlyResults.tsx`:
- Remove `creditBalanceTotal: number;` from `MonthlyResultsProps`.
- Remove `creditBalanceTotal` from the destructured params.
- Change the card usage from `<MonthlySummaryCard flow={flow} creditBalanceTotal={creditBalanceTotal} />` to `<MonthlySummaryCard flow={flow} />`.

- [ ] **Step 2: Type-check** — `npx tsc --noEmit` (this file clean; `planResults.tsx` still errors until Task 7).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add "src/app/(main)/plan/[planId]/components/monthlyResults.tsx" && git commit -m "refactor: MonthlyResults drops creditBalanceTotal"
```

---

## Task 6: `CreditViewChart` component

**Files:** Create `src/components/custom/charts/credit-view-chart.tsx`

- [ ] **Step 1: Create the chart**

Create `src/components/custom/charts/credit-view-chart.tsx`:
```tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  debt: { label: "Deuda", color: "#e60049" },
  creditExtraPayment: { label: "Pagos Extra", color: "#0bb4ff" },
  creditPayment: { label: "Pago Mensual", color: "#50e991" },
  otherCosts: { label: "Otros Gastos", color: "#ffa300" },
} satisfies ChartConfig;

const formatMonth = (ts: number) =>
  new Date(ts).toLocaleString("default", { month: "short", year: "2-digit" });

type CreditViewChartProps = {
  flows: MonthlyFlow[];
};

export default function CreditViewChart({ flows }: CreditViewChartProps) {
  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit View</CardTitle>
          <CardDescription>Deuda y pagos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay meses para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  const data = flows.map((f) => ({
    month: formatMonth(f.month),
    debt: f.debt,
    creditExtraPayment: f.creditExtraPayment,
    creditPayment: f.creditPayment,
    otherCosts: f.otherCosts,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit View</CardTitle>
        <CardDescription>Deuda y pagos por mes</CardDescription>
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
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="debt" type="monotone" stroke="var(--color-debt)" strokeWidth={2} dot={false} />
            <Line dataKey="creditExtraPayment" type="monotone" stroke="var(--color-creditExtraPayment)" strokeWidth={2} dot={false} />
            <Line dataKey="creditPayment" type="monotone" stroke="var(--color-creditPayment)" strokeWidth={2} dot={false} />
            <Line dataKey="otherCosts" type="monotone" stroke="var(--color-otherCosts)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check** — `npx tsc --noEmit` (this file clean; verify `ChartLegend`/`ChartLegendContent` are exported from `@/components/ui/chart` — they are, used by `pie-chart.tsx`).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add src/components/custom/charts/credit-view-chart.tsx && git commit -m "feat: add Credit View chart"
```

---

## Task 7: Wire Credit View into `PlanResults`

**Files:** Modify `src/app/(main)/plan/[planId]/components/planResults.tsx`

- [ ] **Step 1: Drop `creditBalanceTotal`, render Credit View**

In `src/app/(main)/plan/[planId]/components/planResults.tsx`:
- Add the import: `import CreditViewChart from "@/components/custom/charts/credit-view-chart";`
- Change `<MonthlyResults flows={flows} range={report.range} creditBalanceTotal={report.recurring.creditBalanceTotal} />` to `<MonthlyResults flows={flows} range={report.range} />`.
- After the existing `<div className="mt-4"><FlowBalanceChart flows={flows} /></div>`, add:
```tsx
            <div className="mt-4">
                <CreditViewChart flows={flows} />
            </div>
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — compiled successfully.

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add "src/app/(main)/plan/[planId]/components/planResults.tsx" && git commit -m "feat: render Credit View on the plan page"
```

---

## Task 8: Full verification

**Files:** none

- [ ] **Step 1: Tests** — `npm run test:run` → all pass (new `buildCreditMonthlyView` + rewritten `buildMonthlyFlow` + prior suite).
- [ ] **Step 2: Lint** — `npm run lint` → 0 errors (pre-existing warnings OK).
- [ ] **Step 3: Build** — `npm run build` → compiled successfully.
- [ ] **Step 4: Manual smoke test** — `npm run dev` on a plan with a CREDIT sheet (a credit with monthly payment + otherCosts) and a CREDIT_FLOW payment this month:
  1. The month summary's "Saldo del Mes" drops by `creditPayment + otherCosts + thisMonth'sExtraPayments`; "Pagos de Crédito", "Otros Gastos de Crédito", "Pagos Extra de Crédito" lines appear.
  2. "Deuda Total" equals the projected debt for the selected month and decreases as you select later months.
  3. The Credit View chart shows four lines (debt declining, flat monthly payment, flat otherCosts, extra payments spiking in their month).
- [ ] **Step 5: Final commit** (skip unless asked)
```bash
git add -A && git commit -m "test: verify plan credit integration end-to-end"
```

---

## Notes for the implementer

- **One source of truth:** `MonthlyFlow[]` carries everything; the summary card reads the selected month, both charts map the array. No parallel credit array in components.
- **Circular-import guard:** `CreditInput`/`CreditMonth`/`buildCreditMonthlyView` live in `credit-flow.ts`; `flow.ts` imports them. Never import `flow.ts` from `credit-flow.ts`.
- **`additionalPayment` is fully retired** from the plan rollup here — credit cash flow now comes from `monthlyPayment` + `otherCosts` + CREDIT_FLOW `amount`.
- **`balanceDateMs` fallback** to the current month for legacy null-date credits happens in `getPlanFlowReport` (server), keeping the utils pure.
- No migration (existing columns only).
```
