import Page from "@/components/custom/page";
import BudgetSheet from "./components/budgetSheet";
import { Record, Sheet, Tag } from "@prisma/client";
import ExpenseFlowSheet from "./components/expenseFlowSheet";
import IncomeSheet from "./components/incomeSheet";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import SheetTile from "../../components/sheetTile";
import { SheetTitle } from "./components/sheetTitle";
import { PageContent } from "@/components/custom/page-content";
import { SheetContent } from "./components/sheetContent";

export default async function SheetPage({ params }) {
    const { sheetId } = await params;
    return (
        <Page>
            <ReactQueryProvider>
                <SheetTitle sheetId={sheetId} />
                <SheetContent sheetId={sheetId} />
            </ReactQueryProvider>
        </Page>
    );
}