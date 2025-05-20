import Page from "@/components/custom/page";
import BudgetSheet from "./components/budgetSheet";
import { Record, Sheet, Tag } from "@prisma/client";
import ExpenseFlowSheet from "./components/expenseFlowSheet";
import IncomeSheet from "./components/incomeSheet";

export default async function SheetPage({ params }) {
    const { sheetId } = await params;
    const sheet: Sheet = await fetch(`http://localhost:3000/api/sheet/${sheetId}`).then((res) => res.json());
    const records: Record[] = await fetch(`http://localhost:3000/api/record?sheetId=${sheetId}`).then((res) => res.json());
    const tags: Tag[] = await fetch(`http://localhost:3000/api/tag?sheetId=${sheetId}`).then((res) => res.json());
    const buckets = await fetch(`http://localhost:3000/api/bucket?sheetId=${sheetId}`).then((res) => res.json());
    if (!sheet) {
        return <div>Sheet not found</div>;
    }
    return (
        <Page title={sheet.name}>
            {sheet.sheetType === "BUDGET" && <BudgetSheet records={records} buckets={buckets} tags={tags} />}
            {sheet.sheetType === "EXPENSE_FLOW" && <ExpenseFlowSheet records={records} />}
            {sheet.sheetType === "INCOME" && <IncomeSheet records={records} />}
        </Page>
    );
}