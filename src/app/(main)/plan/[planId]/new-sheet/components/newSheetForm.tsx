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
import { useMutateSheetQuery } from "@/queries/sheet.queries"
import { EnumSheetType } from "@prisma/client"

type NewSheetFormProps = {
    planId: string
}

export default function NewSheetForm({
    planId }: NewSheetFormProps) {
    const { mutate } = useMutateSheetQuery()
    const form = useForm<z.infer<typeof newSheetFormSchema>>({
        resolver: zodResolver(newSheetFormSchema),
        defaultValues: {
            name: "",
            sheetType: "",
        },
    })
    async function onSubmit(values: z.infer<typeof newSheetFormSchema>) {
        mutate({ ...values, planId: parseInt(planId as string), sheetType: values.sheetType as EnumSheetType })
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
                                        <SelectItem value="EXPENSE_FLOW">Flujo de gastos</SelectItem>
                                        <SelectItem value="INCOME">Ingresos Mensuales</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit">Crear</Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
}