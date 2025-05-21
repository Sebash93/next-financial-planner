import { getPlanReport } from "@/app/actions/reports/plan-reports";
import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";

type PlanSummaryReportProps = {
    planId: string;
}

export const PlanSummaryReport = async ({ planId }: PlanSummaryReportProps) => {
    const summary = await getPlanReport(planId);
    return (
        <DataDisplay title="Balance" description="Saldo a fin de mes" value={numberToCurrency(summary.total)}>
            <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        Gastos de {numberToCurrency(summary.budgetTotal)}
                    </div>
                    <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        Ingresos de {numberToCurrency(summary.incomeTotal)}
                    </div>
                </div>
            </div>
        </DataDisplay>
    );
}