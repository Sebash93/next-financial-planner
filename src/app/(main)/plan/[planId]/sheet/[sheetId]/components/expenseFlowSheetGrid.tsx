"use client"
import SheetGrid from "@/components/custom/sheet-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseFlowRecordModel } from "@/models/expenseFlowRecord";
import { numberToCurrency } from "@/utils/currencies";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

export default function ExpenseFlowSheetGrid({ records }) {
    const columns: ColumnDef<ExpenseFlowRecordModel>[] = [
        {
            id: "month",
            accessorKey: "month",
            header: "Mes",
        },
        {
            id: "name",
            accessorKey: "name",
            header: "Nombre",
        },
        {
            id: "value",
            accessorKey: "value",
            header: "Valor",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("value"))
                const formatted = numberToCurrency(amount)
                return <div>{formatted}</div>
            },
        },
        {
            id: "actions",
            accessorKey: "actions",
            header: "",
            cell: ({ row }) => {
                return <Button variant="ghost" className="w-4 h-4 p-2" onClick={() => navigator.clipboard.writeText(row.id)} >
                    <Trash2 />
                </Button>
            }
        }
    ]
    return <Card>
        <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid columns={columns} data={records} />
        </CardContent>
    </Card>
}