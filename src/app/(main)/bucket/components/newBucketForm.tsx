"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { newBucketSchema } from "@/form-schemas/new-bucket-form.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

export const NewBucketForm = () => {
    const form = useForm<z.infer<typeof newBucketSchema>>({
        resolver: zodResolver(newBucketSchema),
        defaultValues: {
            name: "",
        },
    })

    async function onSubmit(values: z.infer<typeof newBucketSchema>) {
        const response = await fetch('/api/bucket', {
            method: 'POST',
            body: JSON.stringify({ ...values }),
        })
        const data = await response.json()
        console.log(data)
    }

    return <Card>
        <CardHeader>
            <CardTitle>Crea un nuevo bolsillo</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Bolsillo</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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

}