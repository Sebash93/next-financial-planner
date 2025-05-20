"use client"
import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newExpenseFlowRecordSchema } from "@/form-schemas/new-expense-flow-record.schema";
import { ExpenseFlowRecordModel } from "@/models/expenseFlowRecord";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function ExpenseFlowSheetGrid({ records }) {
    const { sheetId } = useParams()
    const form = useForm<z.infer<typeof newExpenseFlowRecordSchema>>({
        resolver: zodResolver(newExpenseFlowRecordSchema),
        defaultValues: {
            name: "",
            date: 0,
            amount: 0,
        },
    })

    const handleRowDelete = async (row) => {
        console.log('DELETE', row)
        try {
            const response = await fetch('/api/record', {
                method: 'DELETE',
                body: JSON.stringify({ id: row.id }),
            })
            const data = await response.json()
            console.log(data)
        } catch (error) {
            console.error("Error deleting record", error)
        }
    }

    const handleRowAdd = (row) => {
        form.setValue("name", row.name)
        form.setValue("date", parseInt(row.date))
        form.setValue("amount", parseInt(row.amount))
        form.handleSubmit(async (values) => {
            console.log('SUBMITTING', values)
            try {
                const response = await fetch('/api/record', {
                    method: 'POST',
                    body: JSON.stringify({ ...values, sheetId: parseInt(sheetId as string) }),
                })
                const data = await response.json()
                console.log(data)
            } catch (error) {
                console.error("Error submitting form", error)
            }
        }, (errors) => {
            console.log('FORM ERROR', errors)
        })()
    }

    const columns: ColumnDef<ExpenseFlowRecordModel>[] = [
        {
            id: "date",
            accessorKey: "date",
            header: "Mes",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "name",
            accessorKey: "name",
            header: "Nombre",
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Valor",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number} />,
        },
        {
            id: "actions",
            accessorKey: "actions",
            header: "",
            cell: ({ row }) => {
                console.log(row)
                return <Button variant="ghost" className="w-4 h-4 p-2" onClick={() => handleRowDelete(row)} >
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
            <SheetGrid columns={columns} data={records} onRowAdd={handleRowAdd} />
        </CardContent>
    </Card>
}