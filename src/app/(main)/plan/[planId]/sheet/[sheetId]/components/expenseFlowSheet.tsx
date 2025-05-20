import ExpenseFlowSheetGrid from "./expenseFlowSheetGrid";

export default function ExpenseFlowSheet({ records }) {
    return <div className="container mx-auto py-10">
        <ExpenseFlowSheetGrid records={records} />
    </div>
} 