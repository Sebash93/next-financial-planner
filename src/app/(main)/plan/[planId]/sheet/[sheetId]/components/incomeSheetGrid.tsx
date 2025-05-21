"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency"
import SheetGrid from "@/components/custom/sheet-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newIcomeRecordSchema } from "@/form-schemas/new-income-record.schema"
import { useFormCallbacks } from "@/hooks/use-form-callbacks"
import { zodResolver } from "@hookform/resolvers/zod"
import { Record } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
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

    const handleRowAdd = useCallback((row: Partial<Record>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: z.infer<typeof newIcomeRecordSchema>) => onSubmit({ ...data, sheetId: parseInt(sheetId) }), onSubmitInvalid)()
    }, [form, onSubmit, sheetId, onSubmitInvalid])

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
            cell: ({ row }) => (
                <Button variant="ghost" onClick={() => onDelete(row.original.id)}>
                    <Trash2 />
                </Button>
            ),
        },
    ]), [onDelete])

    return <Card>
        <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid columns={columns} data={records} onRowAdd={handleRowAdd} />
        </CardContent>
    </Card>
}