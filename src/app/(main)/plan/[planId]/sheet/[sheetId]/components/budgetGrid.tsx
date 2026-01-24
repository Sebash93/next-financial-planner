"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newBudgetRecordFormSchema } from "@/form-schemas/new-budget-record-form.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bucket, Record as RecordModel, Tag } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    amount: 0,
    tagId: undefined,
    bucketId: undefined,
}

type FormValues = z.infer<typeof newBudgetRecordFormSchema>

type BudgetGridProps = {
    sheetId: string;
    records: RecordModel[],
    tags: Tag[]
    buckets: Bucket[]
}

export default function BudgetGrid({ records, tags, buckets, sheetId }: BudgetGridProps) {
    const tagsDictionary = useMemo(() => tags.reduce((acc, tag) => {
        acc[tag.id] = tag.name
        return acc
    }, {} as Record<string, string>), [tags]);

    const bucketsDictionary = useMemo(() => buckets.reduce((acc, bucket) => {
        acc[bucket.id] = bucket.name
        return acc
    }, {} as Record<string, string>), [buckets]);

    const form = useForm<FormValues>({
        resolver: zodResolver(newBudgetRecordFormSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.amount) form.setValue("amount", row.amount)
        if (row.tagId) form.setValue("tagId", row.tagId)
        if (row.bucketId) form.setValue("bucketId", row.bucketId)
        form.handleSubmit((data: FormValues) => onSubmit({ ...data, sheetId: parseInt(sheetId) }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({ recordId, data: { name: data.name, amount: data.amount, tagId: data.tagId, bucketId: data.bucketId } });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const columns: ColumnDef<RecordModel>[] = [
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
                data={records}
                tags={tags}
                buckets={buckets}
                onRowAdd={handleRowAdd}
                onRowUpdate={handleRowUpdate}
                onRowDelete={onDelete}
                validationSchema={newBudgetRecordFormSchema}
                getRowId={(row) => row.id}
            />
        </CardContent>
    </Card>
}
