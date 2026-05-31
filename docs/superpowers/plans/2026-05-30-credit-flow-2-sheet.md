# CREDIT_FLOW Sub-project 2 — CREDIT_FLOW Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CREDIT_FLOW sheet for logging extra payments against a specific credit (one per plan, requires a CREDIT sheet), with per-row computed monthly payment + resulting balance, a read-only past-payments table with strike styling, and create-sheet gating messages.

**Architecture:** A self-relation `Record.creditRecordId` links a payment to a credit. `projectCreditBalance` is extended with per-month extra payments (iteration from Fecha Saldo means pre-snapshot payments are naturally ignored). A pure `credit-flow.ts` computes each row's resulting balance. The grid mirrors `expenseFlowSheetGrid` (main + read-only past table) with a credit selector wired through `SheetGrid`/`GridCellEdit`.

**Tech Stack:** Next.js 15, Prisma (PostgreSQL), date-fns v4, Zod, Vitest, react-hook-form.

> **Git note:** This repo commits when the user asks. Subagents/coordinator do NOT commit; working tree only. Skip the plan's commit steps unless the user says otherwise.

**Spec:** `docs/superpowers/specs/2026-05-30-credit-flow-2-sheet-design.md`
**Builds on:** sub-project 1 (`projectCreditBalance`, Fecha Saldo, `serializeRecord`).

---

## File Structure

- **Modify** `prisma/schema.prisma` — `CREDIT_FLOW` enum value + `Record.creditRecordId` self-relation.
- **Modify** `src/utils/credit-projection.ts` (+ test) — optional `extraPaymentsByMonth` param.
- **Create** `src/utils/credit-flow.ts` (+ test) — `buildExtraPaymentsByMonth`, `creditBalanceAfterPayment`.
- **Create** `src/form-schemas/new-credit-flow-record.schema.ts` (+ test).
- **Modify** `src/app/actions/reports/plan-reports.ts` — `getPlanCreditRecords` server action.
- **Modify** `src/app/api/record/route.ts` — POST persists `creditRecordId`.
- **Modify** `src/components/custom/grid/grid-cell-edit.tsx` — `creditRecordId` select + `credits` prop.
- **Modify** `src/components/custom/sheet-grid.tsx` — thread `credits` + add `rowClassName`.
- **Modify** `src/components/custom/sheet-type-badge.tsx` — `CREDIT_FLOW` label.
- **Modify** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/sheetContent.tsx` — route CREDIT_FLOW.
- **Modify** `src/app/api/sheet/route.ts` — one-per-plan + dependency enforcement.
- **Modify** `src/app/(main)/plan/[planId]/new-sheet/components/newSheetForm.tsx` — option + gating messages.
- **Create** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditFlowSheet.tsx` — wrapper.
- **Create** `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditFlowSheetGrid.tsx` — grid.

---

## Task 1: Prisma migration (enum + self-relation)

**Files:** Modify `prisma/schema.prisma`

- [ ] **Step 1: Edit the schema**

Add `CREDIT_FLOW` to the enum:
```prisma
enum EnumSheetType {
  BUDGET
  EXPENSE_FLOW
  INCOME
  CREDIT
  CREDIT_FLOW
}
```

In the `Record` model, add the self-relation (after `otherCosts`):
```prisma
  otherCosts        Int? // Recurring insurance/administrative costs (CREDIT)
  creditRecordId     Int?
  creditRecord       Record?  @relation("CreditFlowPayments", fields: [creditRecordId], references: [id], onDelete: Cascade)
  creditFlowPayments Record[] @relation("CreditFlowPayments")
```

- [ ] **Step 2: Migrate + generate** (repo owner runs)

Run: `npx prisma migrate dev --name add_credit_flow && npx prisma generate`
Expected: migration applied; `Record` type gains `creditRecordId: number | null`; `EnumSheetType` includes `CREDIT_FLOW`.

- [ ] **Step 3: Commit** (skip unless user asks)
```bash
git add prisma/schema.prisma prisma/migrations && git commit -m "feat: add CREDIT_FLOW sheet type and credit self-relation"
```

---

## Task 2: Extend `projectCreditBalance` with per-month extra payments (TDD)

**Files:** Modify `src/utils/credit-projection.ts`, `src/utils/credit-projection.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/utils/credit-projection.test.ts`:
```ts
describe("projectCreditBalance with extra payments", () => {
  const noInterest = {
    balance: 10000,
    monthlyPayment: 500,
    interestRate: 0,
    balanceDateMs: month(2026, 0), // Jan 2026
  };

  it("applies an extra payment in its month", () => {
    // Jan event: 10000 - 500 = 9500; Feb event: 9500 - 500 - 1000 = 8000 -> start of Mar
    const extra = new Map<number, number>([[month(2026, 1), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(8000);
  });

  it("ignores extra payments dated before the Fecha Saldo month", () => {
    // Dec 2025 is before Jan Fecha Saldo -> never an event month -> ignored
    const extra = new Map<number, number>([[month(2025, 11), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(9000);
  });

  it("applies an extra payment dated in the Fecha Saldo month itself", () => {
    // Jan event: 10000 - 500 - 1000 = 8500; Feb event: 8500 - 500 = 8000
    const extra = new Map<number, number>([[month(2026, 0), 1000]]);
    expect(projectCreditBalance(noInterest, month(2026, 2), extra)).toBe(8000);
  });

  it("is unchanged when no extra-payments map is passed (backward compatible)", () => {
    expect(projectCreditBalance(noInterest, month(2026, 2))).toBe(9000);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/utils/credit-projection.test.ts`
Expected: the new "extra payments" cases fail (extra arg ignored / map not applied).

- [ ] **Step 3: Implement**

Overwrite `src/utils/credit-projection.ts`:
```ts
import { addMonths, differenceInCalendarMonths, startOfMonth } from "date-fns";

export type CreditProjectionInput = {
  balance: number;        // Saldo Actual at Fecha Saldo
  monthlyPayment: number;
  interestRate: number;   // percent, e.g. 2 = 2%
  balanceDateMs: number;  // Fecha Saldo (ms)
};

/**
 * Roll a credit balance from its Fecha Saldo month to the target month.
 * Month event m (starting at the Fecha Saldo month): interest accrues, then the
 * monthly payment and any extra payments dated in month m are applied (clamp 0).
 * Because iteration starts at the Fecha Saldo month, extra payments dated earlier
 * are never applied. Pure and deterministic.
 * @param extraPaymentsByMonth start-of-month ms -> total extra payment that month
 */
export function projectCreditBalance(
  input: CreditProjectionInput,
  targetMonthMs: number,
  extraPaymentsByMonth?: Map<number, number>
): number {
  const startMonth = startOfMonth(input.balanceDateMs);
  const months = differenceInCalendarMonths(startOfMonth(targetMonthMs), startMonth);
  if (months <= 0) return input.balance;

  const rate = input.interestRate / 100;
  let balance = input.balance;
  for (let i = 0; i < months; i++) {
    const monthMs = startOfMonth(addMonths(startMonth, i)).getTime();
    const extra = extraPaymentsByMonth?.get(monthMs) ?? 0;
    balance = Math.max(0, balance + balance * rate - input.monthlyPayment - extra);
  }
  return balance;
}
```

- [ ] **Step 4: Run, expect PASS** (all credit-projection tests, including sub-project 1's)

Run: `npm run test:run -- src/utils/credit-projection.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** (skip unless asked)
```bash
git add src/utils/credit-projection.ts src/utils/credit-projection.test.ts && git commit -m "feat: projectCreditBalance supports per-month extra payments"
```

---

## Task 3: `credit-flow.ts` util (TDD)

**Files:** Create `src/utils/credit-flow.ts`, `src/utils/credit-flow.test.ts`

- [ ] **Step 1: Write failing tests** — create `src/utils/credit-flow.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { buildExtraPaymentsByMonth, creditBalanceAfterPayment } from "./credit-flow";

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
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/utils/credit-flow.test.ts`
Expected: FAIL — cannot resolve `./credit-flow`.

- [ ] **Step 3: Implement** — create `src/utils/credit-flow.ts`:
```ts
import { addMonths, startOfMonth } from "date-fns";
import { projectCreditBalance, type CreditProjectionInput } from "./credit-projection";

export type FlowPayment = { date: number; amount: number };

/** Sum CREDIT_FLOW payment amounts by start-of-month (ms). */
export function buildExtraPaymentsByMonth(payments: FlowPayment[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of payments) {
    const key = startOfMonth(p.date).getTime();
    map.set(key, (map.get(key) ?? 0) + p.amount);
  }
  return map;
}

/**
 * A credit's balance at the END of `paymentMonthMs` (start of the next month),
 * applying all flow payments for that credit (payments after the row's month are
 * naturally excluded because the projection stops at paymentMonth+1).
 */
export function creditBalanceAfterPayment(
  credit: CreditProjectionInput,
  payments: FlowPayment[],
  paymentMonthMs: number
): number {
  const extra = buildExtraPaymentsByMonth(payments);
  const target = startOfMonth(addMonths(startOfMonth(paymentMonthMs), 1)).getTime();
  return projectCreditBalance(credit, target, extra);
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/utils/credit-flow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** (skip unless asked)
```bash
git add src/utils/credit-flow.ts src/utils/credit-flow.test.ts && git commit -m "feat: add credit-flow projection helpers"
```

---

## Task 4: CREDIT_FLOW record schema (TDD)

**Files:** Create `src/form-schemas/new-credit-flow-record.schema.ts`, `...schema.test.ts`

- [ ] **Step 1: Write failing tests** — create `src/form-schemas/new-credit-flow-record.schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { newCreditFlowRecordSchema } from "./new-credit-flow-record.schema";

const thisMonth = startOfMonth(new Date()).getTime();
const valid = { date: thisMonth, creditRecordId: 1, amount: 500 };

describe("newCreditFlowRecordSchema", () => {
  it("accepts a valid current-month payment", () => {
    expect(newCreditFlowRecordSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a date before the current month", () => {
    expect(newCreditFlowRecordSchema.safeParse({ ...valid, date: thisMonth - 1 }).success).toBe(false);
  });
  it("rejects a missing creditRecordId", () => {
    expect(newCreditFlowRecordSchema.safeParse({ date: thisMonth, amount: 500 }).success).toBe(false);
  });
  it("rejects a non-positive amount", () => {
    expect(newCreditFlowRecordSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/form-schemas/new-credit-flow-record.schema.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement** — create `src/form-schemas/new-credit-flow-record.schema.ts`:
```ts
import { z } from "zod";
import { startOfMonth } from "date-fns";

export const newCreditFlowRecordSchema = z.object({
  date: z.number().refine((date) => date >= startOfMonth(new Date()).getTime(), {
    message: "La fecha no puede ser anterior al mes actual.",
  }),
  creditRecordId: z.number(),
  amount: z.number().min(1),
});
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/form-schemas/new-credit-flow-record.schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** (skip unless asked)
```bash
git add src/form-schemas/new-credit-flow-record.schema.ts src/form-schemas/new-credit-flow-record.schema.test.ts && git commit -m "feat: add CREDIT_FLOW record schema"
```

---

## Task 5: `getPlanCreditRecords` server action

**Files:** Modify `src/app/actions/reports/plan-reports.ts`

- [ ] **Step 1: Add the action**

At the top, ensure `serializeRecord` is imported:
```ts
import { serializeRecord } from "@/utils/serialize-record";
```
Append the action at the end of the file:
```ts
/**
 * Server action: the CREDIT records for a plan (from its single CREDIT sheet),
 * with BigInt `date` serialized to number for the client.
 */
export async function getPlanCreditRecords(planId: string) {
  const id = parseInt(planId, 10);
  if (isNaN(id)) {
    throw new Error(`Invalid planId: ${planId}`);
  }
  const records = await prisma.record.findMany({
    where: { sheet: { planId: id, sheetType: "CREDIT" } },
  });
  return records.map(serializeRecord);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean for this file (CREDIT_FLOW/creditRecordId errors may exist elsewhere until later tasks; this file should not add new errors).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add src/app/actions/reports/plan-reports.ts && git commit -m "feat: getPlanCreditRecords server action"
```

---

## Task 6: Record POST route persists `creditRecordId`

**Files:** Modify `src/app/api/record/route.ts`

- [ ] **Step 1: Destructure + persist**

In the `POST` handler, add `creditRecordId` to the destructured body (after `otherCosts,`):
```ts
    otherCosts,
    creditRecordId,
```
And to the `prisma.record.create` data (after `otherCosts,`):
```ts
        otherCosts,
        creditRecordId,
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (assumes Task 1 migration generated the client).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add src/app/api/record/route.ts && git commit -m "feat: persist creditRecordId on record creation"
```

---

## Task 7: `credits` selector through `SheetGrid` + `GridCellEdit`, and `rowClassName`

**Files:** Modify `src/components/custom/grid/grid-cell-edit.tsx`, `src/components/custom/sheet-grid.tsx`

- [ ] **Step 1: `GridCellEdit` — accept `credits` and render a selector for `creditRecordId`**

In `src/components/custom/grid/grid-cell-edit.tsx`:

Add `credits` to the props type:
```tsx
type GridCellEditProps<TData, TValue> = {
    column: ColumnDef<TData, TValue>
    value: unknown
    tags?: Tag[]
    buckets?: Bucket[]
    credits?: { id: number; name: string }[]
    accessor: string
    onChange: (value: unknown) => void
    minDate?: Date
}
```
Add `credits` to the destructured params:
```tsx
export const GridCellEdit = <TData, TValue>({ column, value, tags, buckets, credits, accessor, onChange, minDate }: GridCellEditProps<TData, TValue>) => {
```
Add a `creditOptions` memo near `tagsOptions`/`bucketOptions`:
```tsx
    const creditOptions = useMemo(() => {
        return credits?.map(({ name, id }) => ({
            value: id,
            label: name
        })) || []
    }, [credits])
```
In `handleChange`, include `creditRecordId` in the parseInt branch:
```tsx
        } else if (accessor === "tagId" || accessor === "bucketId" || accessor === "creditRecordId") {
            onChange(parseInt(value as string, 10))
```
Add a render branch (place it next to the `bucketId` branch):
```tsx
    if (accessor === "creditRecordId" && creditOptions) {
        return <InputSelect
            value={value != null ? String(value) : null}
            options={creditOptions}
            onChange={handleChange}
            placeholder={String(
                column.header
            )} />
    }
```

- [ ] **Step 2: `SheetGrid` — thread `credits` and add `rowClassName`**

In `src/components/custom/sheet-grid.tsx`:

Add to the props interface:
```tsx
    minDate?: Date
    credits?: { id: number; name: string }[]
    rowClassName?: (row: TData) => string
```
Add to the destructured params (after `minDate,`):
```tsx
    minDate,
    credits,
    rowClassName,
```
Pass `credits` to BOTH `GridCellEdit` usages (edit-row and add-row), adding `credits={credits}` next to the existing `minDate={minDate}` on each.

Apply `rowClassName` to the data row. Replace the data-row `<TableRow ...>` className:
```tsx
                            className={onRowUpdate && getRowId ? "cursor-pointer hover:bg-muted/50" : ""}
```
with:
```tsx
                            className={`${onRowUpdate && getRowId ? "cursor-pointer hover:bg-muted/50" : ""} ${rowClassName?.(row.original) ?? ""}`.trim()}
```

- [ ] **Step 3: Type-check + existing grid tests**

Run: `npx tsc --noEmit && npm run test:run -- src/components/custom/grid/grid-cell-edit.test.tsx`
Expected: PASS — new props optional, existing tests unaffected.

- [ ] **Step 4: Commit** (skip unless asked)
```bash
git add src/components/custom/grid/grid-cell-edit.tsx src/components/custom/sheet-grid.tsx && git commit -m "feat: credit selector + rowClassName in grid"
```

---

## Task 8: Sheet-type label + routing for CREDIT_FLOW

**Files:** Modify `src/components/custom/sheet-type-badge.tsx`, `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/sheetContent.tsx`

- [ ] **Step 1: Badge label**

In `src/components/custom/sheet-type-badge.tsx`, add to `sheetTypeMap`:
```tsx
    "CREDIT": "Credito",
    "CREDIT_FLOW": "Flujo de Credito",
```

- [ ] **Step 2: Route the sheet**

In `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/sheetContent.tsx`, add the import:
```tsx
import CreditFlowSheet from "./creditFlowSheet";
```
And the conditional render (after the CREDIT line):
```tsx
        {sheet.sheetType === "CREDIT_FLOW" && <CreditFlowSheet sheetId={sheetId} />}
```

- [ ] **Step 3: Type-check** — `npx tsc --noEmit` (will error until Task 11 creates `creditFlowSheet`; that's expected). Verify the badge map is exhaustive (no TS error on `sheetTypeMap` after the migration adds the enum value).

- [ ] **Step 4: Commit** (skip unless asked)
```bash
git add src/components/custom/sheet-type-badge.tsx "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/sheetContent.tsx" && git commit -m "feat: CREDIT_FLOW badge + routing"
```

---

## Task 9: One-per-plan enforcement in `POST /api/sheet`

**Files:** Modify `src/app/api/sheet/route.ts`

- [ ] **Step 1: Add the guards before create**

Replace the `POST` handler body with:
```ts
export async function POST(request: Request) {
  const { name, sheetType, planId } = await request.json();
  try {
    if (sheetType === "CREDIT") {
      const existing = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT" } });
      if (existing > 0) {
        return NextResponse.json(
          { error: "Solo se puede crear una hoja de Crédito por plan." },
          { status: 400 }
        );
      }
    }
    if (sheetType === "CREDIT_FLOW") {
      const credits = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT" } });
      if (credits === 0) {
        return NextResponse.json(
          { error: "Primero debes crear una hoja de Crédito." },
          { status: 400 }
        );
      }
      const existingFlow = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT_FLOW" } });
      if (existingFlow > 0) {
        return NextResponse.json(
          { error: "Ya existe una hoja de Flujo de Crédito." },
          { status: 400 }
        );
      }
    }
    const newSheet = await prisma.sheet.create({
      data: {
        name,
        sheetType,
        planId,
      },
    });
    return NextResponse.json(newSheet);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}
```

- [ ] **Step 2: Type-check** — `npx tsc --noEmit` (clean for this file).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add src/app/api/sheet/route.ts && git commit -m "feat: enforce one CREDIT and one dependent CREDIT_FLOW per plan"
```

---

## Task 10: Create-sheet option + gating messages

**Files:** Modify `src/app/(main)/plan/[planId]/new-sheet/components/newSheetForm.tsx`

- [ ] **Step 1: Add the option, sheet awareness, and messages**

Overwrite `src/app/(main)/plan/[planId]/new-sheet/components/newSheetForm.tsx` with:
```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { newSheetFormSchema } from "@/form-schemas/new-sheet-form.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useMutateSheetQuery, useSheetQuery } from "@/queries/sheet.queries"
import { EnumSheetType } from "@prisma/client"
import { useRouter } from "next/navigation"

type NewSheetFormProps = {
    planId: string
}

export default function NewSheetForm({
    planId }: NewSheetFormProps) {
    const router = useRouter()
    const { mutate } = useMutateSheetQuery()
    const { data: sheets } = useSheetQuery(planId)
    const hasCredit = !!sheets?.some((s) => s.sheetType === "CREDIT")
    const hasCreditFlow = !!sheets?.some((s) => s.sheetType === "CREDIT_FLOW")

    const form = useForm<z.infer<typeof newSheetFormSchema>>({
        resolver: zodResolver(newSheetFormSchema),
        defaultValues: {
            name: "",
            sheetType: "",
        },
    })

    const selectedType = form.watch("sheetType")

    // Reason the selected type cannot be created right now (null = allowed).
    const blockedReason =
        selectedType === "CREDIT" && hasCredit
            ? "Ya existe una hoja de Crédito; no se puede crear otra."
            : selectedType === "CREDIT_FLOW" && !hasCredit
            ? "Primero debes crear una hoja de Crédito."
            : selectedType === "CREDIT_FLOW" && hasCreditFlow
            ? "Ya existe una hoja de Flujo de Crédito."
            : null

    async function onSubmit(values: z.infer<typeof newSheetFormSchema>) {
        mutate({ ...values, planId: parseInt(planId as string), sheetType: values.sheetType as EnumSheetType }, {
            onSuccess: (sheet) => {
                router.push(`/plan/${planId}/sheet/${sheet.id}`)
            },
        })
    }
    return <Card>
        <CardHeader>
            <CardTitle>Crea una nueva hoja</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la hoja</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sheetType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de hoja</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el tipo de hoja" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="BUDGET">Presupuesto Mensual</SelectItem>
                                        <SelectItem value="CREDIT">Creditos</SelectItem>
                                        <SelectItem value="CREDIT_FLOW">Flujo de Credito</SelectItem>
                                        <SelectItem value="EXPENSE_FLOW">Flujo de gastos</SelectItem>
                                        <SelectItem value="INCOME">Ingresos Mensuales</SelectItem>
                                    </SelectContent>
                                </Select>
                                {selectedType === "CREDIT" && (
                                    <p className="text-sm text-muted-foreground">
                                        Solo se puede crear una hoja de Crédito por plan.
                                    </p>
                                )}
                                {blockedReason && (
                                    <p className="text-xs text-destructive">{blockedReason}</p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={!!blockedReason}>Crear</Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit`
Expected: clean for this file (CREDIT_FLOW is a valid enum value after Task 1).

- [ ] **Step 3: Commit** (skip unless asked)
```bash
git add "src/app/(main)/plan/[planId]/new-sheet/components/newSheetForm.tsx" && git commit -m "feat: CREDIT_FLOW option and create-sheet gating messages"
```

---

## Task 11: CREDIT_FLOW sheet wrapper + grid

**Files:** Create `creditFlowSheet.tsx`, `creditFlowSheetGrid.tsx` under `src/app/(main)/plan/[planId]/sheet/[sheetId]/components/`

- [ ] **Step 1: Wrapper** — create `creditFlowSheet.tsx`:
```tsx
"use client"

import { useEffect, useState } from "react";
import { useOneSheetQuery } from "@/queries/sheet.queries";
import { useRecordQuery } from "@/queries/record.queries";
import { getPlanCreditRecords } from "@/app/actions/reports/plan-reports";
import CreditFlowSheetGrid, { type CreditOption } from "./creditFlowSheetGrid";

type CreditFlowSheetProps = {
    sheetId: string;
}

export default function CreditFlowSheet({ sheetId }: CreditFlowSheetProps) {
    const { data: sheet } = useOneSheetQuery(sheetId);
    const { data: records } = useRecordQuery(sheetId);
    const [credits, setCredits] = useState<CreditOption[] | null>(null);

    useEffect(() => {
        if (!sheet) return;
        getPlanCreditRecords(String(sheet.planId)).then((creditRecords) => {
            setCredits(creditRecords.map((c) => ({
                id: c.id,
                name: c.name,
                currentBalance: c.currentBalance,
                monthlyPayment: c.monthlyPayment,
                interestRate: c.interestRate,
                date: c.date,
            })));
        });
    }, [sheet]);

    return <div className="container mx-auto py-10">
        {credits && <CreditFlowSheetGrid sheetId={sheetId} records={records || []} credits={credits} />}
    </div>
}
```

- [ ] **Step 2: Grid** — create `creditFlowSheetGrid.tsx`:
```tsx
"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newCreditFlowRecordSchema } from "@/form-schemas/new-credit-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { creditBalanceAfterPayment } from "@/utils/credit-flow";
import { zodResolver } from "@hookform/resolvers/zod";
import { Record as RecordModel } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export type CreditOption = {
    id: number;
    name: string;
    currentBalance: number | null;
    monthlyPayment: number | null;
    interestRate: number | null;
    date: number | null;
}

const defaultFormValues = {
    date: 0,
    creditRecordId: undefined,
    amount: 0,
}
type FormValues = z.infer<typeof newCreditFlowRecordSchema>

type CreditFlowSheetGridProps = {
    sheetId: string;
    records: RecordModel[];
    credits: CreditOption[];
}

export default function CreditFlowSheetGrid({ records, sheetId, credits }: CreditFlowSheetGridProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(newCreditFlowRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const monthStart = useMemo(() => startOfMonth(new Date()), [])
    const currentMonthMs = monthStart.getTime()

    const creditsById = useMemo(() => {
        const map = new Map<number, CreditOption>()
        for (const c of credits) map.set(c.id, c)
        return map
    }, [credits])

    const creditsDictionary = useMemo(() => credits.reduce((acc, c) => {
        acc[c.id] = c.name
        return acc
    }, {} as Record<string, string>), [credits])

    const creditOptions = useMemo(() => credits.map((c) => ({ id: c.id, name: c.name })), [credits])

    // All flow payments grouped by their credit, as { date, amount }.
    const paymentsByCreditId = useMemo(() => {
        const map = new Map<number, { date: number; amount: number }[]>()
        for (const r of records) {
            if (r.creditRecordId == null || r.date == null) continue
            const list = map.get(r.creditRecordId) ?? []
            list.push({ date: Number(r.date), amount: r.amount })
            map.set(r.creditRecordId, list)
        }
        return map
    }, [records])

    const projectionInputFor = (credit: CreditOption) => ({
        balance: credit.currentBalance ?? 0,
        monthlyPayment: credit.monthlyPayment ?? 0,
        interestRate: credit.interestRate ?? 0,
        balanceDateMs: credit.date ? Number(credit.date) : currentMonthMs,
    })

    const { currentRecords, pastRecords } = useMemo(() => {
        const current: RecordModel[] = []
        const past: RecordModel[] = []
        for (const record of records) {
            if (record.date != null && Number(record.date) < currentMonthMs) past.push(record)
            else current.push(record)
        }
        return { currentRecords: current, pastRecords: past }
    }, [records, currentMonthMs])

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.date) form.setValue("date", Number(row.date))
        if (row.creditRecordId) form.setValue("creditRecordId", row.creditRecordId)
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            sheetId: parseInt(sheetId),
            date: BigInt(data.date),
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    date: data.date ? BigInt(data.date) : undefined,
                    creditRecordId: data.creditRecordId,
                    amount: data.amount,
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const monthlyPaymentFor = (record: RecordModel) =>
        record.creditRecordId != null ? creditsById.get(record.creditRecordId)?.monthlyPayment ?? null : null

    const balanceAfterFor = (record: RecordModel) => {
        if (record.creditRecordId == null || record.date == null) return null
        const credit = creditsById.get(record.creditRecordId)
        if (!credit) return null
        const payments = paymentsByCreditId.get(record.creditRecordId) ?? []
        return creditBalanceAfterPayment(projectionInputFor(credit), payments, Number(record.date))
    }

    const isAfterFechaSaldo = (record: RecordModel) => {
        if (record.creditRecordId == null || record.date == null) return false
        const credit = creditsById.get(record.creditRecordId)
        if (!credit?.date) return false
        return Number(record.date) > Number(credit.date)
    }

    const columns: ColumnDef<RecordModel>[] = [
        {
            id: "date",
            accessorKey: "date",
            header: "Fecha",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "credit",
            accessorKey: "creditRecordId",
            header: "Credito",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={creditsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Monto",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "monthlyPayment",
            header: "Pago Mensual",
            cell: ({ row }) => <GridCellCurrency amount={monthlyPaymentFor(row.original)} />,
            enableSorting: false,
        },
        {
            id: "balanceAfter",
            header: "Saldo Despues",
            cell: ({ row }) => <GridCellCurrency amount={balanceAfterFor(row.original)} />,
            enableSorting: false,
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
                    <CardTitle>Flujo de Credito</CardTitle>
                </CardHeader>
                <CardContent>
                    <SheetGrid
                        columns={columns}
                        data={currentRecords}
                        credits={creditOptions}
                        onRowAdd={handleRowAdd}
                        onRowUpdate={handleRowUpdate}
                        onRowDelete={onDelete}
                        validationSchema={newCreditFlowRecordSchema}
                        getRowId={(row) => row.id}
                        minDate={monthStart}
                    />
                </CardContent>
            </Card>
            {pastRecords.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pagos Pasados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SheetGrid
                            columns={columns}
                            data={pastRecords}
                            rowClassName={(row) => isAfterFechaSaldo(row) ? "line-through opacity-60" : ""}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — compiled successfully. (`creditRecordId` exists on `RecordModel`; `CreditFlowSheet` resolves the Task 8 import.)

- [ ] **Step 4: Commit** (skip unless asked)
```bash
git add "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditFlowSheet.tsx" "src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditFlowSheetGrid.tsx" && git commit -m "feat: CREDIT_FLOW sheet grid with credit selector, computed balance, past table"
```

---

## Task 12: Full verification

**Files:** none

- [ ] **Step 1: Tests** — `npm run test:run` → all pass (prior + new credit-projection/credit-flow/schema cases).
- [ ] **Step 2: Lint** — `npm run lint` → 0 errors (pre-existing warnings OK).
- [ ] **Step 3: Build** — `npm run build` → compiled successfully.
- [ ] **Step 4: Manual smoke test** — `npm run dev`:
  1. On a plan with a CREDIT sheet, create-sheet: selecting CREDIT shows the "one per plan" note; if a CREDIT already exists, the destructive note shows and Crear is disabled.
  2. Selecting CREDIT_FLOW with no CREDIT sheet shows "Primero debes crear una hoja de Crédito" and disables Crear; with a CREDIT sheet it's allowed; once a CREDIT_FLOW exists, a second is blocked (note + server 400).
  3. In the CREDIT_FLOW sheet, add a payment: pick a credit, a current-or-future month, an amount → "Pago Mensual" shows that credit's monthly payment and "Saldo Despues" shows the projected balance through that month (lower than without the payment).
  4. A past payment (after it ages) appears in "Pagos Pasados"; those dated after the credit's Fecha Saldo render struck-through.
- [ ] **Step 5: Final commit** (skip unless asked)
```bash
git add -A && git commit -m "test: verify CREDIT_FLOW sheet end-to-end"
```

---

## Notes for the implementer

- **Rule A is implicit:** `projectCreditBalance` iterates from the Fecha Saldo month, so payments dated before it are never applied — no explicit filtering needed.
- **`amount` holds the payment** for CREDIT_FLOW records (no `monthlyPayment`/`additionalPayment` on these rows). The grid mirrors `expenseFlowSheetGrid`'s split/`minDate` pattern.
- **`getPlanCreditRecords` is a server action** called from the client wrapper via `.then(...)`; it returns records with `date` already serialized to a number.
- **Strike** is done with `rowClassName` on the read-only past `SheetGrid` (Tailwind `line-through`), comparing each payment's `date` to its credit's Fecha Saldo (`credit.date`).
- **`Record.amount` is non-null `Int`** in Prisma; CREDIT_FLOW always sends a positive `amount` (schema `min(1)`), so no `amount` defaulting needed on the route.
