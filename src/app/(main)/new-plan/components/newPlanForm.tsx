"use client"

import { newPlanFormSchema } from "@/form-schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MonthYearPicker from "@/components/custom/month-year-picker";
import { getStartOfCurrentMonth } from "@/utils/dates";

export default function NewPlanForm() {
    const form = useForm<z.infer<typeof newPlanFormSchema>>({
        resolver: zodResolver(newPlanFormSchema),
        defaultValues: {
            name: "",
            initialDate: getStartOfCurrentMonth().getTime(),
            endDate: getStartOfCurrentMonth().getTime(),
        },
    })

    async function onSubmit(values: z.infer<typeof newPlanFormSchema>) {
        console.table(values)
        const initialDate = values.initialDate / 1000
        const endDate = values.endDate / 1000
        const response = await fetch('/api/plan', {
            method: 'POST',
            body: JSON.stringify({ ...values, initialDate, endDate }),
        })
        const data = await response.json()
        console.log(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del plan</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="initialDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Inicio</FormLabel>
                            <FormControl>
                                <MonthYearPicker {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fecha de Final</FormLabel>
                            <FormControl>
                                <MonthYearPicker {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Crear</Button>
            </form>
        </Form>
    )
}