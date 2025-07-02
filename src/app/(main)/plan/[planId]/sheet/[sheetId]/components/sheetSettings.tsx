"use client"
import { Button } from "@/components/ui/button"
import { useErrorToast } from "@/hooks/use-error-toast";
import { useDeleteSheetQuery } from "@/queries/sheet.queries";
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation";

type SheetSettingsProps = {
    planId: string;
    sheetId: string;
}

export const SheetSettings = ({ planId, sheetId }: SheetSettingsProps) => {
    const { mutateAsync } = useDeleteSheetQuery(planId);
    const { push } = useRouter();

    const { errorToast } = useErrorToast();
    const handleDeletePlan = async () => {
        try {
            await mutateAsync(sheetId);
            push("/plan/" + planId);
        } catch (error) {
            errorToast("No se pudo eliminar el plan" + error);
        }
    }
    return <div className="border-t pt-8 mt-8 flex justify-end items-center gap-4">
        <Button variant="outline" onClick={handleDeletePlan}>
            <Trash2 className="h-4 w-4" />
            Eliminar Hoja
        </Button>
    </div>
}