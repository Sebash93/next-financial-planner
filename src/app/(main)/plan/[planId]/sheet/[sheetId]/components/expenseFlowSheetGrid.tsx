"use client"
import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newExpenseFlowRecordSchema } from "@/form-schemas/new-expense-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Record } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    date: 0,
    amount: 0,
}
type FormValues = z.infer<typeof newExpenseFlowRecordSchema>

type ExpenseFlowSheetGridProps = {
    records?: Record[]
    sheetId: string
}

export default function ExpenseFlowSheetGrid({ records, sheetId }: ExpenseFlowSheetGridProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(newExpenseFlowRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, Record>({ form })

    const handleRowAdd = (row: Partial<Record>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.date) form.setValue("date", row.date)
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            date: BigInt(data.date),
            sheetId: parseInt(sheetId),
        }), onSubmitInvalid)()

    }

    const columns: ColumnDef<Record>[] = [
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
                return <Button variant="ghost" className="w-4 h-4 p-2" onClick={() => onDelete(row.original.id)} >
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