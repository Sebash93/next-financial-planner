import { RecordModel } from "@/models/record";

export const accountsTotalsReport = (records: RecordModel[]) => {
  const accounts = records.reduce((acc, record) => {
    if (!record.account) return acc; // Skip records without an account
    const account = acc.find((account) => account.name === record.account);
    if (account) {
      account.total += record.value;
    } else {
      acc.push({ name: record.account, total: record.value });
    }
    return acc;
  }, [] as Omit<{ name: string; total: number }, "percentage">[]);

  const total = accounts.reduce((acc, account) => acc + account.total, 0);

  return accounts.map((account) => ({
    name: account.name,
    total: account.total,
    percentage: (account.total / total) * 100,
  }));
};
