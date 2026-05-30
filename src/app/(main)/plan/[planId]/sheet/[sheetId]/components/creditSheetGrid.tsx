"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellInsights } from "@/components/custom/grid/grid-cell-insights";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import { GridCellPercentage } from "@/components/custom/grid/grid-cell-percentage";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newCreditRecordFormSchema } from "@/form-schemas/new-credit-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { projectCreditBalance } from "@/utils/credit-projection";
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
    bucketId: undefined,
    date: 0,
    currentBalance: 0,
    monthlyPayment: 0,
    interestRate: 0,
    otherCosts: 0,
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

    const currentMonthMs = useMemo(() => startOfMonth(new Date()).getTime(), [])

    const projectedBalanceFor = (record: RecordModel) => projectCreditBalance({
        balance: record.currentBalance ?? 0,
        monthlyPayment: record.monthlyPayment ?? 0,
        interestRate: record.interestRate ?? 0,
        // Fall back to the current month for legacy/unset dates (0 or null) so the
        // projection is a no-op rather than rolling forward from epoch 1970.
        balanceDateMs: record.date ? Number(record.date) : currentMonthMs,
    }, currentMonthMs)

    const form = useForm<FormValues>({
        resolver: zodResolver(newCreditRecordFormSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.name) form.setValue("name", row.name)
        if (row.bucketId) form.setValue("bucketId", row.bucketId)
        if (row.date) form.setValue("date", Number(row.date))
        if (row.currentBalance) form.setValue("currentBalance", row.currentBalance)
        if (row.monthlyPayment) form.setValue("monthlyPayment", row.monthlyPayment)
        if (row.interestRate) form.setValue("interestRate", row.interestRate)
        if (row.otherCosts) form.setValue("otherCosts", row.otherCosts)

        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            sheetId: parseInt(sheetId),
            date: BigInt(data.date),
            amount: data.monthlyPayment,
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    name: data.name,
                    bucketId: data.bucketId,
                    date: data.date ? BigInt(data.date) : undefined,
                    currentBalance: data.currentBalance,
                    monthlyPayment: data.monthlyPayment,
                    interestRate: data.interestRate,
                    otherCosts: data.otherCosts,
                    // mirror monthlyPayment into amount for cross-sheet aggregation
                    amount: data.monthlyPayment ?? undefined,
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
            id: "date",
            accessorKey: "date",
            header: "Fecha Saldo",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "currentBalance",
            accessorKey: "currentBalance",
            header: "Saldo Actual",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "balanceToday",
            header: "Saldo a hoy",
            cell: ({ row }) => <GridCellCurrency amount={projectedBalanceFor(row.original)} />,
            enableSorting: false,
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
            id: "otherCosts",
            accessorKey: "otherCosts",
            header: "Otros Gastos",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "insights",
            header: "Info",
            cell: ({ row }) => (
                <GridCellInsights
                    projectedBalance={projectedBalanceFor(row.original)}
                    monthlyPayment={row.original.monthlyPayment}
                    interestRate={row.original.interestRate}
                    asOfMonthMs={currentMonthMs}
                />
            ),
            enableSorting: false,
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
