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

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
