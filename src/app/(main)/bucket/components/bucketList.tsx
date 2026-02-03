"use client"

import { Tile } from "@/components/custom/tile"
import { useAllBucketsQuery, useDeleteBucketQuery } from "@/queries/bucket.queries"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export const BucketList = () => {
    const { data: buckets, isLoading } = useAllBucketsQuery()
    const deleteBucket = useDeleteBucketQuery()

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-gray-200 h-32 rounded-md" />
                ))}
            </div>
        )
    }

    if (!buckets?.length) return null

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
            {buckets.map((bucket) => (
                <Tile
                    key={bucket.id}
                    title={bucket.name}
                    badge={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteBucket.mutate(bucket.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    }
                />
            ))}
        </div>
    )
}
