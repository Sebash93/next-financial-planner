import Page from "@/components/custom/page";
import BudgetSheet from "./components/budgetSheet";
import { Sheet } from "@prisma/client";
import ExpenseFlowSheet from "./components/expenseFlowSheet";

export default async function SheetPage({ params }) {
    const { sheetId } = await params;
    const sheet: Sheet = await fetch(`http://localhost:3000/api/sheet/${sheetId}`).then((res) => res.json());
    const records = await fetch(`http://localhost:3000/api/record?sheetId=${sheetId}`).then((res) => res.json());
    if (!sheet) {
        return <div>Sheet not found</div>;
    }
    return (
        <Page title={sheet.name}>
            {sheet.sheetType === "BUDGET" && <BudgetSheet />}
            {sheet.sheetType === "EXPENSE_FLOW" && <ExpenseFlowSheet records={records} />}
        </Page>
    );
}