"use client"

import CreditSheetGrid from "./creditSheetGrid";
import { useBucketQuery } from "@/queries/bucket.queries";
import { useRecordQuery } from "@/queries/record.queries";
import { OverAllTotals } from "@/components/custom/charts/overall-totals";
import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import { useMemo } from "react";

type CreditSheetProps = {
    sheetId: string;
}

export default function CreditSheet({ sheetId }: CreditSheetProps) {
    const { data: buckets } = useBucketQuery(sheetId);
    const { data: records } = useRecordQuery(sheetId);

    const allDataLoaded = buckets && records;

    // Calculate totals from records
    const { totalPayments, totalBalance } = useMemo(() => {
        if (!records) return { totalPayments: 0, totalBalance: 0 };

        const payments = records.reduce((sum, record) => {
            const monthly = record.monthlyPayment ?? 0;
            const additional = record.additionalPayment ?? 0;
            return sum + monthly + additional;
        }, 0);

        const balance = records.reduce((sum, record) => {
            return sum + (record.currentBalance ?? 0);
        }, 0);

        return { totalPayments: payments, totalBalance: balance };
    }, [records]);

    return <div className="container mx-auto py-10">
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                {allDataLoaded &&
                    <CreditSheetGrid sheetId={sheetId} records={records} buckets={buckets} />}
            </div>
            <div className="col-span-1 space-y-4">
                <OverAllTotals total={totalPayments} />
                <DataDisplay
                    title="Deuda Total"
                    description="Saldo pendiente de todos los creditos"
                    value={numberToCurrency(totalBalance)}
                />
            </div>
        </div>
    </div>
}
