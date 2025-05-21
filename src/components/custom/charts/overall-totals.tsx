"use client"
import { numberToCurrency } from "@/utils/currencies"
import DataDisplay from "../data-display"

const income = 26314000 + 2700000;
const total = 0;

export const OverAllTotals = () => {
    return <DataDisplay title="Total" description="Total del presupuesto" value={numberToCurrency(total)}>
        <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                    Resultado del ejercicio {
                        numberToCurrency(income - total)
                    }
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    Ingresos de {numberToCurrency(income)}
                </div>
            </div>
        </div>
    </DataDisplay>
}