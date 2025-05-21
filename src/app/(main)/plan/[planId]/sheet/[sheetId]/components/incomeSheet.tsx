import { Record } from "@prisma/client";
import { IncomeSheetGrid } from "./incomeSheetGrid";
import { useRecordQuery } from "@/queries/record.queries";

type IncomeSheetProps = {
    sheetId: string;
}

export default function IncomeSheet({ sheetId }: IncomeSheetProps) {
    const { data: records } = useRecordQuery(sheetId)
    return <div className="container mx-auto py-10">
        <IncomeSheetGrid sheetId={sheetId} records={records || []} />
    </div>
}