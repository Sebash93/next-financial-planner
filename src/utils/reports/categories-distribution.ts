import { RecordModel } from "@/models/record";

interface CategoryDistribution {
  name: string;
  total: number;
  percentage: number;
}

export const categoriesDistributionReport = (records: RecordModel[]) => {
  const categories = records.reduce((acc, record) => {
    const category = acc.find((category) => category.name === record.category);
    if (category) {
      category.total += record.value;
    } else {
      acc.push({ name: record.category, total: record.value });
    }
    return acc;
  }, [] as Omit<CategoryDistribution, "percentage">[]);

  const total = categories.reduce((acc, category) => acc + category.total, 0);

  return categories.map((category) => ({
    name: category.name,
    total: category.total,
    percentage: (category.total / total) * 100,
  }));
};
