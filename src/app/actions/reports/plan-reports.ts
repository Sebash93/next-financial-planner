"use server";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";
import { clampMonthRange, type PlanFlowReport } from "@/utils/flow";
import { serializeRecord } from "@/utils/serialize-record";

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

  const [budgetRes, incomeRes, expenseFlowRecords, creditRecords, creditFlowRecords] =
    await Promise.all([
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "BUDGET" } },
      }),
      prisma.record.aggregate({
        _sum: { amount: true },
        where: { sheet: { planId: id, sheetType: "INCOME" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "EXPENSE_FLOW" }, date: { not: null } },
        select: { date: true, amount: true },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "CREDIT" } },
      }),
      prisma.record.findMany({
        where: { sheet: { planId: id, sheetType: "CREDIT_FLOW" }, date: { not: null }, creditRecordId: { not: null } },
        select: { creditRecordId: true, date: true, amount: true },
      }),
    ]);

  const recurring = {
    incomeTotal: incomeRes._sum?.amount ?? 0,
    budgetTotal: budgetRes._sum?.amount ?? 0,
  };

  const currentMonthMs = startOfMonth(Date.now()).getTime();
  const credits = creditRecords.map((c) => ({
    id: c.id,
    currentBalance: c.currentBalance ?? 0,
    monthlyPayment: c.monthlyPayment ?? 0,
    interestRate: c.interestRate ?? 0,
    otherCosts: c.otherCosts ?? 0,
    balanceDateMs: c.date != null ? Number(c.date) : currentMonthMs,
  }));

  const creditFlowPayments = creditFlowRecords
    .filter((r) => r.creditRecordId != null && r.date != null)
    .map((r) => ({ creditRecordId: r.creditRecordId as number, date: Number(r.date), amount: r.amount }));

  // Plan dates are stored as epoch SECONDS; convert to ms. Clamp the window
  // to start no earlier than the current month (forward-looking planning).
  const range = clampMonthRange(plan.initialDate * 1000, Date.now(), plan.endDate * 1000);

  // EXPENSE_FLOW date is epoch MILLISECONDS (BigInt). Bucket by start-of-month.
  const byMonth = new Map<number, number>();
  for (const rec of expenseFlowRecords) {
    if (rec.date == null) continue;
    const key = startOfMonth(Number(rec.date)).getTime();
    byMonth.set(key, (byMonth.get(key) ?? 0) + rec.amount);
  }
  const expenseFlowByMonth = Array.from(byMonth, ([month, total]) => ({ month, total }));

  return { recurring, range, expenseFlowByMonth, credits, creditFlowPayments };
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
