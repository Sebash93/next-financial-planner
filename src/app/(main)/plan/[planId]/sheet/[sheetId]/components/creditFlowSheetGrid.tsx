"use client"

import { GridCellCurrency } from "@/components/custom/grid/grid-cell-currency";
import { GridCellDictionary } from "@/components/custom/grid/grid-cell-dictionary";
import { GridCellMonth } from "@/components/custom/grid/grid-cell-month";
import SheetGrid from "@/components/custom/sheet-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { newCreditFlowRecordSchema } from "@/form-schemas/new-credit-flow-record.schema";
import { useFormCallbacks } from "@/hooks/use-form-callbacks";
import { useUpdateRecordQuery } from "@/queries/record.queries";
import { creditBalanceAfterPayment } from "@/utils/credit-flow";
import { zodResolver } from "@hookform/resolvers/zod";
import { Record as RecordModel } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { startOfMonth } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export type CreditOption = {
    id: number;
    name: string;
    currentBalance: number | null;
    monthlyPayment: number | null;
    interestRate: number | null;
    date: number | null;
}

const defaultFormValues = {
    date: 0,
    creditRecordId: undefined,
    amount: 0,
}
type FormValues = z.infer<typeof newCreditFlowRecordSchema>

type CreditFlowSheetGridProps = {
    sheetId: string;
    records: RecordModel[];
    credits: CreditOption[];
}

export default function CreditFlowSheetGrid({ records, sheetId, credits }: CreditFlowSheetGridProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(newCreditFlowRecordSchema),
        defaultValues: defaultFormValues,
    })
    const { onSubmit, onSubmitInvalid, onDelete } = useFormCallbacks<FormValues, RecordModel>({ form })
    const { mutateAsync: updateRecord } = useUpdateRecordQuery();

    const monthStart = useMemo(() => startOfMonth(new Date()), [])
    const currentMonthMs = monthStart.getTime()

    const creditsById = useMemo(() => {
        const map = new Map<number, CreditOption>()
        for (const c of credits) map.set(c.id, c)
        return map
    }, [credits])

    const creditsDictionary = useMemo(() => credits.reduce((acc, c) => {
        acc[c.id] = c.name
        return acc
    }, {} as Record<string, string>), [credits])

    const creditOptions = useMemo(() => credits.map((c) => ({ id: c.id, name: c.name })), [credits])

    // All flow payments grouped by their credit, as { date, amount }.
    const paymentsByCreditId = useMemo(() => {
        const map = new Map<number, { date: number; amount: number }[]>()
        for (const r of records) {
            if (r.creditRecordId == null || r.date == null) continue
            const list = map.get(r.creditRecordId) ?? []
            list.push({ date: Number(r.date), amount: r.amount })
            map.set(r.creditRecordId, list)
        }
        return map
    }, [records])

    const projectionInputFor = (credit: CreditOption) => ({
        balance: credit.currentBalance ?? 0,
        monthlyPayment: credit.monthlyPayment ?? 0,
        interestRate: credit.interestRate ?? 0,
        balanceDateMs: credit.date ? Number(credit.date) : currentMonthMs,
    })

    const { currentRecords, pastRecords } = useMemo(() => {
        const current: RecordModel[] = []
        const past: RecordModel[] = []
        for (const record of records) {
            if (record.date != null && Number(record.date) < currentMonthMs) past.push(record)
            else current.push(record)
        }
        return { currentRecords: current, pastRecords: past }
    }, [records, currentMonthMs])

    const handleRowAdd = (row: Partial<RecordModel>) => {
        if (row.date) form.setValue("date", Number(row.date))
        if (row.creditRecordId) form.setValue("creditRecordId", row.creditRecordId)
        if (row.amount) form.setValue("amount", row.amount)
        form.handleSubmit((data: FormValues) => onSubmit({
            ...data,
            sheetId: parseInt(sheetId),
            date: BigInt(data.date),
            // Record.name is required; name a flow payment after its credit.
            name: creditsById.get(data.creditRecordId)?.name ?? "Pago",
        }), onSubmitInvalid)()
    }

    const handleRowUpdate = async (recordId: number, data: Partial<RecordModel>) => {
        try {
            await updateRecord({
                recordId,
                data: {
                    date: data.date ? BigInt(data.date) : undefined,
                    creditRecordId: data.creditRecordId,
                    amount: data.amount,
                    name: data.creditRecordId != null
                        ? creditsById.get(data.creditRecordId)?.name ?? undefined
                        : undefined,
                }
            });
        } catch {
            toast.error("Error al actualizar el registro");
        }
    };

    const monthlyPaymentFor = (record: RecordModel) =>
        record.creditRecordId != null ? creditsById.get(record.creditRecordId)?.monthlyPayment ?? null : null

    const balanceAfterFor = (record: RecordModel) => {
        if (record.creditRecordId == null || record.date == null) return null
        const credit = creditsById.get(record.creditRecordId)
        if (!credit) return null
        const payments = paymentsByCreditId.get(record.creditRecordId) ?? []
        return creditBalanceAfterPayment(projectionInputFor(credit), payments, Number(record.date))
    }

    const isAfterFechaSaldo = (record: RecordModel) => {
        if (record.creditRecordId == null || record.date == null) return false
        const credit = creditsById.get(record.creditRecordId)
        if (!credit?.date) return false
        return Number(record.date) > Number(credit.date)
    }

    const columns: ColumnDef<RecordModel>[] = [
        {
            id: "date",
            accessorKey: "date",
            header: "Fecha",
            cell: ({ cell }) => <GridCellMonth date={cell.getValue() as number} />,
        },
        {
            id: "credit",
            accessorKey: "creditRecordId",
            header: "Credito",
            cell: ({ cell }) => <GridCellDictionary
                dictionary={creditsDictionary}
                value={cell.getValue() as string}
            />,
        },
        {
            id: "amount",
            accessorKey: "amount",
            header: "Monto",
            cell: ({ cell }) => <GridCellCurrency amount={cell.getValue() as number | null} />,
        },
        {
            id: "monthlyPayment",
            header: "Pago Mensual",
            cell: ({ row }) => <GridCellCurrency amount={monthlyPaymentFor(row.original)} />,
            enableSorting: false,
        },
        {
            id: "balanceAfter",
            header: "Saldo Despues",
            cell: ({ row }) => <GridCellCurrency amount={balanceAfterFor(row.original)} />,
            enableSorting: false,
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
                    <CardTitle>Flujo de Credito</CardTitle>
                </CardHeader>
                <CardContent>
                    <SheetGrid
                        columns={columns}
                        data={currentRecords}
                        credits={creditOptions}
                        onRowAdd={handleRowAdd}
                        onRowUpdate={handleRowUpdate}
                        onRowDelete={onDelete}
                        validationSchema={newCreditFlowRecordSchema}
                        getRowId={(row) => row.id}
                        minDate={monthStart}
                    />
                </CardContent>
            </Card>
            {pastRecords.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pagos Pasados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SheetGrid
                            columns={columns}
                            data={pastRecords}
                            rowClassName={(row) => isAfterFechaSaldo(row) ? "line-through opacity-60" : ""}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
