"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { newSheetFormSchema } from "@/form-schemas/new-sheet-form.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useMutateSheetQuery, useSheetQuery } from "@/queries/sheet.queries"
import { EnumSheetType } from "@prisma/client"
import { useRouter } from "next/navigation"

type NewSheetFormProps = {
    planId: string
}

export default function NewSheetForm({
    planId }: NewSheetFormProps) {
    const router = useRouter()
    const { mutate } = useMutateSheetQuery()
    const { data: sheets } = useSheetQuery(planId)
    const hasCredit = !!sheets?.some((s) => s.sheetType === "CREDIT")
    const hasCreditFlow = !!sheets?.some((s) => s.sheetType === "CREDIT_FLOW")

    const form = useForm<z.infer<typeof newSheetFormSchema>>({
        resolver: zodResolver(newSheetFormSchema),
        defaultValues: {
            name: "",
            sheetType: "",
        },
    })

    const selectedType = form.watch("sheetType")

    // Reason the selected type cannot be created right now (null = allowed).
    const blockedReason =
        selectedType === "CREDIT" && hasCredit
            ? "Ya existe una hoja de Crédito; no se puede crear otra."
            : selectedType === "CREDIT_FLOW" && !hasCredit
            ? "Primero debes crear una hoja de Crédito."
            : selectedType === "CREDIT_FLOW" && hasCreditFlow
            ? "Ya existe una hoja de Flujo de Crédito."
            : null

    async function onSubmit(values: z.infer<typeof newSheetFormSchema>) {
        mutate({ ...values, planId: parseInt(planId as string), sheetType: values.sheetType as EnumSheetType }, {
            onSuccess: (sheet) => {
                router.push(`/plan/${planId}/sheet/${sheet.id}`)
            },
        })
    }
    return <Card>
        <CardHeader>
            <CardTitle>Crea una nueva hoja</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la hoja</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sheetType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de hoja</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el tipo de hoja" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="BUDGET">Presupuesto Mensual</SelectItem>
                                        <SelectItem value="CREDIT">Creditos</SelectItem>
                                        <SelectItem value="CREDIT_FLOW">Flujo de Credito</SelectItem>
                                        <SelectItem value="EXPENSE_FLOW">Flujo de gastos</SelectItem>
                                        <SelectItem value="INCOME">Ingresos Mensuales</SelectItem>
                                    </SelectContent>
                                </Select>
                                {selectedType === "CREDIT" && (
                                    <p className="text-sm text-muted-foreground">
                                        Solo se puede crear una hoja de Crédito por plan.
                                    </p>
                                )}
                                {blockedReason && (
                                    <p className="text-xs text-destructive">{blockedReason}</p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={!!blockedReason}>Crear</Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
}
