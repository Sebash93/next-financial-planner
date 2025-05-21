import { useRecordQuery } from "@/queries/record.queries";
import ExpenseFlowSheetGrid from "./expenseFlowSheetGrid";

type ExpenseFlowSheetProps = {
    sheetId: string;
}
export default function ExpenseFlowSheet({ sheetId }: ExpenseFlowSheetProps) {
    const { data: records } = useRecordQuery(sheetId)
    return <div className="container mx-auto py-10">
        <ExpenseFlowSheetGrid sheetId={sheetId} records={records || []} />
    </div>
} 