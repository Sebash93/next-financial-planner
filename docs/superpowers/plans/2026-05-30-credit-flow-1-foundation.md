# CREDIT_FLOW Sub-project 1 — CREDIT Sheet Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give CREDIT records a "Fecha Saldo" (reusing `Record.date`), project each credit's balance forward to the current month, drop the static `additionalPayment` from the CREDIT sheet, and add a recurring "Otros Gastos" cost.

**Architecture:** A pure `projectCreditBalance` util rolls the balance month-by-month from Fecha Saldo (`balance + interest − monthlyPayment`, clamped). `calculateCreditInsights` is refactored to start from the current-month projected balance and an as-of month. The CREDIT grid gains "Fecha Saldo", "Saldo a hoy", and "Otros Gastos" columns and loses "Pago Adicional".

**Tech Stack:** Next.js 15, Prisma (PostgreSQL), date-fns v4, Zod, Vitest.

> **Git note:** This repo commits when the user asks. Confirm before committing (branch off `main` first), or batch at the end.

**Spec:** `docs/superpowers/specs/2026-05-30-credit-flow-1-foundation-design.md`
**Part of:** CREDIT_FLOW feature (#1 of 3).

---

## File Structure

- **Modify** `prisma/schema.prisma` — add `otherCosts Int?` to `Record`.
- **Create** `src/utils/credit-projection.ts` — pure `projectCreditBalance`.
- **Create** `src/utils/credit-projection.test.ts` — its tests.
- **Modify** `src/utils/amortization.ts` — refactor `calculateMonthsToPayoff` + `calculateCreditInsights`.
- **Modify** `src/utils/amortization.test.ts` — update for the new signatures.
- **Modify** `src/components/custom/grid/grid-cell-insights.tsx` — new props (projected balance + as-of month).
- **Modify** `src/components/custom/grid/grid-cell-edit.tsx` — add `otherCosts` to `currencyAccessors`.
- **Modify** `src/form-schemas/new-credit-record.schema.ts` — drop `additionalPayment`, add `date` + `otherCosts`.
- **Modify** `src/app/api/record/route.ts` — POST handles `otherCosts`.
- **Modify** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheetGrid.tsx` — columns + handlers + projection.
- **Modify** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheet.tsx` — totals use `monthlyPayment` only.

---

## Task 1: Prisma migration — add `otherCosts`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the column**

In `prisma/schema.prisma`, in the `Record` model, add `otherCosts` after `additionalPayment`:

```prisma
  currentBalance    Int? // Current balance of the credit/loan
  monthlyPayment    Int? // Required monthly payment
  interestRate      Float? // Monthly interest rate as decimal (e.g., 1.5 for 1.5%)
  additionalPayment Int? // Optional additional payment (CREDIT_FLOW payments)
  otherCosts        Int? // Recurring insurance/administrative costs (CREDIT)
```

- [ ] **Step 2: Create the migration and regenerate the client**

Run: `npx prisma migrate dev --name add_other_costs`
Expected: a new migration is created and applied; "Your database is now in sync with your schema."

Then run: `npx prisma generate`
Expected: "Generated Prisma Client". The `Record` type now includes `otherCosts: number | null`.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add otherCosts column to Record"
```

---

## Task 2: `projectCreditBalance` util (TDD)

**Files:**
- Create: `src/utils/credit-projection.ts`
- Test: `src/utils/credit-projection.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/credit-projection.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { projectCreditBalance } from "./credit-projection";

const month = (y: number, m: number) => startOfMonth(new Date(y, m, 1)).getTime();

const base = {
  balance: 10000,
  monthlyPayment: 500,
  interestRate: 2, // percent
  balanceDateMs: month(2026, 0), // Jan 2026
};

describe("projectCreditBalance", () => {
  it("returns the entered balance when the target month is the Fecha Saldo month", () => {
    expect(projectCreditBalance(base, month(2026, 0))).toBe(10000);
  });

  it("returns the entered balance when the target month is before Fecha Saldo", () => {
    expect(projectCreditBalance(base, month(2025, 11))).toBe(10000);
  });

  it("applies interest then payment for one elapsed month", () => {
    // 10000 + 2% (200) - 500 = 9700
    expect(projectCreditBalance(base, month(2026, 1))).toBe(9700);
  });

  it("compounds across several months", () => {
    // m1: 9700; m2: 9700 + 194 - 500 = 9394; m3: 9394 + 187.88 - 500 = 9081.88
    expect(projectCreditBalance(base, month(2026, 3))).toBeCloseTo(9081.88, 2);
  });

  it("clamps the balance at 0 and stays there", () => {
    const small = { balance: 600, monthlyPayment: 1000, interestRate: 0, balanceDateMs: month(2026, 0) };
    // m1: max(0, 600 - 1000) = 0; m2 stays 0
    expect(projectCreditBalance(small, month(2026, 2))).toBe(0);
  });

  it("grows the balance when payment does not cover interest", () => {
    const underwater = { balance: 10000, monthlyPayment: 100, interestRate: 2, balanceDateMs: month(2026, 0) };
    // m1: 10000 + 200 - 100 = 10100
    expect(projectCreditBalance(underwater, month(2026, 1))).toBe(10100);
  });

  it("pays down linearly with zero interest", () => {
    const noInterest = { balance: 10000, monthlyPayment: 500, interestRate: 0, balanceDateMs: month(2026, 0) };
    // 4 months * 500 = 2000 paid -> 8000
    expect(projectCreditBalance(noInterest, month(2026, 4))).toBe(8000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/utils/credit-projection.test.ts`
Expected: FAIL — `Failed to resolve import "./credit-projection"`.

- [ ] **Step 3: Implement**

Create `src/utils/credit-projection.ts`:

```ts
import { differenceInCalendarMonths, startOfMonth } from "date-fns";

export type CreditProjectionInput = {
  balance: number;        // Saldo Actual at Fecha Saldo
  monthlyPayment: number;
  interestRate: number;   // percent, e.g. 2 = 2%
  balanceDateMs: number;  // Fecha Saldo (ms)
};

/**
 * Roll a credit balance from its Fecha Saldo month to the target month.
 * Each elapsed month: interest accrues, then the monthly payment applies
 * (balance clamped at 0). Pure and deterministic.
 */
export function projectCreditBalance(input: CreditProjectionInput, targetMonthMs: number): number {
  const months = differenceInCalendarMonths(
    startOfMonth(targetMonthMs),
    startOfMonth(input.balanceDateMs)
  );
  if (months <= 0) return input.balance;

  const rate = input.interestRate / 100;
  let balance = input.balance;
  for (let i = 0; i < months; i++) {
    balance = Math.max(0, balance + balance * rate - input.monthlyPayment);
  }
  return balance;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/utils/credit-projection.test.ts`
Expected: PASS — all 7 cases green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/credit-projection.ts src/utils/credit-projection.test.ts
git commit -m "feat: add projectCreditBalance util"
```

---

## Task 3: Refactor `amortization.ts` (TDD)

**Files:**
- Modify: `src/utils/amortization.ts`
- Modify: `src/utils/amortization.test.ts`

- [ ] **Step 1: Update the tests first (red)**

Overwrite `src/utils/amortization.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import {
  calculateMonthlyInterest,
  calculateMonthsToPayoff,
  formatPayoffMonth,
  calculateCreditInsights,
} from "./amortization";

const asOf = new Date(2025, 0, 1).getTime(); // January 2025

describe("amortization", () => {
  describe("calculateMonthlyInterest", () => {
    it("calculates interest correctly", () => {
      expect(calculateMonthlyInterest(10000, 0.02)).toBe(200);
    });
    it("returns 0 for zero balance", () => {
      expect(calculateMonthlyInterest(0, 0.02)).toBe(0);
    });
    it("returns 0 for zero interest rate", () => {
      expect(calculateMonthlyInterest(10000, 0)).toBe(0);
    });
  });

  describe("calculateMonthsToPayoff", () => {
    it("calculates months correctly with interest", () => {
      expect(calculateMonthsToPayoff(10000, 500, 0.02)).toBe(26);
    });
    it("returns null when payment equals interest", () => {
      expect(calculateMonthsToPayoff(10000, 200, 0.02)).toBeNull();
    });
    it("returns null when payment is less than interest", () => {
      expect(calculateMonthsToPayoff(10000, 100, 0.02)).toBeNull();
    });
    it("handles zero interest rate", () => {
      expect(calculateMonthsToPayoff(10000, 500, 0)).toBe(20);
    });
    it("returns null for zero payment and zero interest", () => {
      expect(calculateMonthsToPayoff(10000, 0, 0)).toBeNull();
    });
  });

  describe("formatPayoffMonth", () => {
    it("formats date in Spanish locale", () => {
      expect(formatPayoffMonth(new Date(2025, 5, 15))).toBe("junio de 2025");
    });
    it("formats January correctly", () => {
      expect(formatPayoffMonth(new Date(2026, 0, 1))).toBe("enero de 2026");
    });
  });

  describe("calculateCreditInsights", () => {
    it("returns paid off message for zero balance", () => {
      const result = calculateCreditInsights(0, 500, 2, asOf);
      expect(result.message).toBe("Credito pagado");
      expect(result.monthlyInterest).toBe(0);
    });
    it("returns paid off message for negative balance", () => {
      expect(calculateCreditInsights(-100, 500, 2, asOf).message).toBe("Credito pagado");
    });
    it("returns missing data message when payment is zero", () => {
      expect(calculateCreditInsights(10000, 0, 2, asOf).message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });
    it("returns missing data message when interest is zero", () => {
      expect(calculateCreditInsights(10000, 500, 0, asOf).message).toBe(
        "Ingresa el pago mensual y la tasa de interes para ver los calculos"
      );
    });
    it("returns cannot cover interest message when payment is too low", () => {
      const result = calculateCreditInsights(10000, 150, 2, asOf);
      expect(result.message).toBe("El pago no cubre los intereses");
      expect(result.monthlyInterest).toBe(200);
    });
    it("calculates insights correctly for valid data", () => {
      const result = calculateCreditInsights(10000, 500, 2, asOf);
      expect(result.message).toBeNull();
      expect(result.monthlyInterest).toBe(200);
      expect(result.monthsToPayoff).toBe(26);
      expect(result.payoffDate).not.toBeNull();
    });
    it("handles null values gracefully", () => {
      expect(calculateCreditInsights(null, null, null, asOf).message).toBe("Credito pagado");
    });
    it("handles undefined values gracefully", () => {
      expect(calculateCreditInsights(undefined, undefined, undefined, asOf).message).toBe(
        "Credito pagado"
      );
    });
    it("computes payoff date relative to the as-of month", () => {
      // 2000 @ 1% with 1500 payment: m1 Jan -> 520, m2 Feb -> paid; payoff = Feb 2025
      const result = calculateCreditInsights(2000, 1500, 1, asOf);
      expect(result.monthsToPayoff).toBe(2);
      expect(result.payoffDate).toEqual(new Date(2025, 1, 1));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/utils/amortization.test.ts`
Expected: FAIL — `calculateMonthsToPayoff` still returns an object (not a number) and `calculateCreditInsights` has the old signature.

- [ ] **Step 3: Refactor the implementation**

Overwrite `src/utils/amortization.ts` with:

```ts
import { addMonths } from "date-fns";

export type CreditInsights = {
  monthlyInterest: number;
  monthsToPayoff: number | null;
  payoffDate: Date | null;
  message: string | null;
};

/**
 * Calculate monthly interest amount.
 * @param balance Current balance
 * @param monthlyInterestRate Monthly interest rate as decimal (e.g., 0.02 for 2%)
 */
export function calculateMonthlyInterest(balance: number, monthlyInterestRate: number): number {
  return balance * monthlyInterestRate;
}

/**
 * Months to pay off a balance with a fixed monthly payment.
 * n = -ln(1 - (r × B) / P) / ln(1 + r)
 * @returns number of months, or null if the payment never clears the balance.
 */
export function calculateMonthsToPayoff(
  balance: number,
  monthlyPayment: number,
  monthlyInterestRate: number
): number | null {
  if (monthlyInterestRate === 0) {
    if (monthlyPayment <= 0) return null;
    return Math.ceil(balance / monthlyPayment);
  }

  const monthlyInterest = balance * monthlyInterestRate;
  if (monthlyPayment <= monthlyInterest) return null;

  const r = monthlyInterestRate;
  const B = balance;
  const P = monthlyPayment;
  return Math.ceil(-Math.log(1 - (r * B) / P) / Math.log(1 + r));
}

/**
 * Format a date to Spanish locale month and year.
 */
export function formatPayoffMonth(date: Date): string {
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/**
 * Credit insights computed from a balance already projected to `asOfMonthMs`.
 * @param projectedBalance Balance as of asOfMonthMs (see projectCreditBalance)
 * @param monthlyPayment Monthly payment
 * @param interestRate Monthly interest rate as percentage (e.g., 2 for 2%)
 * @param asOfMonthMs The month the projected balance is measured at (ms)
 */
export function calculateCreditInsights(
  projectedBalance: number | null | undefined,
  monthlyPayment: number | null | undefined,
  interestRate: number | null | undefined,
  asOfMonthMs: number
): CreditInsights {
  const safeBalance = projectedBalance ?? 0;
  const safeMonthlyPayment = monthlyPayment ?? 0;
  const safeInterestRate = interestRate ?? 0;
  const monthlyInterestRate = safeInterestRate / 100;

  if (safeBalance <= 0) {
    return { monthlyInterest: 0, monthsToPayoff: null, payoffDate: null, message: "Credito pagado" };
  }

  if (safeMonthlyPayment === 0 || safeInterestRate === 0) {
    return {
      monthlyInterest: calculateMonthlyInterest(safeBalance, monthlyInterestRate),
      monthsToPayoff: null,
      payoffDate: null,
      message: "Ingresa el pago mensual y la tasa de interes para ver los calculos",
    };
  }

  const monthlyInterest = calculateMonthlyInterest(safeBalance, monthlyInterestRate);
  const months = calculateMonthsToPayoff(safeBalance, safeMonthlyPayment, monthlyInterestRate);

  if (months === null) {
    return {
      monthlyInterest,
      monthsToPayoff: null,
      payoffDate: null,
      message: "El pago no cubre los intereses",
    };
  }

  // First payment is the as-of month, so payoff is (months - 1) months later.
  const payoffDate = addMonths(new Date(asOfMonthMs), months - 1);
  return { monthlyInterest, monthsToPayoff: months, payoffDate, message: null };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/utils/amortization.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/amortization.ts src/utils/amortization.test.ts
git commit -m "refactor: base credit insights on projected balance and as-of month"
```

---

## Task 4: Update `GridCellInsights` props

**Files:**
- Modify: `src/components/custom/grid/grid-cell-insights.tsx`

- [ ] **Step 1: Replace props + call**

In `src/components/custom/grid/grid-cell-insights.tsx`, replace the props type and the component signature/`calculateCreditInsights` call:

Replace:
```tsx
type GridCellInsightsProps = {
  currentBalance: number | null | undefined;
  monthlyPayment: number | null | undefined;
  interestRate: number | null | undefined;
  additionalPayment: number | null | undefined;
};

export function GridCellInsights({
  currentBalance,
  monthlyPayment,
  interestRate,
  additionalPayment,
}: GridCellInsightsProps) {
  const insights = calculateCreditInsights(
    currentBalance,
    monthlyPayment,
    interestRate,
    additionalPayment
  );
```
with:
```tsx
type GridCellInsightsProps = {
  projectedBalance: number | null | undefined;
  monthlyPayment: number | null | undefined;
  interestRate: number | null | undefined;
  asOfMonthMs: number;
};

export function GridCellInsights({
  projectedBalance,
  monthlyPayment,
  interestRate,
  asOfMonthMs,
}: GridCellInsightsProps) {
  const insights = calculateCreditInsights(
    projectedBalance,
    monthlyPayment,
    interestRate,
    asOfMonthMs
  );
```

(The rest of the component — `renderTooltipContent` and the JSX — is unchanged.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors ONLY in `creditSheetGrid.tsx` (still passing the old props) — fixed in Task 7. No errors in `grid-cell-insights.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/custom/grid/grid-cell-insights.tsx
git commit -m "refactor: GridCellInsights takes projected balance and as-of month"
```

---

## Task 5: Update the credit schema + currency accessor

**Files:**
- Modify: `src/form-schemas/new-credit-record.schema.ts`
- Modify: `src/components/custom/grid/grid-cell-edit.tsx`

- [ ] **Step 1: Update the schema**

Overwrite `src/form-schemas/new-credit-record.schema.ts`:

```ts
import { z } from "zod";

export const newCreditRecordFormSchema = z.object({
  name: z.string().min(1).max(255),
  bucketId: z.number().optional(),
  date: z.number(), // Fecha Saldo (epoch ms)
  currentBalance: z.number().min(0),
  monthlyPayment: z.number().min(0),
  interestRate: z.number().min(0),
  otherCosts: z.number().min(0).optional(),
});
```

- [ ] **Step 2: Add `otherCosts` as a currency-edited field**

In `src/components/custom/grid/grid-cell-edit.tsx`, update the `currencyAccessors` array:

Replace:
```tsx
    const currencyAccessors = ["amount", "currentBalance", "monthlyPayment", "additionalPayment"]
```
with:
```tsx
    const currencyAccessors = ["amount", "currentBalance", "monthlyPayment", "additionalPayment", "otherCosts"]
```

- [ ] **Step 3: Commit**

```bash
git add src/form-schemas/new-credit-record.schema.ts src/components/custom/grid/grid-cell-edit.tsx
git commit -m "feat: credit schema gains Fecha Saldo and Otros Gastos, drops additionalPayment"
```

---

## Task 6: POST route handles `otherCosts`

**Files:**
- Modify: `src/app/api/record/route.ts`

- [ ] **Step 1: Destructure and persist `otherCosts`**

In `src/app/api/record/route.ts`, in the `POST` handler, add `otherCosts` to both the destructured body and the `prisma.record.create` data.

Add to the destructure block (after `additionalPayment,`):
```ts
    additionalPayment,
    otherCosts,
```

Add to the `data` object in `prisma.record.create` (after `additionalPayment,`):
```ts
        additionalPayment,
        otherCosts,
```

(The PUT route at `src/app/api/record/[recordId]/route.ts` already forwards the whole body, so `otherCosts` updates flow through with no change.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: still only the Task-7 `creditSheetGrid.tsx` errors; `route.ts` compiles (otherCosts exists on the Prisma create input after Task 1's generate).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/record/route.ts
git commit -m "feat: persist otherCosts on record creation"
```

---

## Task 7: Rewrite `creditSheetGrid.tsx`

**Files:**
- Modify: `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheetGrid.tsx`

- [ ] **Step 1: Replace the component**

Overwrite `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheetGrid.tsx` with:

```tsx
"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellInsights } from "@/components/custom/grid/grid-cell-insights";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import { GridCellPercentage } from "@/components/custom/grid/grid-cell-percentage";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newCreditRecordFormSchema } from "@/form-schemas/new-credit-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { projectCreditBalance } from "@/utils/credit-projection";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bucket, Record as RecordModel } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    bucketId: undefined,
    date: 0,
    currentBalance: 0,
    monthlyPayment: 0,
    interestRate: 0,
    otherCosts: 0,
}

type FormValues = z.infer<typeof newCreditRecordFormSchema>

type CreditSheetGridProps = {
    sheetId: string;
    records: RecordModel[],
    buckets: Bucket[]
}

export default function CreditSheetGrid({ records, buckets, sheetId }: CreditSheetGridProps) {
    const bucketsDictionary = useMemo(() => buckets.reduce((acc, bucket) => {
        acc[bucket.id] = bucket.name
        return acc
    }, {} as Record<string, string>), [buckets]);

    const currentMonthMs = useMemo(() => startOfMonth(new Date()).getTime(), [])

    const projectedBalanceFor = (record: RecordModel) => projectCreditBalance({
        balance: record.currentBalance ?? 0,
        monthlyPayment: record.monthlyPayment ?? 0,
        interestRate: record.interestRate ?? 0,
        balanceDateMs: record.date != null ? Number(record.date) : currentMonthMs,
    }, currentMonthMs)

    const form = useForm<FormValues>({
        resolver: zodResolver(newCreditRecordFormSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.bucketId) form.setValue("bucketId", row.bucketId)
        if (row.date) form.setValue("date", Number(row.date))
        if (row.currentBalance) form.setValue("currentBalance", row.currentBalance)
        if (row.monthlyPayment) form.setValue("monthlyPayment", row.monthlyPayment)
        if (row.interestRate) form.setValue("interestRate", row.interestRate)
        if (row.otherCosts) form.setValue("otherCosts", row.otherCosts)

        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            sheetId: parseInt(sheetId),
            date: BigInt(data.date),
            amount: data.monthlyPayment,
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    bucketId: data.bucketId,
                    date: data.date ? BigInt(data.date) : undefined,
                    currentBalance: data.currentBalance,
                    monthlyPayment: data.monthlyPayment,
                    interestRate: data.interestRate,
                    otherCosts: data.otherCosts,
                    amount: data.monthlyPayment ?? undefined,
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const columns: ColumnDef<RecordModel>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Nombre",
        },
        {
            id: "bucket",
            accessorKey: "bucketId",
            header: "Cuenta",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={bucketsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "date",
            accessorKey: "date",
            header: "Fecha Saldo",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "currentBalance",
            accessorKey: "currentBalance",
            header: "Saldo Actual",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "balanceToday",
            header: "Saldo a hoy",
            cell: ({ row }) => <GridCellCurrency amount={projectedBalanceFor(row.original)} />,
            enableSorting: false,
        },
        {
            id: "monthlyPayment",
            accessorKey: "monthlyPayment",
            header: "Pago Mensual",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "interestRate",
            accessorKey: "interestRate",
            header: "Interes Mensual",
            cell: ({ cell }) => <GridCellPercentage value={cell.getValue() as number | null} />,
        },
        {
            id: "otherCosts",
            accessorKey: "otherCosts",
            header: "Otros Gastos",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "insights",
            header: "Info",
            cell: ({ row }) => (
                <GridCellInsights
                    projectedBalance={projectedBalanceFor(row.original)}
                    monthlyPayment={row.original.monthlyPayment}
                    interestRate={row.original.interestRate}
                    asOfMonthMs={currentMonthMs}
                />
            ),
            enableSorting: false,
        },
        {
            id: "actions",
            accessorKey: "actions",
            header: "",
            cell: () => null,
        }
    ]

    return <Card>
        <CardHeader>
            <CardTitle>Creditos</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid
                columns={columns}
                data={records}
                buckets={buckets}
                onRowAdd={handleRowAdd}
                onRowUpdate={handleRowUpdate}
                onRowDelete={onDelete}
                validationSchema={newCreditRecordFormSchema}
                getRowId={(row) => row.id}
            />
        </CardContent>
    </Card>
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). `otherCosts` exists on `RecordModel`; `GridCellInsights` props match Task 4; `projectCreditBalance` resolves.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheetGrid.tsx"
git commit -m "feat: CREDIT grid with Fecha Saldo, Saldo a hoy, Otros Gastos"
```

---

## Task 8: Update `creditSheet` totals

**Files:**
- Modify: `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheet.tsx`

- [ ] **Step 1: Totals use `monthlyPayment` only**

In `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheet.tsx`, replace the `payments` reducer:

Replace:
```tsx
        const payments = records.reduce((sum, record) => {
            const monthly = record.monthlyPayment ?? 0;
            const additional = record.additionalPayment ?? 0;
            return sum + monthly + additional;
        }, 0);
```
with:
```tsx
        const payments = records.reduce((sum, record) => {
            return sum + (record.monthlyPayment ?? 0);
        }, 0);
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — compiled successfully.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheet.tsx"
git commit -m "refactor: credit totals exclude additionalPayment"
```

---

## Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Tests**

Run: `npm run test:run`
Expected: all pass (prior suite + `credit-projection.test.ts` + updated `amortization.test.ts`).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing warnings acceptable). Note: the stray unused `int` import was removed in the Task 7 rewrite.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiled successfully.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. On a CREDIT sheet:
1. Add a credit with a Fecha Saldo a few months in the past, a balance, monthly payment, interest, and Otros Gastos. "Saldo a hoy" shows the balance projected to the current month (lower than entered when the payment covers interest).
2. The "Pago Adicional" column is gone; "Fecha Saldo", "Saldo a hoy", and "Otros Gastos" are present.
3. The Info tooltip's payoff date is measured from the current month.
4. Editing a record (incl. Otros Gastos and Fecha Saldo) saves correctly.

- [ ] **Step 5: Final commit (if needed)**

```bash
git add -A
git commit -m "test: verify credit foundation end-to-end"
```

---

## Notes for the implementer

- **`otherCosts` does NOT affect `projectCreditBalance`** — it's recorded now and consumed by the monthly-expense math in sub-project 3.
- **`additionalPayment` stays in the DB** (used by CREDIT_FLOW in sub-project 2); it's only removed from the CREDIT sheet UI/schema/totals here.
- **Fecha Saldo reuses `Record.date`** (BigInt ms). The grid converts to `BigInt` on write (like EXPENSE_FLOW) and falls back to the current month for legacy null-date records when projecting.
- **`plan-reports.ts` is intentionally untouched** — plan-level credit aggregation is reworked in sub-project 3.
```
