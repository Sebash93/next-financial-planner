"use client"
import { PageTitle } from "@/components/custom/page-title";
import { useOnePlanQuery } from "@/queries/plan.queries";
import { useOneSheetQuery } from "@/queries/sheet.queries";

type SheetTitleProps = {
    sheetId: string;
}

export const SheetTitle = ({ sheetId }: SheetTitleProps) => {
    const { data: sheet, isLoading } = useOneSheetQuery(sheetId);
    if (isLoading) {
        return <div className="animate-pulse bg-gray-200 h-8 rounded-md w-1/2" />;
    }
    if (sheet) {
        return (
            <PageTitle>
                {sheet.name}
            </PageTitle>
        );
    }
}