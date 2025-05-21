import { categoriesDistributionReport } from "@/utils/reports/categories-distribution";
import PieChart from "./pie-chart"
import { Record, Tag } from "@prisma/client";
import { useMemo } from "react";

type BudgetTagDistributionProps = {
    records: Record[]
    tags: Tag[]
}

export const BudgetTagDistribution = ({ records, tags }: BudgetTagDistributionProps) => {
    const pieChartData = useMemo(() => categoriesDistributionReport(records, tags), [records, tags]);
    return <PieChart title="Categorías" description="Distribución del presupuesto por categorías" data={pieChartData} dataLabel="name" dataKey="percentage" />
}