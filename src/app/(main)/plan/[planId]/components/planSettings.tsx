"use client"
import { Button } from "@/components/ui/button"
import { useErrorToast } from "@/hooks/use-error-toast"
import { useDeletePlanQuery } from "@/queries/plan.queries"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

type PlanSettingsProps = {
    planId: string
}

export const PlanSettings = ({ planId }: PlanSettingsProps) => {
    const { mutateAsync } = useDeletePlanQuery();
    // redirect to the main page after deleting the plan
    const { push } = useRouter();

    const { errorToast } = useErrorToast();
    const handleDeletePlan = async () => {
        try {
            await mutateAsync(planId);
            push("/plan");
        } catch (error) {
            errorToast("No se pudo eliminar el plan" + error);
        }
    }
    return <div className="border-t pt-8 mt-8 flex justify-end items-center gap-4">
        <Button variant="outline" onClick={handleDeletePlan}>
            <Trash2 className="h-4 w-4" />
            Eliminar Plan
        </Button>
    </div>
}