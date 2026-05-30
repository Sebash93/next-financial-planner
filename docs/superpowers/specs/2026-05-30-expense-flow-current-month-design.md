# Expense Flow — Current-Month-Forward Calculations, Validation & Past Table

**Date:** 2026-05-30
**Status:** Approved design
**Builds on:** `2026-05-30-expense-flow-monthly-results-design.md` (month-aware results + Flow View, already implemented).

## Context

The month-aware plan results and Flow View currently span the plan's full date range
starting at `plan.initialDate`. Users want planning to be **forward-looking from the
current month**: calculations begin at the current month, past months are excluded, and
the carryover starts fresh at the current month. They also want to prevent selecting/entering
past months, and to see historical expense-flow records in a separate read-only table.

### Decisions captured during brainstorming
- **Carryover starts fresh at 0** at the current month (Option A). Past months and past
  expense-flow records are excluded from the forward calculation.
- **Past expenses table is read-only** reference (no add/edit/delete).
- Month selector and expense-flow date entry are both **blocked from going before the
  current month**, enforced at the UI *and* validation layers.
- Extract a pure `clampMonthRange` helper into `flow.ts` so it is unit-tested.
- Past table label: **"Gastos Pasados"**.

## Data model notes (unchanged, still relevant)
- `Plan.initialDate`/`endDate` are epoch **seconds** (`×1000` for ms).
- `Record.date` (EXPENSE_FLOW) is epoch **milliseconds** (`BigInt?`).
- "Current month" = `startOfMonth(new Date())`.

## Changes

### 1. Calculations start at the current month
File: [src/utils/flow.ts](../../../src/utils/flow.ts), [plan-reports.ts](../../../src/app/actions/reports/plan-reports.ts).

- New pure helper in `flow.ts`:
  ```ts
  // Clamp the planning window to start no earlier than the current month.
  export function clampMonthRange(planStartMs: number, nowMs: number, planEndMs: number)
    : { startMonth: number; endMonth: number };
  ```
  Returns `{ startMonth: max(startOfMonth(planStartMs), startOfMonth(nowMs)), endMonth: startOfMonth(planEndMs) }`.
- `getPlanFlowReport` uses `clampMonthRange(plan.initialDate*1000, Date.now(), plan.endDate*1000)`
  for the returned `range` (replacing the current direct `startOfMonth` of the plan bounds).
- `buildMonthlyFlow` guard: if `range.startMonth > range.endMonth`, return `[]`
  (plan already ended). Cumulative still starts at 0 on the first in-range month.

### 2. Month selector cannot go before the current month
File: [month-year-picker.tsx](../../../src/components/custom/month-year-picker.tsx),
[monthlyResults.tsx](../../../src/app/(main)/plan/[planId]/components/monthlyResults.tsx).

- `MonthYearPicker` gains optional `minValue?: number` / `maxValue?: number` (timestamps).
  Month `SelectItem`s and year `SelectItem`s whose resulting date falls outside
  `[minValue, maxValue]` are rendered `disabled`. Years list is derived to span
  `min..max` years when provided.
- `MonthlyResults` passes `minValue={range.startMonth}` / `maxValue={range.endMonth}`,
  keeps the default = current month (already clamped), and clamps `onChange` into range
  as a safety net.
- Empty-state: when `flows` is empty, `MonthlyResults` renders a short "El plan ya
  finalizó" message instead of the picker/card; `FlowBalanceChart` renders an empty state.

### 3. Expense-flow date validation (no dates before current month)
Files: [new-expense-flow-record.schema.ts](../../../src/form-schemas/new-expense-flow-record.schema.ts),
[date-picker.tsx](../../../src/components/custom/date-picker.tsx),
[grid-cell-edit.tsx](../../../src/components/custom/grid/grid-cell-edit.tsx),
[sheet-grid.tsx](../../../src/components/custom/sheet-grid.tsx),
[expenseFlowSheetGrid.tsx](../../../src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx).

- **Schema:** add `.refine(date => date >= startOfMonth(new Date()).getTime(), { message: "La fecha no puede ser anterior al mes actual.", path: ["date"] })`.
  This blocks both "Agregar" (form resolver) and inline-edit save (grid runs schema on edit).
- **DatePicker:** add optional `minDate?: Date`; forward to `Calendar` as
  `disabled={{ before: minDate }}` and `startMonth={minDate}` (so past months can't be
  picked or navigated into). When `minDate` is undefined, behavior is unchanged.
- **Prop threading:** `SheetGrid` gains optional `minDate?: Date`, passed to `GridCellEdit`
  (both the edit-row and add-row instances) alongside existing `tags`/`buckets`;
  `GridCellEdit` forwards it to `DatePicker`. Only EXPENSE_FLOW sets it.
- **ExpenseFlowSheetGrid:** pass `minDate={startOfMonth(new Date())}` to its `SheetGrid`(s).

### 4. Two tables in the EXPENSE_FLOW sheet
File: [expenseFlowSheetGrid.tsx](../../../src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx).

- `useMemo` split on `startOfMonth(new Date()).getTime()`:
  - **currentRecords**: `date == null || Number(date) >= monthStart` → main grid (add/edit/delete, with `minDate`).
  - **pastRecords**: `Number(date) < monthStart` → read-only grid.
- **Main table:** existing card (title stays "Presupuesto" — out of scope to rename), full handlers.
- **Past table:** a second `Card` titled **"Gastos Pasados"** containing a `SheetGrid` with
  the same `columns` but **no** `onRowAdd`/`onRowUpdate`/`onRowDelete`/`validationSchema`
  (read-only). Rendered only when `pastRecords.length > 0`.

## Testing
Extend [src/utils/flow.test.ts](../../../src/utils/flow.test.ts):
- `clampMonthRange`: start clamps up to current month when plan starts earlier; keeps plan
  start when it is in the future; end unchanged; all normalized to start-of-month.
- `buildMonthlyFlow`: returns `[]` when `startMonth > endMonth`; cumulative starts fresh at
  the first in-range month (existing behavior re-confirmed).

Existing 66 tests stay green; `npm run lint` and `npm run build` clean.

## Edge cases
- Plan fully in the past (`now > planEnd`) → `flows = []` → empty states; no past/future confusion.
- Plan starts in the future → start = plan start (later than current month).
- EXPENSE_FLOW record with `date == null` → kept in the main table.
- A record dated within the current month is allowed (boundary is `startOfMonth`, inclusive).

## Out of scope (v1)
- Renaming the main expense-flow card ("Presupuesto").
- Editing past records (read-only by decision).
- Restricting non-date sheet types (they have no date).
- Carrying a historical opening balance (explicitly rejected — Option A).
