"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency"
import SheetGrid from "@/components/custom/sheet-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newIcomeRecordSchema } from "@/form-schemas/new-income-record.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Record } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

type IncomeSheetGridProps = {
    records: Record[]
}

export const IncomeSheetGrid = ({ records }: IncomeSheetGridProps) => {
    const { sheetId } = useParams()
    const form = useForm<z.infer<typeof newIcomeRecordSchema>>({
        resolver: zodResolver(newIcomeRecordSchema),
        defaultValues: {
            name: "",
            amount: 0,
        },
    })

    const columns: ColumnDef<Record>[] = [
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
                <Button variant="ghost" onClick={() => console.log("DELETE", row.original)}>
                    <Trash2 />
                </Button>
            ),
        },
    ]

    const handleRowAdd = (row) => {
        form.setValue("name", row.name)
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
    return <Card>
        <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid columns={columns} data={records} onRowAdd={handleRowAdd} />
        </CardContent>
    </Card>
}