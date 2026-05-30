# Expense Flow — Month-aware Plan Results & Flow View

**Date:** 2026-05-30
**Status:** Approved design

## Context

The plan page summary (`getPlanReport`) aggregates only BUDGET, INCOME, and CREDIT
sheets and produces a single plan-wide balance (`total = income − budget − creditPayment`).
EXPENSE_FLOW records — the only record type carrying a `date` — are excluded from the
balance entirely, and there is no per-month view anywhere in the app despite the summary
card being labeled "Saldo a fin de mes".

This change makes the plan results **month-aware** and adds a **Flow View** that plots
the running (carryover) balance across the plan's date range.

### Decisions captured during brainstorming
- BUDGET / INCOME / CREDIT items are **recurring every month** (same value each month).
- EXPENSE_FLOW records are **one-off**, applied only to the month they are dated in.
- The selected-month card shows **two** balances:
  - **"Saldo del Mes"** — standalone month: `income − budget − creditPayment − expenseFlow(month)`.
  - **"Saldo Acumulado a fin de Mes"** — cumulative carryover through the selected month.
- The Flow View is a **line chart of the cumulative balance** per month, scoped to the
  plan's date range, carrying over each month's surplus/deficit.
- Architecture: **one server action + client-side computation** (instant month switching,
  single source of truth, carryover math in one tested util).

### Resolved defaults (previously open)
- **Flow View line:** plot the **cumulative** balance only (single line). No standalone-month overlay in v1.
- **Month selector:** reuse the existing `MonthYearPicker` as-is; clamp the selected month
  into the plan range in logic. Restricting the picker's options strictly to plan months is
  out of scope for v1.

## Data model notes (important)

- `Plan.initialDate` / `Plan.endDate` are stored as **epoch seconds** (`Int`) — see
  [newPlanForm.tsx:30-31](../../../src/app/(main)/new-plan/components/newPlanForm.tsx).
  Convert with `×1000` before using as JS timestamps.
- `Record.date` (EXPENSE_FLOW) is stored as **epoch milliseconds** (`BigInt?`). Convert
  `BigInt → Number` before bucketing.

## Architecture & data flow

```
PlanResults (server)
  ├─ getPlanFlowReport(planId)          // one round trip
  ├─ buildMonthlyFlow(report)           // pure util → flows[]
  ├─ <MonthlyResults flows range />     // client island
  │     ├─ MonthYearPicker              // selectedMonth state (default = current, clamped)
  │     ├─ MonthlySummaryCard           // derives from flows[selectedMonth]
  │     └─ FlowBalanceChart             // cumulative line over flows[]
  └─ <PlanBucketDistribution />         // unchanged
```

Switching months recomputes from the already-fetched `flows[]` — **no refetch**.

## Components & contracts

### Server action — `getPlanFlowReport(planId)`
File: [src/app/actions/reports/plan-reports.ts](../../../src/app/actions/reports/plan-reports.ts) (add alongside existing actions).

```ts
type PlanFlowReport = {
  recurring: {
    incomeTotal: number;
    budgetTotal: number;
    creditPaymentTotal: number;
    creditBalanceTotal: number;
  };
  range: { startMonth: number; endMonth: number }; // start-of-month timestamps (ms)
  expenseFlowByMonth: { month: number; total: number }[]; // month = start-of-month (ms)
};
```

- `recurring`: reuse the four Prisma `aggregate` queries already in `getPlanReport`
  (BUDGET amount, INCOME amount, CREDIT monthlyPayment+additionalPayment, CREDIT currentBalance).
- `range`: `prisma.plan.findUnique({ where: { id } })` → `initialDate`/`endDate` ×1000 → `startOfMonth`.
- `expenseFlowByMonth`: fetch EXPENSE_FLOW records (`{ date, amount }`), convert `date`
  `BigInt → Number` (ms), bucket by `startOfMonth(date).getTime()`, sum `amount`.

### Pure util — `buildMonthlyFlow(report)`
File: [src/utils/flow.ts](../../../src/utils/flow.ts) (new). All carryover logic lives here.

```ts
type MonthlyFlow = {
  month: number;            // start-of-month (ms)
  income: number;
  budget: number;
  creditPayment: number;
  expenseFlow: number;      // this month's EXPENSE_FLOW total (0 if none)
  monthBalance: number;     // income − budget − creditPayment − expenseFlow
  cumulativeBalance: number;// running sum of monthBalance up to & incl. this month
};

function buildMonthlyFlow(report: PlanFlowReport): MonthlyFlow[];
```

- Enumerate months with `eachMonthOfInterval({ start, end })` (date-fns; already a dependency).
- Recurring income/budget/creditPayment are constant each month; `expenseFlow` looked up
  from a `Map<startOfMonthMs, total>` built from `expenseFlowByMonth` (default 0).
- `cumulativeBalance[i] = cumulativeBalance[i-1] + monthBalance[i]`.
- Optional helper `findMonthFlow(flows, monthTs)` → the `MonthlyFlow` whose `month`
  matches `startOfMonth(monthTs)`.

### Client — `MonthlyResults`
File: `src/app/(main)/plan/[planId]/components/monthlyResults.tsx` (new, `"use client"`).
- Props: `flows: MonthlyFlow[]`, `range`.
- State: `selectedMonth` (ms), default `startOfMonth(now)` clamped into `[range.startMonth, range.endMonth]`.
- Renders `MonthYearPicker`, `MonthlySummaryCard` (selected `MonthlyFlow`), `FlowBalanceChart`.

### Client — `MonthlySummaryCard`
File: `src/components/custom/charts/monthly-summary-card.tsx` (new; adapted from
[plan-summary-report.tsx](../../../src/components/custom/charts/plan-summary-report.tsx)).
- Uses `DataDisplay` + `numberToCurrency`.
- Primary: **"Saldo del Mes"** = `monthBalance`. Secondary prominent: **"Saldo Acumulado a fin de Mes"** = `cumulativeBalance`.
- Breakdown lines: Ingresos, Gastos (budget), Pagos de Crédito (if >0), **Flujo de Gastos del mes** (if >0), Deuda Total (if >0).

### Client — `FlowBalanceChart`
File: `src/components/custom/charts/flow-balance-chart.tsx` (new).
- Recharts `LineChart` + shadcn `ChartContainer`/`ChartTooltip` (same pattern as
  [pie-chart.tsx](../../../src/components/custom/charts/pie-chart.tsx)).
- X axis: month label (`toLocaleString` short month + year). Y/line: `cumulativeBalance`.
- Tooltip formats with `numberToCurrency`.

### Removed / superseded
- `PlanSummaryReport` (plan-wide card) is removed from `PlanResults` and replaced by
  `MonthlyResults`. `getPlanReport` is left in place only if still referenced elsewhere;
  otherwise it may be removed. `getPlanBucketTotals` and `PlanBucketDistribution` are unchanged.

## Testing

New `src/utils/flow.test.ts` covering `buildMonthlyFlow`:
- Recurring values constant across all months.
- An EXPENSE_FLOW total lands in exactly the right month and reduces only that month's `monthBalance`.
- Cumulative carryover accumulates correctly across a **surplus** sequence and a **deficit** sequence (negative cumulative allowed).
- Single-month range → one entry.
- No EXPENSE_FLOW records → every month recurring-only; cumulative grows linearly.
- Unit conversion: plan range seconds and expense-flow ms map to the same month.

Existing 57 tests stay green; `npm run lint` and `npm run build` clean.

## Edge cases
- Current month outside plan range → `selectedMonth` clamps to `startMonth`/`endMonth`.
- EXPENSE_FLOW dated outside the plan range → excluded from the per-month view.
- Single-month plan → chart shows one point.

## Out of scope (v1)
- Standalone-month overlay line on the chart.
- Restricting `MonthYearPicker` options strictly to plan months.
- Per-month variation of income/budget/credit (they remain recurring constants).
- Monthly grouping for non–expense-flow sheet types beyond the recurring model.
