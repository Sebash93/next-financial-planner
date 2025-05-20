"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import SheetGrid from "@/components/custom/sheet-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newBudgetRecordFormSchema } from "@/form-schemas/new-budget-record-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bucket, Record as RecordEntity, Tag } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type BudgetGridProps = {
    records: RecordEntity[],
    tags: Tag[]
    buckets: Bucket[]
}

export default function BudgetGrid({ records, tags, buckets }: BudgetGridProps) {
    const { sheetId } = useParams()
    const form = useForm<z.infer<typeof newBudgetRecordFormSchema>>({
        resolver: zodResolver(newBudgetRecordFormSchema),
        defaultValues: {
            name: "",
            amount: 0,
            tagId: undefined,
            bucketId: undefined,
        },
    })
    const tagsDictionary = useMemo(() => tags.reduce((acc, tag) => {
        acc[tag.id] = tag.name
        return acc
    }, {} as Record<string, string>), [tags]);
    const bucketsDictionary = useMemo(() => buckets.reduce((acc, bucket) => {
        acc[bucket.id] = bucket.name
        return acc
    }, {} as Record<string, string>), [buckets]);


    const handleRowDelete = async (row) => {
        console.log('DELETE', row)
        try {
            const response = await fetch('/api/record', {
                method: 'DELETE',
                body: JSON.stringify({ id: parseInt(row.original.id) }),
            })
            const data = await response.json()
            console.log(data)
        } catch (error) {
            console.error("Error deleting record", error)
        }
    }

    const handleRowAdd = (row) => {
        console.log('ROW ADD', row)
        form.setValue("name", row.name)
        form.setValue("bucketId", row.bucketId)
        form.setValue("tagId", row.tagId)
        form.setValue("amount", row.amount)

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

    const columns: ColumnDef<RecordEntity>[] = [
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
            id: "tag",
            accessorKey: "tagId",
            header: "Categoría",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={tagsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "bucket",
            accessorKey: "bucketId",
            header: "Cuenta",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={bucketsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "actions",
            accessorKey: "actions",
            header: "",
            cell: ({ row }) => {
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
            <SheetGrid columns={columns} data={records} tags={tags} buckets={buckets} onRowAdd={handleRowAdd} />
        </CardContent>
    </Card>
}