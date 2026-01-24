"use client"
import { Button } from "@/components/ui/button"
import { useErrorToast } from "@/hooks/use-error-toast"
import { useDeletePlanQuery, useExportPlanQuery } from "@/queries/plan.queries"
import { Download, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { convertPlanToCSV, downloadCSV } from "@/utils/csv-export"

type PlanSettingsProps = {
    planId: string
}

export const PlanSettings = ({ planId }: PlanSettingsProps) => {
    const { mutateAsync } = useDeletePlanQuery();
    const { refetch: fetchExportData, isFetching: isExporting } = useExportPlanQuery(planId);
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

    const handleDownloadCSV = async () => {
        try {
            const { data } = await fetchExportData();
            if (!data) {
                errorToast("No se pudo obtener los datos del plan");
                return;
            }

            // Convert to CSV
            const csvContent = convertPlanToCSV(data);

            // Generate filename with plan name and date
            const filename = `${data.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

            // Trigger download
            downloadCSV(filename, csvContent);
        } catch (error) {
            errorToast("No se pudo descargar el CSV" + error);
        }
    }

    return <div className="border-t pt-8 mt-8 flex justify-end items-center gap-4">
        <Button variant="outline" onClick={handleDownloadCSV} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? "Descargando..." : "Descargar CSV"}
        </Button>

        <Button variant="outline" onClick={handleDeletePlan}>
            <Trash2 className="h-4 w-4" />
            Eliminar Plan
        </Button>
    </div>
}