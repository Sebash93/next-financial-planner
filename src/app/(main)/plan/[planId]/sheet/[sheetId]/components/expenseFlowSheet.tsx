"use client"

import { useRecordQuery } from "@/queries/record.queries";
import { useBucketQuery } from "@/queries/bucket.queries";
import ExpenseFlowSheetGrid from "./expenseFlowSheetGrid";

type ExpenseFlowSheetProps = {
    sheetId: string;
}
export default function ExpenseFlowSheet({ sheetId }: ExpenseFlowSheetProps) {
    const { data: records } = useRecordQuery(sheetId)
    const { data: buckets } = useBucketQuery(sheetId)
    return <div className="container mx-auto py-10">
        {buckets && <ExpenseFlowSheetGrid sheetId={sheetId} records={records || []} buckets={buckets} />}
    </div>
}
