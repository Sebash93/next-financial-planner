import { getPlanBucketTotals } from "@/app/actions/reports/plan-reports";
import DataDisplay from "../data-display";
import { numberToCurrency } from "@/utils/currencies";

type PlanBucketDistributionProps = {
    planId: string;
}

export const PlanBucketDistribution = async ({ planId }: PlanBucketDistributionProps) => {
    const bucketTotals = await getPlanBucketTotals(planId);
    return (
        <DataDisplay title="Distribución de Bolsillos" description="Totales por bolsillo">
            <div className="flex flex-col gap-2">
                {bucketTotals.map((bucket) => (
                    <div key={bucket.bucketId} className="w-full">
                        <span>{bucket.bucketName}: {numberToCurrency(bucket.total)} </span>
                    </div>
                ))}
            </div>
        </DataDisplay>
    );
}