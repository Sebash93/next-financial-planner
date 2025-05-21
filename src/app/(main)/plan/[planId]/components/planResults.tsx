import { PlanBucketDistribution } from "@/components/custom/charts/plan-bucket-distribution";
import { PlanSummaryReport } from "@/components/custom/charts/plan-summary-report";

type PlanResultsProps = {
    planId: string;
}
export const PlanResults = ({ planId }: PlanResultsProps) => {
    return (
        <div className="border-t pt-4 mt-8">
            <h2 className="text-lg font-semibold pb-4">Resultados</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <PlanSummaryReport planId={planId} />
                <PlanBucketDistribution planId={planId} />
            </div>
        </div>
    );
}