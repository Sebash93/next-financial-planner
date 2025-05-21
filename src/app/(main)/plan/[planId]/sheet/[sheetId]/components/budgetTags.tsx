"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { newTagFormSchema } from "@/form-schemas/new-tag-form.schema"
import { useErrorToast } from "@/hooks/use-error-toast"
import { useDeleteTagQuery, useMutateTagQuery } from "@/queries/tag.queries"
import { getNextTagColor } from "@/utils/colors"
import { numberToCurrency } from "@/utils/currencies"
import { categoriesDistributionReport } from "@/utils/reports/categories-distribution"
import { zodResolver } from "@hookform/resolvers/zod"
import { Record, Tag } from "@prisma/client"
import { Trash2 } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type BudgetTagsProps = {
    tags?: Tag[]
    records: Record[]
    sheetId: string
}

export const BudgetTags = ({ tags, records, sheetId }: BudgetTagsProps) => {
    const { mutate } = useMutateTagQuery()
    const { mutateAsync } = useDeleteTagQuery(sheetId)
    const { errorToast } = useErrorToast()
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
            }, {
                onSuccess: () => {
                    form.reset()
                },
                onError: (error) => {
                    errorToast("No se pudo crear la categoría" + error)
                }
            })
        })(e)
    }

    const handleDeleteTag = async (tagId: number) => {
        try {
            await mutateAsync({
                tagId
            })
        } catch (error) {
            errorToast("No se pudo eliminar la categoría" + error)
        }
    }

    const tagsDistribution = useMemo(() => categoriesDistributionReport(records ?? [], tags ?? []), [records, tags]);

    return <Card className="w-full">
        <CardHeader>
            <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex flex-col justify-between gap-2 w-full">
                    {
                        tags?.length ? tags.map((tag) => {
                            const totals = tagsDistribution.find((category) => category.name === tag.name)
                            return (
                                <div key={tag.id} className="flex items-center justify-between gap-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="h-4 w-4 rounded-full" style={{
                                            backgroundColor: tag.color,
                                            border: `1px solid ${tag.color}`
                                        }}></div>
                                        <span>{tag.name} - {numberToCurrency(totals?.total ?? 0)} ({Math.floor(totals?.percentage ?? 0)}%)</span>
                                    </div>
                                    <Trash2 className="h-4 w-4 last:cursor-pointer" onClick={() => handleDeleteTag(tag.id)} />
                                </div>
                            )
                        }) : null
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
                                        <Input className="w-full" placeholder="Nueva categoría" {...field} />
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