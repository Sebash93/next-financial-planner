"use server";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";
import type { PlanFlowReport } from "@/utils/flow";

/**
 * Server action: month-aware report for a plan.
 * Returns month-invariant recurring totals, the plan's month range, and
 * EXPENSE_FLOW totals bucketed by month. Pure per-month math lives in
 * buildMonthlyFlow (src/utils/flow.ts).
 * @param planId - the ID of the plan to report on
 */
export async function getPlanFlowReport(planId: string): Promise<PlanFlowReport> {
  const id = parseInt(planId, 10);
  if (isNaN(id)) {
    throw new Error(`Invalid planId: ${planId}`);
  }

  const plan = await prisma.plan.findUnique({
    where: { id },
    select: { initialDate: true, endDate: true },
  });
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  const [budgetRes, incomeRes, creditPaymentRes, creditBalanceRes, expenseFlowRecords] =
    await Promise.all([
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "BUDGET" } },
      }),
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "INCOME" } },
      }),
      prisma.record.aggregate({
        _sum: { monthlyPayment: true, additionalPayment: true },
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.aggregate({
        _sum: { currentBalance: true },
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "EXPENSE_FLOW" }, date: { not: null } },
        select: { date: true, amount: true },
      }),
    ]);

  const recurring = {
    incomeTotal: incomeRes._sum?.amount ?? 0,
    budgetTotal: budgetRes._sum?.amount ?? 0,
    creditPaymentTotal:
      (creditPaymentRes._sum?.monthlyPayment ?? 0) + (creditPaymentRes._sum?.additionalPayment ?? 0),
    creditBalanceTotal: creditBalanceRes._sum?.currentBalance ?? 0,
  };

  // Plan dates are stored as epoch SECONDS; convert to ms before use.
  const range = {
    startMonth: startOfMonth(plan.initialDate * 1000).getTime(),
    endMonth: startOfMonth(plan.endDate * 1000).getTime(),
  };

  // EXPENSE_FLOW date is epoch MILLISECONDS (BigInt). Bucket by start-of-month.
  const byMonth = new Map<number, number>();
  for (const rec of expenseFlowRecords) {
    if (rec.date == null) continue;
    const key = startOfMonth(Number(rec.date)).getTime();
    byMonth.set(key, (byMonth.get(key) ?? 0) + rec.amount);
  }
  const expenseFlowByMonth = Array.from(byMonth, ([month, total]) => ({ month, total }));

  return { recurring, range, expenseFlowByMonth };
}

/**
 * Server action: get total amounts per Bucket for a plan.
 * Aggregates the sum of all record amounts, grouped by bucket, for records in this plan.
 * @param planId - the ID of the plan to report on
 * @returns an array of objects with bucketId, bucketName, and total amount
 */
export async function getPlanBucketTotals(
  planId: string
): Promise<Array<{ bucketId: number; bucketName: string; total: number }>> {
  // Parse and validate planId
  const id = parseInt(planId, 10);
  if (isNaN(id)) {
    throw new Error(`Invalid planId: ${planId}`);
  }
  // Group records by bucketId for this plan's sheets
  const groups = await prisma.record.groupBy({
    by: ['bucketId'],
    where: {
      sheet: { planId: id },
      bucketId: { not: null },
    },
    _sum: { amount: true },
  });
  // Extract bucket IDs
  const bucketIds = groups.map(g => g.bucketId!).filter(Boolean) as number[];
  // Fetch bucket names
  const buckets = await prisma.bucket.findMany({
    where: { id: { in: bucketIds } },
    select: { id: true, name: true },
  });
  const nameMap = buckets.reduce<Record<number, string>>((acc, b) => {
    acc[b.id] = b.name;
    return acc;
  }, {});
  // Assemble results
  return groups.map(g => ({
    bucketId: g.bucketId!,
    bucketName: nameMap[g.bucketId!] ?? '',
    total: g._sum.amount ?? 0,
  }));
}
