"use client"
import { numberToCurrency } from "@/utils/currencies"
import DataDisplay from "../data-display"

type OverAllTotalsProps = {
    income?: number;
    total: number;
}

export const OverAllTotals = ({ income, total }: OverAllTotalsProps) => {
    return <DataDisplay title="Total" description="Total del presupuesto" value={numberToCurrency(total)}>
        {income && <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    Ingresos de {numberToCurrency(income)}
                </div>
            </div>
        </div>}
    </DataDisplay>
}