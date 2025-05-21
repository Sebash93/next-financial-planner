import { Record } from "@prisma/client";

export const budgetGrandTotals = (budgetRecords: Record[], incomeRecords: Record[]) => {
  const budgetTotal = budgetRecords.reduce((acc, record) => acc + record.amount, 0);
  const incomeTotal = incomeRecords.reduce((acc, record) => acc + record.amount, 0);
  return {
    budgetTotal,
    incomeTotal,
    difference: incomeTotal - budgetTotal,
  };
};
