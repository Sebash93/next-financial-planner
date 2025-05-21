import { Record, Tag } from "@prisma/client";

interface CategoryDistribution {
  id: number;
  total: number;
  percentage: number;
}

export const categoriesDistributionReport = (records: Record[], tags: Tag[]) => {
  const categories = records.reduce((acc, record) => {
    const category = acc.find((category) => category.id === record.tagId);
    if (category) {
      category.total += record.amount;
    } else if (record.tagId) {
      acc.push({ id: record.tagId, total: record.amount });
    }
    return acc;
  }, [] as Omit<CategoryDistribution, "percentage">[]);

  const total = categories.reduce((acc, category) => acc + category.total, 0);

  return categories.map((category) => ({
    id: category.id,
    name: tags.find((tag) => tag.id === category.id)?.name || "Sin categoría",
    total: category.total,
    percentage: (category.total / total) * 100,
  }));
};
