import { Record } from "@prisma/client";
import { IncomeSheetGrid } from "./incomeSheetGrid";

type IncomeSheetProps = {
    records: Record[]
}

export default function IncomeSheet({ records }: IncomeSheetProps) {
    return <div className="container mx-auto py-10">
        <IncomeSheetGrid records={records} />
    </div>
}