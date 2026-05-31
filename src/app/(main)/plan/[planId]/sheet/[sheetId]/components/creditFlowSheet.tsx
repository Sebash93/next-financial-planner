"use client"

import { useEffect, useState } from "react";
import { useOneSheetQuery } from "@/queries/sheet.queries";
import { useRecordQuery } from "@/queries/record.queries";
import { getPlanCreditRecords } from "@/app/actions/reports/plan-reports";
import CreditFlowSheetGrid, { type CreditOption } from "./creditFlowSheetGrid";

type CreditFlowSheetProps = {
    sheetId: string;
}

export default function CreditFlowSheet({ sheetId }: CreditFlowSheetProps) {
    const { data: sheet } = useOneSheetQuery(sheetId);
    const { data: records } = useRecordQuery(sheetId);
    const [credits, setCredits] = useState<CreditOption[] | null>(null);

    useEffect(() => {
        if (!sheet) return;
        getPlanCreditRecords(String(sheet.planId)).then((creditRecords) => {
            setCredits(creditRecords.map((c) => ({
                id: c.id,
                name: c.name,
                currentBalance: c.currentBalance,
                monthlyPayment: c.monthlyPayment,
                interestRate: c.interestRate,
                date: c.date,
            })));
        });
    }, [sheet]);

    return <div className="container mx-auto py-10">
        {credits && <CreditFlowSheetGrid sheetId={sheetId} records={records || []} credits={credits} />}
    </div>
}
