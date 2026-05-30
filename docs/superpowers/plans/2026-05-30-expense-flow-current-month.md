# Expense Flow — Current-Month-Forward, Validation & Past Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make plan calculations start at the current month (fresh carryover), block selecting/entering months before the current month, and show past expense-flow records in a separate read-only table.

**Architecture:** A pure `clampMonthRange` helper (in `flow.ts`) clamps the planning window's start to the current month; `getPlanFlowReport` uses it and `buildMonthlyFlow` guards an empty window. `MonthYearPicker` gains min/max disabling; the expense-flow date is validated in both the Zod schema and the calendar (`minDate` threaded `SheetGrid → GridCellEdit → DatePicker`). `ExpenseFlowSheetGrid` splits records into a full main table and a read-only past table.

**Tech Stack:** Next.js 15 App Router, Prisma, date-fns v4, react-day-picker v9, Zod, Vitest.

> **Git note:** This repo commits when the user asks. Commit steps are grouped logically — confirm with the user (and branch off `main`) before committing, or batch at the end.

**Spec:** `docs/superpowers/specs/2026-05-30-expense-flow-current-month-design.md`
**Builds on:** the already-implemented month-aware results / Flow View.

---

## File Structure

- **Modify** `src/utils/flow.ts` — add `clampMonthRange`; add empty-window guard to `buildMonthlyFlow`.
- **Modify** `src/utils/flow.test.ts` — tests for the above.
- **Modify** `src/app/actions/reports/plan-reports.ts` — use `clampMonthRange` for `range`.
- **Modify** `src/components/custom/month-year-picker.tsx` — optional `minValue`/`maxValue` disabling.
- **Modify** `src/app/(main)/plan/[planId]/components/monthlyResults.tsx` — pass min/max, clamp onChange, empty state.
- **Modify** `src/components/custom/charts/flow-balance-chart.tsx` — empty state.
- **Modify** `src/form-schemas/new-expense-flow-record.schema.ts` — date refine (no past months).
- **Create** `src/form-schemas/new-expense-flow-record.schema.test.ts` — refine tests.
- **Modify** `src/components/custom/date-picker.tsx` — optional `minDate`.
- **Modify** `src/components/custom/grid/grid-cell-edit.tsx` — forward `minDate`.
- **Modify** `src/components/custom/sheet-grid.tsx` — accept + thread `minDate`.
- **Modify** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx` — split tables + `minDate`.

---

## Task 1: `clampMonthRange` + `buildMonthlyFlow` empty-window guard (TDD)

**Files:**
- Modify: `src/utils/flow.ts`
- Test: `src/utils/flow.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/utils/flow.test.ts` (after the existing `findMonthFlow` describe block), and add `clampMonthRange` to the import on line 3:

Change the import line to:
```ts
import { buildMonthlyFlow, findMonthFlow, clampMonthRange, type PlanFlowReport } from "./flow";
```

Append:
```ts
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
    const month = (y: number, m: number) => startOfMonth(new Date(y, m, 1)).getTime();
    const report: PlanFlowReport = {
      recurring: { incomeTotal: 1000, budgetTotal: 0, creditPaymentTotal: 0, creditBalanceTotal: 0 },
      range: { startMonth: month(2027, 0), endMonth: month(2026, 0) },
      expenseFlowByMonth: [],
    };
    expect(buildMonthlyFlow(report)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: FAIL — `clampMonthRange is not a function`; the empty-window test fails (current `eachMonthOfInterval` throws or returns unexpected output for an inverted range).

- [ ] **Step 3: Implement**

In `src/utils/flow.ts`, add the guard at the top of `buildMonthlyFlow` (immediately after `const { recurring, range, expenseFlowByMonth } = report;`):

```ts
  if (range.startMonth > range.endMonth) return [];
```

And append this exported function at the end of the file:

```ts
/**
 * Clamp the planning window to start no earlier than the current month.
 * All inputs are millisecond timestamps.
 */
export function clampMonthRange(
  planStartMs: number,
  nowMs: number,
  planEndMs: number
): { startMonth: number; endMonth: number } {
  const startMonth = Math.max(startOfMonth(planStartMs).getTime(), startOfMonth(nowMs).getTime());
  const endMonth = startOfMonth(planEndMs).getTime();
  return { startMonth, endMonth };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/utils/flow.test.ts`
Expected: PASS — all existing + new cases green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/flow.ts src/utils/flow.test.ts
git commit -m "feat: add clampMonthRange and empty-window guard to flow util"
```

---

## Task 2: Use `clampMonthRange` in `getPlanFlowReport`

**Files:**
- Modify: `src/app/actions/reports/plan-reports.ts`

- [ ] **Step 1: Update the import and range computation**

Change the `@/utils/flow` import to also bring in `clampMonthRange`:

```ts
import { clampMonthRange, type PlanFlowReport } from "@/utils/flow";
```

Keep `import { startOfMonth } from "date-fns";` exactly as-is — it is still used by the EXPENSE_FLOW bucketing loop further down in `getPlanFlowReport`.

Replace the `range` block:

```ts
  // Plan dates are stored as epoch SECONDS; convert to ms before use.
  const range = {
    startMonth: startOfMonth(plan.initialDate * 1000).getTime(),
    endMonth: startOfMonth(plan.endDate * 1000).getTime(),
  };
```

with:

```ts
  // Plan dates are stored as epoch SECONDS; convert to ms. Clamp the window
  // to start no earlier than the current month (forward-looking planning).
  const range = clampMonthRange(plan.initialDate * 1000, Date.now(), plan.endDate * 1000);
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. `startOfMonth` is still used by the expense-flow bucketing loop; `clampMonthRange` resolves.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/reports/plan-reports.ts
git commit -m "feat: start plan flow at current month via clampMonthRange"
```

---

## Task 3: `MonthYearPicker` min/max disabling

**Files:**
- Modify: `src/components/custom/month-year-picker.tsx`

- [ ] **Step 1: Replace the component**

Overwrite `src/components/custom/month-year-picker.tsx` with:

```tsx
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { startOfMonth } from "date-fns"
import { getMonthFromTimestamp, getYearFromTimestamp } from "./month-year-picker.utils"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function MonthYearPicker({ value, onChange, minValue, maxValue }: {
    value: number,
    onChange: (value: number) => void,
    minValue?: number,
    maxValue?: number,
}) {
    const current = new Date(value)
    const newMonth = getMonthFromTimestamp(value)
    const newYear = getYearFromTimestamp(value)

    const isMonthDisabled = (monthIndex: number) => {
        const monthTs = startOfMonth(new Date(current.getFullYear(), monthIndex, 1)).getTime()
        if (minValue !== undefined && monthTs < startOfMonth(minValue).getTime()) return true
        if (maxValue !== undefined && monthTs > startOfMonth(maxValue).getTime()) return true
        return false
    }

    const startYear = minValue !== undefined ? new Date(minValue).getFullYear() : new Date().getFullYear()
    const endYear = maxValue !== undefined ? new Date(maxValue).getFullYear() : startYear + 9
    const years = Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => startYear + i)

    const handleMonthChange = (month: string) => {
        onChange(new Date(value).setMonth(parseInt(month)))
    }

    const handleYearChange = (year: string) => {
        onChange(new Date(value).setFullYear(parseInt(year)))
    }

    return <div className="flex gap-x-2">
        <Select value={newMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
                {MONTHS.map((label, idx) => (
                    <SelectItem
                        key={idx}
                        value={idx.toString().padStart(2, "0")}
                        disabled={isMonthDisabled(idx)}
                    >
                        {label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select value={newYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
                {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                        {year}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/month-year-picker.tsx
git commit -m "feat: add min/max month-year disabling to MonthYearPicker"
```

---

## Task 4: `MonthlyResults` clamp + empty state; `FlowBalanceChart` empty state

**Files:**
- Modify: `src/app/(main)/plan/[planId]/components/monthlyResults.tsx`
- Modify: `src/components/custom/charts/flow-balance-chart.tsx`

- [ ] **Step 1: Replace `monthlyResults.tsx`**

Overwrite with:

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

  if (flows.length === 0) {
    return <p className="text-sm text-muted-foreground">El plan ya finalizó.</p>;
  }

  // Always resolve to a real flow entry; fall back to the first month.
  const flow = findMonthFlow(flows, selectedMonth) ?? flows[0];

  return (
    <div className="flex flex-col gap-4">
      <MonthYearPicker
        value={selectedMonth}
        minValue={range.startMonth}
        maxValue={range.endMonth}
        onChange={(value) =>
          setSelectedMonth(clamp(startOfMonth(value).getTime(), range.startMonth, range.endMonth))
        }
      />
      {flow && <MonthlySummaryCard flow={flow} creditBalanceTotal={creditBalanceTotal} />}
    </div>
  );
}
```

- [ ] **Step 2: Add empty state to `flow-balance-chart.tsx`**

In `src/components/custom/charts/flow-balance-chart.tsx`, inside `FlowBalanceChart`, immediately before `const data = flows.map(...)`, add:

```tsx
  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flow View</CardTitle>
          <CardDescription>Saldo acumulado por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay meses para mostrar.</p>
        </CardContent>
      </Card>
    );
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/plan/[planId]/components/monthlyResults.tsx" src/components/custom/charts/flow-balance-chart.tsx
git commit -m "feat: clamp month selection to range and handle empty plan window"
```

---

## Task 5: Expense-flow date schema refine (TDD)

**Files:**
- Modify: `src/form-schemas/new-expense-flow-record.schema.ts`
- Create: `src/form-schemas/new-expense-flow-record.schema.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/form-schemas/new-expense-flow-record.schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { newExpenseFlowRecordSchema } from "./new-expense-flow-record.schema";

const valid = { name: "Gasto", amount: 100 };

describe("newExpenseFlowRecordSchema date validation", () => {
  it("accepts a date at the start of the current month", () => {
    const date = startOfMonth(new Date()).getTime();
    expect(newExpenseFlowRecordSchema.safeParse({ ...valid, date }).success).toBe(true);
  });

  it("accepts a date later this month", () => {
    const date = startOfMonth(new Date()).getTime() + 5 * 24 * 60 * 60 * 1000;
    expect(newExpenseFlowRecordSchema.safeParse({ ...valid, date }).success).toBe(true);
  });

  it("rejects a date before the current month", () => {
    const date = startOfMonth(new Date()).getTime() - 1;
    const result = newExpenseFlowRecordSchema.safeParse({ ...valid, date });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/form-schemas/new-expense-flow-record.schema.test.ts`
Expected: FAIL — the "rejects a date before the current month" case currently passes parsing (no refine yet), so the `toBe(false)` assertion fails.

- [ ] **Step 3: Implement the refine**

Overwrite `src/form-schemas/new-expense-flow-record.schema.ts`:

```ts
import { z } from "zod";
import { startOfMonth } from "date-fns";

export const newExpenseFlowRecordSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.number().refine((date) => date >= startOfMonth(new Date()).getTime(), {
    message: "La fecha no puede ser anterior al mes actual.",
  }),
  amount: z.number(),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/form-schemas/new-expense-flow-record.schema.test.ts`
Expected: PASS — all three cases green.

- [ ] **Step 5: Commit**

```bash
git add src/form-schemas/new-expense-flow-record.schema.ts src/form-schemas/new-expense-flow-record.schema.test.ts
git commit -m "feat: reject expense-flow dates before the current month"
```

---

## Task 6: `DatePicker` minDate + thread through `SheetGrid`/`GridCellEdit`

**Files:**
- Modify: `src/components/custom/date-picker.tsx`
- Modify: `src/components/custom/grid/grid-cell-edit.tsx`
- Modify: `src/components/custom/sheet-grid.tsx`

- [ ] **Step 1: Add `minDate` to `DatePicker`**

In `src/components/custom/date-picker.tsx`, change the props type and the `Calendar` usage:

Replace:
```tsx
type DatePickerProps = {
    onChange: (date: Date | undefined) => void
    value?: Date
}

export const DatePicker = ({ onChange, value }: DatePickerProps) => {
```
with:
```tsx
type DatePickerProps = {
    onChange: (date: Date | undefined) => void
    value?: Date
    minDate?: Date
}

export const DatePicker = ({ onChange, value, minDate }: DatePickerProps) => {
```

Replace the `<Calendar ... />` element with:
```tsx
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={minDate ? { before: minDate } : undefined}
                    startMonth={minDate}
                    initialFocus
                />
```

- [ ] **Step 2: Forward `minDate` in `GridCellEdit`**

In `src/components/custom/grid/grid-cell-edit.tsx`:

Add `minDate?: Date` to the props type:
```tsx
type GridCellEditProps<TData, TValue> = {
    column: ColumnDef<TData, TValue>
    value: unknown
    tags?: Tag[]
    buckets?: Bucket[]
    accessor: string
    onChange: (value: unknown) => void
    minDate?: Date
}
```

Add `minDate` to the destructured params:
```tsx
export const GridCellEdit = <TData, TValue>({ column, value, tags, buckets, accessor, onChange, minDate }: GridCellEditProps<TData, TValue>) => {
```

Pass it to `DatePicker` (the `accessor === "date"` branch):
```tsx
    if (accessor === "date") {
        return <DatePicker value={value ? getDateFromTimestamp(value as number) : undefined} onChange={handleChange} minDate={minDate} />
    }
```

- [ ] **Step 3: Thread `minDate` through `SheetGrid`**

In `src/components/custom/sheet-grid.tsx`:

Add `minDate?: Date` to the props interface:
```tsx
interface SheetGridProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    tags?: Tag[]
    buckets?: Bucket[]
    onRowAdd?: (row: Partial<TData>) => void
    onRowUpdate?: (rowId: number, data: Partial<TData>) => void
    onRowDelete?: (rowId: number) => void
    validationSchema?: z.ZodSchema
    getRowId?: (row: TData) => number
    minDate?: Date
}
```

Add `minDate` to the destructured params:
```tsx
export default function SheetGrid<TData, TValue>({
    columns,
    data,
    onRowAdd,
    onRowUpdate,
    onRowDelete,
    validationSchema,
    getRowId,
    tags,
    buckets,
    minDate,
}: SheetGridProps<TData, TValue>) {
```

Pass `minDate` to BOTH `GridCellEdit` usages — the edit-row instance (currently around lines 259-266) and the add-row instance (around lines 292-304). Add `minDate={minDate}` as a prop to each, e.g.:

Edit-row instance:
```tsx
                                            <GridCellEdit
                                                column={cell.column.columnDef}
                                                accessor={accessor}
                                                tags={tags}
                                                buckets={buckets}
                                                value={(editedRowData as Record<string, unknown>)[accessor]}
                                                onChange={(value) => handleFieldChange(accessor, value)}
                                                minDate={minDate}
                                            />
```

Add-row instance:
```tsx
                                    <GridCellEdit
                                        column={column}
                                        accessor={accessor}
                                        tags={tags}
                                        buckets={buckets}
                                        value={(newRowData as Record<string, unknown>)[accessor] as string ?? ""}
                                        onChange={(value) =>
                                            setNewRowData((prev) => ({
                                                ...prev,
                                                [accessor]: value,
                                            }))
                                        }
                                        minDate={minDate}
                                    />
```

- [ ] **Step 4: Type-check + tests**

Run: `npx tsc --noEmit && npm run test:run -- src/components/custom/grid/grid-cell-edit.test.tsx`
Expected: PASS — `minDate` is optional, so the existing `grid-cell-edit` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/custom/date-picker.tsx src/components/custom/grid/grid-cell-edit.tsx src/components/custom/sheet-grid.tsx
git commit -m "feat: thread minDate to DatePicker to disable past dates"
```

---

## Task 7: Split EXPENSE_FLOW into main + read-only past tables

**Files:**
- Modify: `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx`

- [ ] **Step 1: Replace the component**

Overwrite `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx` with:

```tsx
"use client"
import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newExpenseFlowRecordSchema } from "@/form-schemas/new-expense-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Record } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    date: 0,
    amount: 0,
}
type FormValues = z.infer<typeof newExpenseFlowRecordSchema>

type ExpenseFlowSheetGridProps = {
    records?: Record[]
    sheetId: string
}

export default function ExpenseFlowSheetGrid({ records, sheetId }: ExpenseFlowSheetGridProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(newExpenseFlowRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, Record>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const monthStart = useMemo(() => startOfMonth(new Date()), [])

    const { currentRecords, pastRecords } = useMemo(() => {
        const current: Record[] = []
        const past: Record[] = []
        for (const record of records ?? []) {
            if (record.date != null && Number(record.date) < monthStart.getTime()) {
                past.push(record)
            } else {
                current.push(record)
            }
        }
        return { currentRecords: current, pastRecords: past }
    }, [records, monthStart])

    const handleRowAdd = (row: Partial<Record>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.date) form.setValue("date", Number(row.date))
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            date: BigInt(data.date),
            sheetId: parseInt(sheetId),
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<Record>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    amount: data.amount,
                    date: data.date ? BigInt(data.date) : undefined
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const columns: ColumnDef<Record>[] = [
        {
            id: "date",
            accessorKey: "date",
            header: "Mes",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "name",
            accessorKey: "name",
            header: "Nombre",
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Valor",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number} />,
        },
        {
            id: "actions",
            accessorKey: "actions",
            header: "",
            cell: () => null,
        }
    ]

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Presupuesto</CardTitle>
                </CardHeader>
                <CardContent>
                    <SheetGrid
                        columns={columns}
                        data={currentRecords}
                        onRowAdd={handleRowAdd}
                        onRowUpdate={handleRowUpdate}
                        onRowDelete={onDelete}
                        validationSchema={newExpenseFlowRecordSchema}
                        getRowId={(row) => row.id}
                        minDate={monthStart}
                    />
                </CardContent>
            </Card>
            {pastRecords.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos Pasados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SheetGrid columns={columns} data={pastRecords} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/expenseFlowSheetGrid.tsx"
git commit -m "feat: split expense flow into main and read-only past tables"
```

---

## Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: all pass (prior 66 + new `clampMonthRange`/empty-window + schema tests).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing warnings in `creditSheetGrid.tsx` / `sheet-grid.tsx` acceptable).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiled successfully.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. On a plan that started before this month with EXPENSE_FLOW records in past and current/future months:
1. The month selector defaults to the current month; months before it are disabled, and you cannot navigate the year picker below the current year's start.
2. "Saldo Acumulado a fin de Mes" starts fresh at the current month (no past carryover); the Flow View line begins at the current month.
3. In the EXPENSE_FLOW sheet: the main table shows current-month-onward records and its date picker disables days before the current month; the "Agregar" button rejects a past date with the validation message.
4. A "Gastos Pasados" card appears below with past records and no add/edit/delete affordances.

- [ ] **Step 5: Final commit (if any uncommitted fixes)**

```bash
git add -A
git commit -m "test: verify current-month expense flow behavior end-to-end"
```

---

## Notes for the implementer

- **Carryover "fresh from current month" is achieved entirely by `clampMonthRange`** — no change to the cumulative math. `buildMonthlyFlow` starts cumulative at 0 on the first in-range month, which is now the current month.
- **`minDate` is optional everywhere** — only `ExpenseFlowSheetGrid` sets it, so budget/income/credit grids are unaffected.
- **react-day-picker v9**: `disabled={{ before }}` greys out earlier days; `startMonth` stops navigation before that month. Both no-ops when `minDate` is undefined.
- **Past/current split uses `Number(record.date)`** — `record.date` is typed `bigint | null` (Prisma) but arrives as a number at runtime; `Number(...)` handles both. Null-dated records go to the main table.
```
