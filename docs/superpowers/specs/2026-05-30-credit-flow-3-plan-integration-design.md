# CREDIT_FLOW — Sub-project 3: Plan-page Integration + Credit View

**Date:** 2026-05-30
**Status:** Approved design
**Part of:** CREDIT_FLOW feature (#3 of 3, final). Builds on #1 (`projectCreditBalance`, Fecha Saldo, `otherCosts`) and #2 (CREDIT_FLOW sheet, `credit-flow.ts`, `creditRecordId`).

## Context

The plan page's monthly results still treat credit as a flat recurring `creditPaymentTotal` and a
static `creditBalanceTotal`, and don't see CREDIT_FLOW extra payments or `otherCosts` at all. This
sub-project makes the plan page credit-aware: extra payments and `otherCosts` flow into the monthly
balance, "Deuda Total" becomes the projected debt at the selected month, and a new **Credit View**
chart plots debt / extra payments / monthly payments / otherCosts per month. It also retires the
`plan-reports.ts` `additionalPayment` aggregation (the tracked double-count risk).

### Decisions captured during brainstorming
- **Monthly balance** subtracts all three credit cash outflows:
  `monthBalance = income − budget − expenseFlow − creditPayment − otherCosts − creditExtraPayment`.
- **Deuda Total** for the selected month = Σ each credit's balance **projected to that month**
  (interest + monthly payment + that credit's flow extra payments), not the static `currentBalance`.
- **Credit View chart**: four lines per month — `debt`, `creditExtraPayment`, `creditPayment`
  (recurring monthly), `otherCosts` — over the same current-month-forward range as Flow View.
- Architecture: one enriched `MonthlyFlow[]` feeds the card and both charts; per-month credit math
  lives in a pure, tested `buildCreditMonthlyView`. Chart colors/labels follow existing chart style.

## Data model notes
- No migration (uses existing columns: `currentBalance`, `monthlyPayment`, `interestRate`,
  `otherCosts`, `date` on CREDIT; `creditRecordId`, `amount`, `date` on CREDIT_FLOW).
- `Record.date` is epoch **ms** (`BigInt`); serialized to number via `serializeRecord`.
- "Current month" = `startOfMonth(new Date())`. Per-month math is start-of-month keyed.

## Changes

### 1. `PlanFlowReport` + `getPlanFlowReport`
Files: [src/utils/flow.ts](../../../src/utils/flow.ts), [plan-reports.ts](../../../src/app/actions/reports/plan-reports.ts)

- **`CreditInput` and `CreditMonth` are defined in `credit-flow.ts`** (the lower-level credit util) and
  re-exported/imported by `flow.ts`. This keeps the dependency one-way
  (`credit-projection.ts` ← `credit-flow.ts` ← `flow.ts`) and avoids a circular import.
  ```ts
  // in src/utils/credit-flow.ts
  export type CreditInput = {
    id: number;
    currentBalance: number;
    monthlyPayment: number;
    interestRate: number;   // percent
    otherCosts: number;
    balanceDateMs: number;  // Fecha Saldo (ms); falls back to current month for legacy null dates
  };
  ```
- New `PlanFlowReport` shape (`flow.ts` imports `CreditInput` from `credit-flow.ts`):
  ```ts
  export type PlanFlowReport = {
    recurring: { incomeTotal: number; budgetTotal: number };
    range: { startMonth: number; endMonth: number };
    expenseFlowByMonth: { month: number; total: number }[];
    credits: CreditInput[];
    creditFlowPayments: { creditRecordId: number; date: number; amount: number }[];
  };
  ```
- `getPlanFlowReport`: keep income/budget aggregates, range (clamped), and `expenseFlowByMonth`.
  **Remove** the `creditPaymentRes`/`creditBalanceRes` aggregates. **Add**:
  - `credits`: `prisma.record.findMany({ where: { sheet: { planId, sheetType: "CREDIT" } } })`
    mapped to `CreditInput` (`balanceDateMs = date != null ? Number(date) : startOfMonth(Date.now()).getTime()`).
  - `creditFlowPayments`: `prisma.record.findMany({ where: { sheet: { planId, sheetType: "CREDIT_FLOW" }, date: { not: null } }, select: { creditRecordId, date, amount } })`
    mapped to `{ creditRecordId, date: Number(date), amount }` (skip rows with null `creditRecordId`).

### 2. Pure util `buildCreditMonthlyView` (new, in [src/utils/credit-flow.ts](../../../src/utils/credit-flow.ts))
```ts
export type CreditMonth = {
  month: number;          // start-of-month ms
  monthlyPayment: number; // Σ credits' monthlyPayment (constant)
  otherCosts: number;     // Σ credits' otherCosts (constant)
  extraPayments: number;  // Σ flow payments dated this month
  debt: number;           // Σ projectCreditBalance(credit, month, thatCredit'sExtraByMonth)
};
export function buildCreditMonthlyView(
  credits: CreditInput[],
  flowPayments: { creditRecordId: number; date: number; amount: number }[],
  range: { startMonth: number; endMonth: number }
): CreditMonth[];
```
- Returns `[]` when `range.startMonth > range.endMonth`.
- Pre-builds a per-credit `extraByMonth` map (`buildExtraPaymentsByMonth` over that credit's payments).
- For each month in `eachMonthOfInterval(range)`: `monthlyPayment`/`otherCosts` are the constants;
  `extraPayments` = total flow payments whose `startOfMonth(date)` equals the month; `debt` = Σ over
  credits of `projectCreditBalance({balance, monthlyPayment, interestRate, balanceDateMs}, month, extraByMonth[creditId])`.

### 3. `buildMonthlyFlow` refactor ([src/utils/flow.ts](../../../src/utils/flow.ts))
- `MonthlyFlow` new shape:
  ```ts
  export type MonthlyFlow = {
    month: number;
    income: number;
    budget: number;
    creditPayment: number;      // recurring monthly payment total
    otherCosts: number;         // recurring credit otherCosts total
    creditExtraPayment: number; // flow extra payments this month
    expenseFlow: number;
    debt: number;               // projected total debt this month
    monthBalance: number;
    cumulativeBalance: number;
  };
  ```
- Build `creditView = buildCreditMonthlyView(report.credits, report.creditFlowPayments, report.range)`,
  index it by month. For each month: pull `expenseFlow` (existing map) and the credit fields from
  `creditView`; `monthBalance = income − budget − expenseFlow − creditPayment − otherCosts − creditExtraPayment`;
  `cumulativeBalance += monthBalance`; `debt = creditView[month].debt`.
- `findMonthFlow` and `clampMonthRange` unchanged.

### 4. Summary card ([monthlyResults.tsx](../../../src/app/(main)/plan/[planId]/components/monthlyResults.tsx), [monthly-summary-card.tsx](../../../src/components/custom/charts/monthly-summary-card.tsx))
- `MonthlyResults`: drop the `creditBalanceTotal` prop (no longer passed by `PlanResults`).
- `MonthlySummaryCard`: take only `flow: MonthlyFlow`. Show: **Saldo del Mes** (`monthBalance`),
  **Saldo Acumulado a fin de Mes** (`cumulativeBalance`), Ingresos, Gastos, **Pagos de Crédito**
  (`creditPayment`), **Otros Gastos de Crédito** (`otherCosts`, if >0), **Pagos Extra de Crédito**
  (`creditExtraPayment`, if >0), **Flujo de Gastos del mes** (`expenseFlow`, if >0),
  **Deuda Total** (`debt`, if >0).

### 5. Credit View chart (new `src/components/custom/charts/credit-view-chart.tsx`)
- Mirrors [flow-balance-chart.tsx](../../../src/components/custom/charts/flow-balance-chart.tsx):
  `"use client"`, `ChartContainer` + Recharts `LineChart`, X axis = month label, currency tick/tooltip.
- Props: `flows: MonthlyFlow[]`. Four `<Line>`s mapping to `debt`, `creditExtraPayment`,
  `creditPayment`, `otherCosts` with config labels "Deuda", "Pagos Extra", "Pago Mensual",
  "Otros Gastos". Empty-state card when `flows.length === 0`.

### 6. `PlanResults` wiring ([planResults.tsx](../../../src/app/(main)/plan/[planId]/components/planResults.tsx))
- Already calls `getPlanFlowReport` + `buildMonthlyFlow`. Drop the `creditBalanceTotal` prop passed
  to `MonthlyResults`. Add `<CreditViewChart flows={flows} />` below the existing `<FlowBalanceChart />`.

## Testing
- New `buildCreditMonthlyView` tests in [credit-flow.test.ts](../../../src/utils/credit-flow.test.ts):
  constants across months; extra payments land in the right month; debt = sum of projected balances;
  per-credit isolation (a payment only affects its own credit); empty range → `[]`.
- Rewrite [flow.test.ts](../../../src/utils/flow.test.ts) `buildMonthlyFlow` cases for the new
  `MonthlyFlow` fields, the new `monthBalance` formula (credit components), and per-month `debt`.
  Keep `clampMonthRange` and `findMonthFlow` cases.
- Existing suite green; `npm run lint` + `npm run build` clean.

## Edge cases
- No credits / no CREDIT_FLOW sheet → `credits`/`creditFlowPayments` empty → credit fields 0, `debt` 0;
  card credit lines hidden (>0 guards); chart lines flat at 0.
- Plan already ended (`startMonth > endMonth`) → `buildCreditMonthlyView` and `buildMonthlyFlow` return
  `[]`; existing empty-states apply (Credit View shows its empty card too).
- Legacy credit with null Fecha Saldo → `balanceDateMs` fallback to current month (projection no-op).
- Flow payment before a credit's Fecha Saldo → ignored by projection (rule A, inherent).

## Out of scope
- Any further CREDIT_FLOW sheet UI (done in #2).
- Real Prisma migrations workflow (project uses `db push`).
