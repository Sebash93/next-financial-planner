"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency"
import SheetGrid from "@/components/custom/sheet-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newIcomeRecordSchema } from "@/form-schemas/new-income-record.schema"
import { useFormCallbacks } from "@/hooks/use-form-callbacks"
import { useUpdateRecordQuery } from "@/queries/record.queries"
import { zodResolver } from "@hookform/resolvers/zod"
import { Record } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

type IncomeSheetGridProps = {
    records: Record[]
    sheetId: string
}

const defaultFormValues = {
    name: "",
    amount: 0,
}

export const IncomeSheetGrid = ({ records, sheetId }: IncomeSheetGridProps) => {
    const form = useForm<z.infer<typeof newIcomeRecordSchema>>({
        resolver: zodResolver(newIcomeRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<z.infer<typeof newIcomeRecordSchema>, Record>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = useCallback((row: Partial<Record>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: z.infer<typeof newIcomeRecordSchema>) => onSubmit({ ...data, sheetId: parseInt(sheetId) }), onSubmitInvalid)()
    }, [form, onSubmit, sheetId, onSubmitInvalid])

    const handleRowUpdate = useCallback(async (recordId: number, data: Partial<Record>) => {
        try {
            await updateRecord({ recordId, data: { name: data.name, amount: data.amount } });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    }, [updateRecord]);

    const columns: ColumnDef<Record>[] = useMemo(() => ([
        {
            id: "name",
            accessorKey: "name",
            header: "Nombre",
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Valor",
            cell: ({ row }) => <GridCellCurrency amount={row.getValue("amount")} />,
        },
        {
            id: "actions",
            header: "",
            cell: () => null,
        },
    ]), [])

    return <Card>
        <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid
                columns={columns}
                data={records}
                onRowAdd={handleRowAdd}
                onRowUpdate={handleRowUpdate}
                onRowDelete={onDelete}
                validationSchema={newIcomeRecordSchema}
                getRowId={(row) => row.id}
            />
        </CardContent>
    </Card>
}
