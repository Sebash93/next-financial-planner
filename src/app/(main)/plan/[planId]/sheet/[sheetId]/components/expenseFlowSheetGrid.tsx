"use client"
import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newExpenseFlowRecordSchema } from "@/form-schemas/new-expense-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Record } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = (row: Partial<Record>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.date) form.setValue("date", Number(row.date))
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            date: BigInt(data.date),
            sheetId: parseInt(sheetId),
        }), onSubmitInvalid)()

    }

    const handleRowUpdate = async (recordId: number, data: Partial<Record>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    amount: data.amount,
                    date: data.date ? BigInt(data.date) : undefined
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

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
            cell: () => null,
        }
    ]


    return <Card>
        <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid
                columns={columns}
                data={records ?? []}
                onRowAdd={handleRowAdd}
                onRowUpdate={handleRowUpdate}
                onRowDelete={onDelete}
                validationSchema={newExpenseFlowRecordSchema}
                getRowId={(row) => row.id}
            />
        </CardContent>
    </Card>
}
