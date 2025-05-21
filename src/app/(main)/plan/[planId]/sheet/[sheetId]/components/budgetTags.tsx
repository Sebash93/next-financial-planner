"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { newTagFormSchema } from "@/form-schemas/new-tag-form.schema"
import { useMutateTagQuery } from "@/queries/tag.queries"
import { getNextTagColor } from "@/utils/colors"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tag } from "@prisma/client"
import { useForm } from "react-hook-form"
import { z } from "zod"

type BudgetTagsProps = {
    tags?: Tag[]
    sheetId: string
}

export const BudgetTags = ({ tags, sheetId }: BudgetTagsProps) => {
    const { mutate } = useMutateTagQuery()
    const form = useForm<z.infer<typeof newTagFormSchema>>({
        resolver: zodResolver(newTagFormSchema),
        defaultValues: {
            name: "",
            color: "",
        },
    })

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        form.setValue("color", getNextTagColor(tags?.map(tag => tag.color)))
        form.handleSubmit(async (values: z.infer<typeof newTagFormSchema>) => {
            mutate({
                ...values,
                sheetId: parseInt(sheetId as string)
            })
        })(e)
    }

    return <Card className="w-full">
        <CardHeader>
            <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex flex-col justify-between gap-2 w-full">
                    {
                        tags?.length ? tags.map((tag) => (
                            <div key={tag.id} className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full" style={{
                                    backgroundColor: tag.color,
                                    border: `1px solid ${tag.color}`
                                }}></div>
                                <span>{tag.name}</span>
                            </div>
                        )) : null
                    }
                </div>
            </div>
            <Form {...form}>
                <form onSubmit={handleSubmit}>
                    <div className="flex w-full items-center space-x-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input className="grow" placeholder="Nueva categoría" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Crear</Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card >
}