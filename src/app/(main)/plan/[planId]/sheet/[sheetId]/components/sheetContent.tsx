"use client"
import { PageContent } from "@/components/custom/page-content"
import { useOneSheetQuery } from "@/queries/sheet.queries";
import BudgetSheet from "./budgetSheet";
import CreditSheet from "./creditSheet";
import ExpenseFlowSheet from "./expenseFlowSheet";
import IncomeSheet from "./incomeSheet";

type SheetContentProps = {
    sheetId: string;
}

export const SheetContent = ({ sheetId }: SheetContentProps) => {
    const { data: sheet, isLoading } = useOneSheetQuery(sheetId);
    if (isLoading) {
        return <div className="animate-pulse bg-gray-200 h-8 rounded-md w-1/2" />
    }
    if (!sheet) {
        return <div>Sheet not found</div>
    }
    return <PageContent>
        {sheet.sheetType === "BUDGET" && <BudgetSheet sheetId={sheetId} />}
        {sheet.sheetType === "CREDIT" && <CreditSheet sheetId={sheetId} />}
        {sheet.sheetType === "EXPENSE_FLOW" && <ExpenseFlowSheet sheetId={sheetId} />}
        {sheet.sheetType === "INCOME" && <IncomeSheet sheetId={sheetId} />}
    </PageContent>
}