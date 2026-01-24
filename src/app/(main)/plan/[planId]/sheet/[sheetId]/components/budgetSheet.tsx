"use client"

import BudgetGrid from "./budgetGrid";
import { BudgetTags } from "./budgetTags";
import { useTagQuery } from "@/queries/tag.queries";
import { useBucketQuery } from "@/queries/bucket.queries";
import { useRecordQuery } from "@/queries/record.queries";
import { OverAllTotals } from "@/components/custom/charts/overall-totals";
import { BudgetTagDistribution } from "@/components/custom/charts/budget-tag-distribution";
import { BudgetBucketDistribution } from "@/components/custom/charts/budget-bucket-distribution";
import { useMemo } from "react";

type BudgetSheetProps = {
    sheetId: string;
}

export default function BudgetSheet({ sheetId }: BudgetSheetProps) {
    const { data: tags } = useTagQuery(sheetId);
    const { data: buckets } = useBucketQuery(sheetId);
    const { data: records } = useRecordQuery(sheetId);

    const allDataLoaded = tags && buckets && records;

    // Calculate totals from records
    const { total } = useMemo(() => {
        if (!records) return { total: 0 };

        const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
        // Assuming positive amounts are income

        return { total: totalAmount };
    }, [records]);

    return <div className="container mx-auto py-10">
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                {allDataLoaded &&
                    <BudgetGrid sheetId={sheetId} records={records} tags={tags} buckets={buckets} />}
            </div>
            <div className="col-span-1 space-y-4">
                <OverAllTotals total={total} />
                {tags && records && <BudgetTagDistribution records={records} tags={tags} />}
                {tags && records && <BudgetTags records={records} tags={tags} sheetId={sheetId} />}
                {buckets && records && <BudgetBucketDistribution records={records} buckets={buckets} />}
            </div>
        </div>
    </div>
}