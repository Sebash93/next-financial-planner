"use client"
import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newExpenseFlowRecordSchema } from "@/form-schemas/new-expense-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bucket, Record as RecordModel } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    date: 0,
    amount: 0,
    bucketId: undefined,
}
type FormValues = z.infer<typeof newExpenseFlowRecordSchema>

type ExpenseFlowSheetGridProps = {
    records?: RecordModel[]
    sheetId: string
    buckets: Bucket[]
}

export default function ExpenseFlowSheetGrid({ records, sheetId, buckets }: ExpenseFlowSheetGridProps) {
    const bucketsDictionary = useMemo(() => buckets.reduce((acc, bucket) => {
        acc[bucket.id] = bucket.name
        return acc
    }, {} as Record<string, string>), [buckets]);

    const form = useForm<FormValues>({
        resolver: zodResolver(newExpenseFlowRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const monthStart = useMemo(() => startOfMonth(new Date()), [])

    const { currentRecords, pastRecords } = useMemo(() => {
        const current: RecordModel[] = []
        const past: RecordModel[] = []
        for (const record of records ?? []) {
            if (record.date != null && Number(record.date) < monthStart.getTime()) {
                past.push(record)
            } else {
                current.push(record)
            }
        }
        return { currentRecords: current, pastRecords: past }
    }, [records, monthStart])

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.date) form.setValue("date", Number(row.date))
        if (row.amount) form.setValue("amount", row.amount)
        if (row.bucketId) form.setValue("bucketId", row.bucketId)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            date: BigInt(data.date),
            sheetId: parseInt(sheetId),
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    amount: data.amount,
                    date: data.date ? BigInt(data.date) : undefined,
                    bucketId: data.bucketId
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const columns: ColumnDef<RecordModel>[] = [
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

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Presupuesto</CardTitle>
                </CardHeader>
                <CardContent>
                    <SheetGrid
                        columns={columns}
                        data={currentRecords}
                        buckets={buckets}
                        onRowAdd={handleRowAdd}
                        onRowUpdate={handleRowUpdate}
                        onRowDelete={onDelete}
                        validationSchema={newExpenseFlowRecordSchema}
                        getRowId={(row) => row.id}
                        minDate={monthStart}
                    />
                </CardContent>
            </Card>
            {pastRecords.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos Pasados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SheetGrid columns={columns} data={pastRecords} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
