import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { numberToCurrency } from "@/utils/currencies";
import { accountsTotalsReport } from "@/utils/reports/accounts-totals";
import { Bucket, Record } from "@prisma/client";

type BucketDistributionProps = {
    records: Record[];
    buckets: Bucket[];
}

export const BudgetBucketDistribution = ({
    records,
    buckets,
}: BucketDistributionProps) => {
    const bucketDistribution = accountsTotalsReport(records, buckets);
    return <Card className="w-full">
        <CardHeader>
            <CardTitle>Distribución de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid gap-2">
                {bucketDistribution.map((bucket) => (
                    <div key={bucket.name} className="flex items-center gap-2 font-medium leading-none">
                        {bucket.name}: {numberToCurrency(bucket.total)}
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
}