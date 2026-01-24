"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellPercentage } from "@/components/custom/grid/grid-cell-percentage";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newCreditRecordFormSchema } from "@/form-schemas/new-credit-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bucket, Record as RecordModel } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const defaultFormValues = {
    name: "",
    bucketId: undefined,
    currentBalance: 0,
    monthlyPayment: 0,
    interestRate: 0,
    additionalPayment: 0,
}

type FormValues = z.infer<typeof newCreditRecordFormSchema>

type CreditSheetGridProps = {
    sheetId: string;
    records: RecordModel[],
    buckets: Bucket[]
}

export default function CreditSheetGrid({ records, buckets, sheetId }: CreditSheetGridProps) {
    const bucketsDictionary = useMemo(() => buckets.reduce((acc, bucket) => {
        acc[bucket.id] = bucket.name
        return acc
    }, {} as Record<string, string>), [buckets]);

    const form = useForm<FormValues>({
        resolver: zodResolver(newCreditRecordFormSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.bucketId) form.setValue("bucketId", row.bucketId)
        if (row.currentBalance) form.setValue("currentBalance", row.currentBalance)
        if (row.monthlyPayment) form.setValue("monthlyPayment", row.monthlyPayment)
        if (row.interestRate) form.setValue("interestRate", row.interestRate)
        if (row.additionalPayment) form.setValue("additionalPayment", row.additionalPayment)

        // Calculate amount as monthlyPayment + additionalPayment for totals
        const monthlyPayment = row.monthlyPayment || 0
        const additionalPayment = row.additionalPayment || 0
        const amount = monthlyPayment + additionalPayment

        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            sheetId: parseInt(sheetId),
            amount
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            // Calculate amount when updating
            const monthlyPayment = data.monthlyPayment ?? 0
            const additionalPayment = data.additionalPayment ?? 0
            const amount = monthlyPayment + additionalPayment

            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    bucketId: data.bucketId,
                    currentBalance: data.currentBalance,
                    monthlyPayment: data.monthlyPayment,
                    interestRate: data.interestRate,
                    additionalPayment: data.additionalPayment,
                    amount
                }
            });
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
            id: "bucket",
            accessorKey: "bucketId",
            header: "Cuenta",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={bucketsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "currentBalance",
            accessorKey: "currentBalance",
            header: "Saldo Actual",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "monthlyPayment",
            accessorKey: "monthlyPayment",
            header: "Pago Mensual",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "interestRate",
            accessorKey: "interestRate",
            header: "Interes Mensual",
            cell: ({ cell }) => <GridCellPercentage value={cell.getValue() as number | null} />,
        },
        {
            id: "additionalPayment",
            accessorKey: "additionalPayment",
            header: "Pago Adicional",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
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
            <CardTitle>Creditos</CardTitle>
        </CardHeader>
        <CardContent>
            <SheetGrid
                columns={columns}
                data={records}
                buckets={buckets}
                onRowAdd={handleRowAdd}
                onRowUpdate={handleRowUpdate}
                onRowDelete={onDelete}
                validationSchema={newCreditRecordFormSchema}
                getRowId={(row) => row.id}
            />
        </CardContent>
    </Card>
}
