"use server";
import { prisma } from "@/lib/prisma";

type PlanReport = {
  budgetTotal: number;
  incomeTotal: number;
  creditPaymentTotal: number;
  creditBalanceTotal: number;
  total: number;
};

/**
 * Server action: get a report for a plan.
 * Aggregates the sum of all record amounts across all sheets in the plan,
 * grouped by sheet type (BUDGET, INCOME, CREDIT).
 * @param planId - the ID of the plan to report on
 * @returns an object containing budgetTotal, incomeTotal, creditPaymentTotal, creditBalanceTotal, and total
 */
export async function getPlanReport(planId: string): Promise<PlanReport> {
  // Parse and validate planId
  const id = parseInt(planId, 10);
  if (isNaN(id)) {
    throw new Error(`Invalid planId: ${planId}`);
  }
  // Sum amounts of records for BUDGET sheets
  const budgetRes = await prisma.record.aggregate({
    _sum: { amount: true },
    where: { sheet: { planId: id, sheetType: "BUDGET" } },
  });
  // Sum amounts of records for INCOME sheets
  const incomeRes = await prisma.record.aggregate({
    _sum: { amount: true },
    where: { sheet: { planId: id, sheetType: "INCOME" } },
  });
  // Sum payments (monthlyPayment + additionalPayment) for CREDIT sheets
  const creditPaymentRes = await prisma.record.aggregate({
    _sum: { monthlyPayment: true, additionalPayment: true },
    where: { sheet: { planId: id, sheetType: "CREDIT" } },
  });
  // Sum currentBalance for CREDIT sheets
  const creditBalanceRes = await prisma.record.aggregate({
    _sum: { currentBalance: true },
    where: { sheet: { planId: id, sheetType: "CREDIT" } },
  });
  const budgetTotal = budgetRes._sum?.amount ?? 0;
  const incomeTotal = incomeRes._sum?.amount ?? 0;
  const creditPaymentTotal = (creditPaymentRes._sum?.monthlyPayment ?? 0) + (creditPaymentRes._sum?.additionalPayment ?? 0);
  const creditBalanceTotal = creditBalanceRes._sum?.currentBalance ?? 0;
  const total = incomeTotal - budgetTotal - creditPaymentTotal;
  return { budgetTotal, incomeTotal, creditPaymentTotal, creditBalanceTotal, total };
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
