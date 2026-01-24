# Testing Strategy

## Goals

1. **Ensure correctness** - Verify business logic and financial calculations work correctly
2. **Confidence to refactor** - Enable safe code improvements and restructuring

## Stack

- **Vitest** - Fast, ESM-native test runner
- **React Testing Library (RTL)** - Component testing with user-centric approach
- **@testing-library/jest-dom** - Custom DOM matchers

## What to Test

### Priority 1: Utility Functions
All utility functions should have unit tests. These are pure functions that are easy to test and critical for correctness.

**Location:** `src/utils/*.test.ts`

```typescript
// Example: src/utils/currencies.test.ts
import { describe, it, expect } from 'vitest'
import { numberToCurrency, currencyToNumber } from './currencies'

describe('numberToCurrency', () => {
  it('formats number as COP currency', () => {
    expect(numberToCurrency(1000)).toContain('1.000')
  })
})
```

**Test these utilities:**
- `currencies.tsx` - Currency formatting/parsing
- `dates.ts` - Date/timestamp conversions

### Priority 2: UI Components
Focus on custom components that handle user input or display formatted data.

**Location:** `src/components/custom/**/*.test.tsx`

```typescript
// Example: src/components/custom/grid/grid-cell-currency.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GridCellCurrency } from './grid-cell-currency'

describe('GridCellCurrency', () => {
  it('renders formatted currency', () => {
    render(<GridCellCurrency amount={1000} />)
    expect(screen.getByText(/1\.000/)).toBeInTheDocument()
  })

  it('handles null values', () => {
    render(<GridCellCurrency amount={null} />)
    expect(screen.getByText(/0/)).toBeInTheDocument()
  })
})
```

**Test these components:**
- Grid cell components (`grid-cell-currency`, `grid-cell-percentage`, `grid-cell-dictionary`)
- Input components (`input-currency`, `input-percentage`)
- Display components (`data-display`, `sheet-type-badge`)

### Priority 3: Form Schemas (Optional)
Zod schemas can be tested to ensure validation rules work correctly.

**Location:** `src/form-schemas/*.test.ts`

```typescript
// Example: src/form-schemas/new-credit-record.schema.test.ts
import { describe, it, expect } from 'vitest'
import { newCreditRecordFormSchema } from './new-credit-record.schema'

describe('newCreditRecordFormSchema', () => {
  it('validates correct data', () => {
    const result = newCreditRecordFormSchema.safeParse({
      name: 'Credit Card',
      currentBalance: 5000,
      monthlyPayment: 200,
      interestRate: 1.5,
      additionalPayment: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative balance', () => {
    const result = newCreditRecordFormSchema.safeParse({
      name: 'Test',
      currentBalance: -100,
      monthlyPayment: 200,
      interestRate: 1.5,
      additionalPayment: 0,
    })
    expect(result.success).toBe(false)
  })
})
```

## What NOT to Test

- **shadcn/ui components** - Already tested by the library
- **API routes** - Better suited for integration/E2E tests
- **Page components** - Complex dependencies, prefer E2E
- **Prisma queries** - Require database, use integration tests

## Coverage Target

**Target: 50-60% overall coverage**

Focus coverage on:
- `src/utils/` - 80%+ coverage
- `src/components/custom/` - 60%+ coverage
- `src/form-schemas/` - 50%+ coverage

## Commands

```bash
npm test              # Run tests in watch mode (development)
npm run test:run      # Run tests once (CI)
npm run test:coverage # Run with coverage report
```

## File Naming Convention

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- Place tests next to the file being tested

```
src/
├── utils/
│   ├── currencies.tsx
│   └── currencies.test.ts
├── components/
│   └── custom/
│       └── grid/
│           ├── grid-cell-currency.tsx
│           └── grid-cell-currency.test.tsx
```

## CI Integration

Tests run on every push but do not block merges. Coverage reports are generated for visibility.

```yaml
# Example GitHub Actions step
- name: Run tests
  run: npm run test:run
  continue-on-error: true  # Warn but don't block
```

## Writing Good Tests

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Use descriptive test names** - `it('renders formatted currency when amount is provided')`
3. **One assertion per test** - Makes failures easier to diagnose
4. **Arrange-Act-Assert** - Structure tests clearly
5. **Test edge cases** - Null, undefined, zero, negative numbers, empty strings
