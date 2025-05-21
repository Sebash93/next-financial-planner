import { Bucket, Record } from "@prisma/client";

export const accountsTotalsReport = (records: Record[], buckets: Bucket[]) => {
  const accounts = records.reduce((acc, record) => {
    if (!record.bucketId) return acc; // Skip records without an account
    const account = acc.find((account) => account.id === record.bucketId);
    if (account) {
      account.total += record.amount;
    } else {
      acc.push({ id: record.bucketId, total: record.amount });
    }
    return acc;
  }, [] as Omit<{ id: number; total: number }, "percentage">[]);

  const total = accounts.reduce((acc, account) => acc + account.total, 0);

  return accounts.map((account) => ({
    id: account.id,
    name: buckets.find((bucket) => bucket.id === account.id)?.name || "Sin cuenta",
    total: account.total,
    percentage: (account.total / total) * 100,
  }));
};
