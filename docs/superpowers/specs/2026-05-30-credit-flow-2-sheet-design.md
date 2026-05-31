# CREDIT_FLOW — Sub-project 2: CREDIT_FLOW Sheet

**Date:** 2026-05-30
**Status:** Approved design
**Part of:** CREDIT_FLOW feature (#2 of 3). Builds on sub-project 1 (Fecha Saldo + `projectCreditBalance`).
**Next:** #3 Plan-page integration (monthly debt, fold extra payments + `otherCosts` into totals, switch `plan-reports.ts` off `additionalPayment`, Credit View chart).

## Context

Sub-project 1 gave each CREDIT record a "Fecha Saldo" and a pure `projectCreditBalance` util. This
sub-project adds a new **CREDIT_FLOW** sheet type for logging extra (additional) payments against a
specific credit, month by month — mirroring the EXPENSE_FLOW UX. Each payment reduces the linked
credit's projected balance as additional principal. The plan-level rollup stays in sub-project 3.

### Decisions captured during brainstorming
- **Only flow payments on/after the credit's Fecha Saldo reduce the balance** (earlier ones are
  already baked into the entered `Saldo Actual`; ignored by the math). This falls out naturally:
  the projection iterates from Fecha Saldo forward, so payments in earlier months are never applied.
- **One CREDIT sheet per plan; one CREDIT_FLOW per plan, and CREDIT_FLOW requires an existing
  CREDIT sheet.** Enforced server-side and surfaced as create-sheet messages.
- **CREDIT_FLOW payment dates mirror EXPENSE_FLOW:** cannot be before the current month. Main table
  = current-month-onward; read-only **"Pagos Pasados"** table for aged payments.
- **Strike rule:** in the past table, payments dated **after** their credit's Fecha Saldo render
  struck-through (they are the ones actually applied to the running balance — marked as historical).
- Payment amount stored in **`Record.amount`**; link via **self-relation `creditRecordId`**;
  `onDelete: Cascade` (a payment is meaningless without its credit).
- Computed columns labeled **"Pago Mensual"** and **"Saldo Después"**.

## Data model notes
- `Record.date` epoch **ms** (`BigInt?`) — payment month (also Fecha Saldo on CREDIT records).
- `Record.amount` `Int` — CREDIT_FLOW payment amount (the additional payment).
- `Record.interestRate` `Float?` — percent. Monetary fields `Int?`.
- "Current month" = `startOfMonth(new Date())`.

## Changes

### 1. Prisma migration (run by repo owner)
File: [prisma/schema.prisma](../../../prisma/schema.prisma)
- Add `CREDIT_FLOW` to `enum EnumSheetType`.
- Add to `Record`:
  ```prisma
  creditRecordId     Int?
  creditRecord       Record?  @relation("CreditFlowPayments", fields: [creditRecordId], references: [id], onDelete: Cascade)
  creditFlowPayments Record[] @relation("CreditFlowPayments")
  ```
- `npx prisma migrate dev` + `npx prisma generate`.

### 2. Projection extension (pure, tested)
File: [src/utils/credit-projection.ts](../../../src/utils/credit-projection.ts)
- New optional 3rd param:
  `projectCreditBalance(input, targetMonthMs, extraPaymentsByMonth?: Map<number, number>)`.
- Each iterated month: `balance = max(0, balance + balance*rate − monthlyPayment − (extraPaymentsByMonth.get(monthStartMs) ?? 0))`.
- Map keys are start-of-month ms. Backward-compatible (existing 2-arg calls unaffected).
- New tests: extra payment in a single month reduces that month onward; a payment dated before
  Fecha Saldo (outside the iterated range) has no effect; multiple payments compound.

### 3. CREDIT_FLOW calculation glue (pure, tested)
File: `src/utils/credit-flow.ts` (new)
- `buildExtraPaymentsByMonth(payments: { date: number; amount: number }[]): Map<number, number>` —
  sum `amount` by `startOfMonth(date)` ms.
- `creditBalanceAfterPayment(credit, payments, paymentMonthMs)` — `projectCreditBalance` for `credit`
  to `paymentMonthMs` using the extra-payments map built from `payments` filtered to months
  **≤ paymentMonthMs**. Returns the credit's balance at the end of that payment's month. Used by the
  grid's "Saldo Después" column.
- Tests cover: single payment month balance; cumulative across months; payment before Fecha Saldo ignored.

### 4. Sheet-type plumbing (enum value)
- [new-sheet-form.schema.ts](../../../src/form-schemas/new-sheet-form.schema.ts): enum auto-derives from
  `EnumSheetType`, so `CREDIT_FLOW` is included after the migration — no change needed beyond regen.
- [sheet-type-badge.tsx](../../../src/components/custom/sheet-type-badge.tsx): add `CREDIT_FLOW: "Flujo de Credito"`.
- [sheetContent.tsx](../../../src/app/(main)/plan/[planId]/sheet/[sheetId]/components/sheetContent.tsx): route
  `sheet.sheetType === "CREDIT_FLOW"` → `<CreditFlowSheet sheetId={sheetId} />`.

### 5. One-per-plan + gating
- **Server** [api/sheet/route.ts](../../../src/app/api/sheet/route.ts) POST: before create, count the plan's
  sheets by type. Reject (HTTP 400 `{ error }`) when:
  - `sheetType === "CREDIT"` and a CREDIT sheet already exists.
  - `sheetType === "CREDIT_FLOW"` and (no CREDIT sheet exists **or** a CREDIT_FLOW already exists).
- **Create-sheet form** [newSheetForm.tsx](../../../src/app/(main)/plan/[planId]/new-sheet/components/newSheetForm.tsx):
  - Add `<SelectItem value="CREDIT_FLOW">Flujo de Credito</SelectItem>`.
  - With `useSheetQuery(planId)`, derive `hasCredit` / `hasCreditFlow`. Below the type field show a
    contextual note based on the selected type:
    - CREDIT → "Solo se puede crear una hoja de Crédito por plan." If `hasCredit`: a smaller muted
      note "Ya existe una hoja de Crédito; no se puede crear otra." and disable submit.
    - CREDIT_FLOW → if `!hasCredit`: "Primero debes crear una hoja de Crédito." and disable submit;
      else if `hasCreditFlow`: smaller muted note "Ya existe una hoja de Flujo de Crédito." and disable submit.

### 6. Fetch the plan's credits (server action)
File: [src/app/actions/reports/plan-reports.ts](../../../src/app/actions/reports/plan-reports.ts) (or a new
`credit-actions.ts`) — `getPlanCreditRecords(planId)`: find the plan's `CREDIT` sheet and return its
records mapped through the existing `serializeRecord` (BigInt `date` → number) so the client receives
plain numbers. Return type is `ReturnType<typeof serializeRecord>[]`.

### 7. CREDIT_FLOW grid + wrapper
- **Wrapper** `creditFlowSheet.tsx` (new, client): `useRecordQuery(sheetId)` for payments;
  `useOneSheetQuery(sheetId)` → `planId`; fetch the plan's credits via `getPlanCreditRecords`
  (server action invoked through a small query/effect). Render the grid once both load.
- **Grid** `creditFlowSheetGrid.tsx` (new, mirrors `expenseFlowSheetGrid`):
  - `credits` prop (the plan's CREDIT records). Build a `creditsDictionary` (id→name) for display and
    `creditOptions` (`{value:id,label:name}`) for the selector.
  - Columns: **Fecha** (`date`, `GridCellMonth`) · **Crédito** (`creditRecordId`, dictionary display /
    `InputSelect` edit) · **Monto** (`amount`, currency) · **Pago Mensual** (computed: selected credit's
    `monthlyPayment`) · **Saldo Después** (computed: `creditBalanceAfterPayment`) · actions.
  - Split into `currentRecords` (date ≥ current month start, or no date) → main grid (add/edit/delete,
    `minDate` = current month) and `pastRecords` → read-only **"Pagos Pasados"** card. In the past
    table, a row whose `date > linkedCredit.date (Fecha Saldo)` renders struck-through (e.g. wrap the
    row cells / apply `line-through`).
  - `handleRowAdd`/`handleRowUpdate`: send `date: BigInt(...)`, `creditRecordId`, `amount`, `sheetId`.
- **Schema** `new-credit-flow-record.schema.ts` (new):
  `date: z.number().refine(d => d >= startOfMonth(new Date()).getTime(), { message: "La fecha no puede ser anterior al mes actual." })`,
  `creditRecordId: z.number()`, `amount: z.number().min(1)`.
- **GridCellEdit** [grid-cell-edit.tsx](../../../src/components/custom/grid/grid-cell-edit.tsx): for accessor
  `creditRecordId`, render `InputSelect` from a new optional `credits?: { id: number; name: string }[]`
  prop (parseInt on change, like `bucketId`). Thread `credits` through `SheetGrid`
  [sheet-grid.tsx](../../../src/components/custom/sheet-grid.tsx) (same pattern as `buckets`/`minDate`).
- **API** [api/record/route.ts](../../../src/app/api/record/route.ts): POST destructures + persists
  `creditRecordId`. PUT forwards body unchanged.

## Testing
- `src/utils/credit-projection.test.ts`: extend for `extraPaymentsByMonth` (applied in-range; pre-Fecha-Saldo ignored; compounding).
- `src/utils/credit-flow.test.ts` (new): `buildExtraPaymentsByMonth` grouping; `creditBalanceAfterPayment` for single/multi-month and pre-Fecha-Saldo-ignored.
- `src/form-schemas/new-credit-flow-record.schema.test.ts` (new): accepts current-month date; rejects earlier; requires `creditRecordId` and positive `amount`.
- Existing suite stays green; lint + build clean.

## Edge cases
- No credits in the plan yet → selector empty; CREDIT_FLOW creation is already blocked unless a CREDIT
  sheet exists, but a CREDIT sheet with zero records is possible → selector shows no options (acceptable).
- Payment's credit deleted → Cascade removes the payment.
- Legacy/0 Fecha Saldo on a credit → `projectCreditBalance` fallback (handled in sub-project 1 via the
  grid's `record.date ? ... : currentMonth`); the flow grid uses the same guard when projecting.
- A payment dated in the current month appears in the main table; it ages into the past table next month.

## Out of scope (→ sub-project 3)
- Plan-page monthly debt and folding `amount` (extra payments) + `otherCosts` into plan totals.
- Switching `plan-reports.ts` credit aggregation off `additionalPayment`.
- The Credit View line chart.
