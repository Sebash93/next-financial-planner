# CREDIT_FLOW — Sub-project 1: CREDIT Sheet Foundation

**Date:** 2026-05-30
**Status:** Approved design
**Part of:** CREDIT_FLOW feature (3 sub-projects). This is **#1 of 3** — the calculation foundation.
**Next:** #2 CREDIT_FLOW sheet (enum, one-credit-per-plan, flow grid, past table); #3 Plan-page integration (monthly extra payments, monthly debt, Credit View chart).

## Context

Today a CREDIT record stores `currentBalance`, `monthlyPayment`, `interestRate`, and
`additionalPayment`, and `amortization.ts` computes payoff insights starting from `new Date()`
applied to the raw balance. There's no notion of *when* the balance was accurate, and additional
payments are entered statically on the credit record.

We're building a CREDIT_FLOW feature where per-month extra payments live in their own sheet. This
sub-project lays the foundation: it records **when** a balance was measured ("Fecha Saldo"),
**projects** the balance forward to the current month, removes the static `additionalPayment` from
the CREDIT sheet (the flow will own that), and adds a recurring **"Otros Gastos"** cost.

### Decisions captured during brainstorming
- **Projection mechanic:** per month, interest accrues then the monthly payment applies:
  `next = max(0, balance + balance*(rate/100) − monthlyPayment)`. No recurring extra payment.
- **`additionalPayment` removed from the CREDIT sheet** (column, schema, amount calc). The Prisma
  field is **kept** for sub-project 2 (CREDIT_FLOW payments).
- **Fecha Saldo** stored by reusing `Record.date` (epoch ms). **Required** for new records; when a
  record's `date` is null (legacy), callers **fall back to today** as the origin (0 months elapsed).
- **CREDIT sheet shows a "Saldo a hoy"** column = balance projected from Fecha Saldo to the current
  month; all insights are computed from that projected balance (payoff date = current month + months).
- **"Otros Gastos"** = recurring insurance/admin cost. Stored as a new `otherCosts Int?` column
  (same approach as other monetary fields). Does **not** reduce the balance; reserved for the
  monthly-expense math in sub-project 3.
- Projection lives in a **separate pure util** `src/utils/credit-projection.ts`.

## Data model notes
- `Record.date` is epoch **milliseconds** (`BigInt?`). Reused as Fecha Saldo for CREDIT records.
- `Record.interestRate` is `Float?`, stored as a **percentage** (e.g. `2` = 2%/month).
- All monetary fields are `Int?`. New `otherCosts Int?` follows the same convention.
- "Current month" = `startOfMonth(new Date())`. Projection is month-granular.

## Changes

### 1. Prisma migration — add `otherCosts`
File: [prisma/schema.prisma](../../../prisma/schema.prisma)
- Add `otherCosts Int?` to the `Record` model (recurring insurance/admin cost).
- Run `npx prisma migrate` / `npx prisma generate`. No other schema change (Fecha Saldo reuses `date`;
  `additionalPayment` field remains).

### 2. Pure projection util — `src/utils/credit-projection.ts` (new)
```ts
export type CreditProjectionInput = {
  balance: number;        // Saldo Actual at Fecha Saldo
  monthlyPayment: number;
  interestRate: number;   // percent, e.g. 2 = 2%
  balanceDateMs: number;  // Fecha Saldo (ms)
};

// Roll the balance from its Fecha Saldo month to targetMonthMs (both normalized to start-of-month).
export function projectCreditBalance(input: CreditProjectionInput, targetMonthMs: number): number;
```
Logic: `monthsElapsed = differenceInCalendarMonths(startOfMonth(targetMonthMs), startOfMonth(balanceDateMs))`;
if `≤ 0` return `balance`. Else iterate `monthsElapsed` times:
`balance = Math.max(0, balance + balance * (interestRate / 100) − monthlyPayment)`.
Pure — no `new Date()`; deterministic and unit-testable.

### 3. Credit schema changes
File: [new-credit-record.schema.ts](../../../src/form-schemas/new-credit-record.schema.ts)
- Remove `additionalPayment`.
- Add `date: z.number()` (required — Fecha Saldo).
- Add `otherCosts: z.number().min(0).optional()`.
- Keep `name`, `bucketId`, `currentBalance`, `monthlyPayment`, `interestRate`.

### 4. CREDIT grid changes
File: [creditSheetGrid.tsx](../../../src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheetGrid.tsx)
- **Remove** the "Pago Adicional" column and its handling. Change the amount calc from
  `monthlyPayment + additionalPayment` → `monthlyPayment`.
- **Add "Fecha Saldo"** column (accessor `date`): displays via `GridCellMonth`, edits via the existing
  `DatePicker` (no `minDate` — past dates allowed). Include `date` in add/update, converting to `BigInt`
  (same pattern as EXPENSE_FLOW). New records require it (schema).
- **Add "Saldo a hoy"** read-only column: `projectCreditBalance({ balance: currentBalance,
  monthlyPayment, interestRate, balanceDateMs: record.date ?? currentMonthMs }, currentMonthMs)`, shown
  with `GridCellCurrency`. (`currentMonthMs = startOfMonth(new Date()).getTime()`.)
- **Add "Otros Gastos"** column (accessor `otherCosts`): `GridCellCurrency` display, `InputCurrency` edit;
  include in add/update.
- Final column order: Nombre · Cuenta · Fecha Saldo · Saldo Actual · Saldo a hoy · Pago Mensual ·
  Interés Mensual · Otros Gastos · Info · (acciones).

File: [grid-cell-edit.tsx](../../../src/components/custom/grid/grid-cell-edit.tsx)
- Add `"otherCosts"` to the `currencyAccessors` array so it edits with `InputCurrency`.

### 5. Insights refactor (project to current month)
Files: [amortization.ts](../../../src/utils/amortization.ts), [grid-cell-insights.tsx](../../../src/components/custom/grid/grid-cell-insights.tsx)
- Refactor `calculateCreditInsights` to a concrete signature
  `calculateCreditInsights(projectedBalance: number, monthlyPayment: number, interestRate: number, asOfMonthMs: number): CreditInsights`.
  It computes `monthlyInterest`/`monthsToPayoff` from `projectedBalance` and sets
  `payoffDate = addMonths(asOfMonthMs, monthsToPayoff)` (instead of `new Date()` applied to the raw
  balance). `additionalPayment` is dropped from its signature. The caller computes `projectedBalance`
  via `projectCreditBalance` and passes the current month as `asOfMonthMs`.
- `GridCellInsights` passes the current-month projected balance and current month; it no longer takes
  `additionalPayment`.
- Edge cases preserved: balance ≤ 0 → "Credito pagado"; payment ≤ interest → "El pago no cubre los
  intereses"; missing payment/rate → existing guidance message.

### 6. Wrapper / totals
File: [creditSheet.tsx](../../../src/app/(main)/plan/[planId]/sheet/[sheetId]/components/creditSheet.tsx)
- The `totalPayments` memo changes from `monthlyPayment + additionalPayment` → `monthlyPayment`
  (additional payments no longer live here). `totalBalance` unchanged. (Plan-level aggregation in
  `plan-reports.ts` is untouched in this sub-project — reworked in #3.)

## Testing
- New `src/utils/credit-projection.test.ts`:
  - 0 months elapsed (target ≤ Fecha Saldo) → returns entered balance.
  - Several months of interest + payment reduces balance correctly.
  - Balance reaches 0 and stays clamped at 0.
  - Payment < interest → balance grows.
  - Interest-free (rate 0) → linear paydown.
- Update `src/utils/amortization.test.ts` for the refactored `calculateCreditInsights` signature
  (no `additionalPayment`; insights derived from a provided balance + as-of month).
- Existing suite stays green; `npm run lint` and `npm run build` clean.

## Edge cases
- Fecha Saldo ≥ current month → "Saldo a hoy" equals the entered balance (0 months).
- Legacy CREDIT record with `date == null` → origin falls back to today → "Saldo a hoy" = entered balance.
- Balance hits 0 mid-projection → stays 0.
- Payment never covers interest → balance grows; insights show "El pago no cubre los intereses".

## Out of scope (this sub-project)
- The `CREDIT_FLOW` sheet type, its grid, the one-credit-per-plan constraint, and create-sheet
  messaging (sub-project 2).
- Per-month flow payments affecting the projection (sub-project 2 will feed extra payments into the
  same `projectCreditBalance`).
- Plan-page monthly debt, monthly-expense inclusion of `monthlyPayment + otherCosts`, and the Credit
  View chart (sub-project 3).
