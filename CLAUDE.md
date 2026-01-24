# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm test         # Run tests in watch mode
npm run test:run # Run tests once
npx prisma db push          # Push schema changes to SQLite database
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma studio           # Open Prisma Studio to browse database
```

## Architecture

This is a Next.js 15 financial planning application using the App Router with a SQLite database via Prisma.

### Data Model

The core entities are defined in `prisma/schema.prisma`:
- **Plan**: A financial plan with a date range containing multiple sheets
- **Sheet**: A categorized view within a plan (types: BUDGET, EXPENSE_FLOW, INCOME, CREDIT)
- **Record**: Individual financial entries with amount, optional date, bucket, and tag
- **Bucket**: Categories for organizing records across plans
- **Tag**: Sheet-specific labels with colors for records

### Code Organization

**`src/app/(main)/`** - Main application routes using route groups:
- `plan/[planId]/` - Plan detail and sheet management
- `plan/[planId]/sheet/[sheetId]/` - Sheet views with type-specific grids (budget, expense flow, income)
- `bucket/`, `report/`, `tools/` - Supporting features

**`src/app/api/`** - REST API routes for CRUD operations on plan, sheet, record, bucket, and tag entities

**`src/queries/`** - TanStack Query hooks following naming convention:
- `use[Entity]Query` - Fetch queries
- `useMutate[Entity]Query` - Create mutations
- `useUpdate[Entity]Query` - Update mutations
- `useDelete[Entity]Query` - Delete mutations
- Each file exports query keys (e.g., `PLAN_QUERY_KEY`) for cache invalidation

**`src/components/`**:
- `ui/` - shadcn/ui components (Radix-based)
- `custom/` - Application-specific components including charts (Recharts) and grid cells

**`src/form-schemas/`** - Zod validation schemas for forms

**`src/providers/`** - React Query provider setup with devtools in development

### Key Patterns

- Path alias `@/*` maps to `./src/*`
- Forms use react-hook-form with Zod resolvers
- API routes return `NextResponse.json()` and use Prisma client from `@/lib/prisma`
- Query invalidation happens automatically in mutation `onSuccess` callbacks
- Sheet types determine which grid component renders (budgetGrid, incomeSheetGrid, expenseFlowSheetGrid, creditSheetGrid)

### Testing

Uses **Vitest + React Testing Library**. See `docs/TESTING.md` for full strategy.

- **Priority 1**: Utility functions (`src/utils/`) - pure functions, easy to test
- **Priority 2**: Custom UI components (`src/components/custom/`) - inputs, grid cells, displays
- **Target coverage**: 50-60%
- Place tests next to source files: `component.tsx` → `component.test.tsx`
