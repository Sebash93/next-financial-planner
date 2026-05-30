import { getPlanFlowReport } from "@/app/actions/reports/plan-reports";
import { PlanBucketDistribution } from "@/components/custom/charts/plan-bucket-distribution";
import FlowBalanceChart from "@/components/custom/charts/flow-balance-chart";
import MonthlyResults from "./monthlyResults";
import { buildMonthlyFlow } from "@/utils/flow";

type PlanResultsProps = {
    planId: string;
}
export const PlanResults = async ({ planId }: PlanResultsProps) => {
    const report = await getPlanFlowReport(planId);
    const flows = buildMonthlyFlow(report);
    return (
        <div className="border-t pt-4 mt-8">
            <h2 className="text-lg font-semibold pb-4">Resultados</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <MonthlyResults
                    flows={flows}
                    range={report.range}
                    creditBalanceTotal={report.recurring.creditBalanceTotal}
                />
                <PlanBucketDistribution planId={planId} />
            </div>
            <div className="mt-4">
                <FlowBalanceChart flows={flows} />
            </div>
        </div>
    );
}
