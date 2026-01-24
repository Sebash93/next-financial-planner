import { useState } from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { GridCellEdit } from "./grid/grid-cell-edit"
import { Bucket, Tag } from "@prisma/client"

interface SheetGridProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    tags?: Tag[]
    buckets?: Bucket[]
    onRowAdd?: (row: Partial<TData>) => void
}

export default function SheetGrid<TData, TValue>({
    columns,
    data,
    onRowAdd,
    tags,
    buckets,
}: SheetGridProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })
    const [newRowData, setNewRowData] = useState<Partial<TData>>({})
    const handleAdd = () => {
        if (onRowAdd) {
            onRowAdd(newRowData)
            setNewRowData({})
        }
    }

    return <Table>
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                            <TableHead key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                            </TableHead>
                        )
                    })}
                </TableRow>
            ))}
        </TableHeader>
        <TableBody>
            {table.getRowModel().rows.length > 0 &&
                table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}

            {onRowAdd && (
                <TableRow>
                    {columns.map((column, idx) => {
                        const key = column.id ?? `col-${idx}`;
                        const accessor = 'accessorKey' in column ? String(column.accessorKey) : key;
                        return (
                            <TableCell key={"new-" + key}>
                                {key === "actions" ? (
                                    <Button onClick={handleAdd}>Agregar</Button>
                                ) : (
                                    <GridCellEdit
                                        column={column}
                                        accessor={accessor}
                                        tags={tags}
                                        buckets={buckets}
                                        value={(newRowData as Record<string, unknown>)[accessor] as string ?? ""}
                                        onChange={(value) =>
                                            setNewRowData((prev) => ({
                                                ...prev,
                                                [accessor]: value,
                                            }))
                                        }
                                    />
                                )}
                            </TableCell>
                        );
                    })}
                </TableRow>
            )}

            {table.getRowModel().rows.length === 0 && !onRowAdd && (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>

}