"use client"
import { Button } from "@/components/ui/button"
import { useErrorToast } from "@/hooks/use-error-toast";
import { useDeleteSheetQuery, useDuplicateSheetQuery } from "@/queries/sheet.queries";
import { usePlanQuery } from "@/queries/plan.queries";
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation";
import { DuplicateSheetPopover } from "./duplicateSheetPopover";
import { useMemo } from "react";

type SheetSettingsProps = {
    planId: string;
    sheetId: string;
}

export const SheetSettings = ({ planId, sheetId }: SheetSettingsProps) => {
    const { mutateAsync: deleteSheet } = useDeleteSheetQuery(planId);
    const { mutateAsync: duplicateSheet } = useDuplicateSheetQuery();
    const { data: plans } = usePlanQuery();
    const { push } = useRouter();

    const { errorToast } = useErrorToast();

    // Filter out the current plan from the list
    const availablePlans = useMemo(() => {
        return plans?.filter(plan => plan.id.toString() !== planId) || [];
    }, [plans, planId]);

    const hasAvailablePlans = availablePlans.length > 0;

    const handleDeletePlan = async () => {
        try {
            await deleteSheet(sheetId);
            push("/plan/" + planId);
        } catch (error) {
            errorToast("No se pudo eliminar el plan" + error);
        }
    }

    const handleDuplicateSheet = async (destinationPlanId: string) => {
        try {
            await duplicateSheet({
                sheetId,
                destinationPlanId: parseInt(destinationPlanId)
            });
            push(`/plan/${destinationPlanId}`);
        } catch (error) {
            errorToast("No se pudo duplicar la hoja" + error);
        }
    }

    return <div className="border-t pt-8 mt-8 flex justify-end items-center gap-4">
        <DuplicateSheetPopover
            availablePlans={availablePlans}
            onDuplicate={handleDuplicateSheet}
            disabled={!hasAvailablePlans}
        />

        <Button variant="outline" onClick={handleDeletePlan}>
            <Trash2 className="h-4 w-4" />
            Eliminar Hoja
        </Button>
    </div>
}