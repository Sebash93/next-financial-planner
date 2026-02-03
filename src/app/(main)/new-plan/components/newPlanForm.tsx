"use client"

import { newPlanFormSchema } from "@/form-schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MonthYearPicker from "@/components/custom/month-year-picker";
import { getStartOfCurrentMonth, getOneYearLater } from "@/utils/dates";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { useMutatePlanQuery } from "@/queries/plan.queries";

const NewPlanForm = () => {
    const { mutate } = useMutatePlanQuery()
    const form = useForm<z.infer<typeof newPlanFormSchema>>({
        resolver: zodResolver(newPlanFormSchema),
        defaultValues: {
            name: "",
            initialDate: getStartOfCurrentMonth().getTime(),
            endDate: getOneYearLater(getStartOfCurrentMonth()).getTime(),
        },
    })

    async function onSubmit(values: z.infer<typeof newPlanFormSchema>) {
        const initialDate = values.initialDate / 1000
        const endDate = values.endDate / 1000
        mutate({ ...values, initialDate, endDate })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Crea un nuevo plan</CardTitle>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} >
                    <CardContent className="space-y-8">
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
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Crear</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

export const NewPlanFormWithProvider = () => {
    return (
        <ReactQueryProvider>
            <NewPlanForm />
        </ReactQueryProvider>
    )
}