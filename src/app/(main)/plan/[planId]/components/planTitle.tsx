"use client"
import { PageTitle } from "@/components/custom/page-title";
import { useOnePlanQuery } from "@/queries/plan.queries";

type PlanTitleProps = {
    planId: string;
}

export const PlanTitle = ({ planId }: PlanTitleProps) => {
    const { data: plan, isLoading } = useOnePlanQuery(planId);
    if (isLoading) {
        return <div className="animate-pulse bg-gray-200 h-8 rounded-md w-1/2" />;
    }
    if (plan) {
        return (
            <PageTitle>
                {plan.name}
            </PageTitle>
        );
    }
}