import { useState } from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { z } from "zod"

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
import { Check, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface SheetGridProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    tags?: Tag[]
    buckets?: Bucket[]
    onRowAdd?: (row: Partial<TData>) => void
    onRowUpdate?: (rowId: number, data: Partial<TData>) => void
    onRowDelete?: (rowId: number) => void
    validationSchema?: z.ZodSchema
    getRowId?: (row: TData) => number
}

export default function SheetGrid<TData, TValue>({
    columns,
    data,
    onRowAdd,
    onRowUpdate,
    onRowDelete,
    validationSchema,
    getRowId,
    tags,
    buckets,
}: SheetGridProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    })
    const [newRowData, setNewRowData] = useState<Partial<TData>>({})
    const [editingRowId, setEditingRowId] = useState<number | null>(null)
    const [editedRowData, setEditedRowData] = useState<Partial<TData>>({})
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const handleAdd = () => {
        if (onRowAdd) {
            console.log({
                newRowData
            })
            onRowAdd(newRowData)
            setNewRowData({})
        }
    }

    const handleRowClick = (row: TData) => {
        if (!getRowId || !onRowUpdate) return
        const rowId = getRowId(row)
        if (editingRowId === rowId) return
        setEditingRowId(rowId)
        setEditedRowData(row as Partial<TData>)
        setValidationErrors({})
    }

    const handleFieldChange = (accessor: string, value: unknown) => {
        const updatedData = {
            ...editedRowData,
            [accessor]: value,
        }
        console.log({ updatedData })
        setEditedRowData(updatedData)

        if (validationSchema) {
            const result = validationSchema.safeParse(updatedData)
            if (!result.success) {
                const errors: Record<string, string> = {}
                result.error.issues.forEach((issue) => {
                    const path = issue.path.join(".")
                    errors[path] = issue.message
                })
                setValidationErrors(errors)
            } else {
                setValidationErrors({})
            }
        }
    }

    const handleSave = () => {
        if (editingRowId === null || !onRowUpdate) return
        if (Object.keys(validationErrors).length > 0) return
        console.log({ saveData: editedRowData })
        onRowUpdate(editingRowId, editedRowData)
        setEditingRowId(null)
        setEditedRowData({})
        setValidationErrors({})
    }

    const handleCancelEdit = () => {
        setEditingRowId(null)
        setEditedRowData({})
        setValidationErrors({})
    }

    const handleDelete = (rowId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        if (onRowDelete) {
            onRowDelete(rowId)
        }
        if (editingRowId === rowId) {
            handleCancelEdit()
        }
    }

    const isEditing = (row: TData): boolean => {
        if (!getRowId || editingRowId === null) return false
        return getRowId(row) === editingRowId
    }

    const renderEditActionsCell = (row: TData) => {
        const rowId = getRowId?.(row) ?? 0
        const hasErrors = Object.keys(validationErrors).length > 0
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSave()
                    }}
                    disabled={hasErrors}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleCancelEdit()
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleDelete(rowId, e)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    const renderSortIcon = (columnId: string) => {
        const sortDirection = sorting.find(s => s.id === columnId)?.desc
        if (sortDirection === undefined) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />
        }
        return sortDirection
            ? <ArrowDown className="ml-2 h-4 w-4" />
            : <ArrowUp className="ml-2 h-4 w-4" />
    }

    return <Table>
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort()
                        const columnId = header.column.id

                        if (header.isPlaceholder) {
                            return <TableHead key={header.id} />
                        }

                        if (canSort && columnId !== "actions") {
                            return (
                                <TableHead key={header.id}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
                                        className="-ml-4"
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {renderSortIcon(columnId)}
                                    </Button>
                                </TableHead>
                            )
                        }

                        return (
                            <TableHead key={header.id}>
                                {flexRender(
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
                table.getRowModel().rows.map((row) => {
                    const rowIsEditing = isEditing(row.original)
                    return (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => handleRowClick(row.original)}
                            className={onRowUpdate && getRowId ? "cursor-pointer hover:bg-muted/50" : ""}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const columnId = cell.column.id
                                const accessor = 'accessorKey' in cell.column.columnDef
                                    ? String(cell.column.columnDef.accessorKey)
                                    : columnId

                                if (rowIsEditing && columnId === "actions") {
                                    return (
                                        <TableCell key={cell.id}>
                                            {renderEditActionsCell(row.original)}
                                        </TableCell>
                                    )
                                }

                                const hasAccessorKey = 'accessorKey' in cell.column.columnDef

                                if (rowIsEditing && columnId !== "actions" && hasAccessorKey) {
                                    return (
                                        <TableCell key={cell.id}>
                                            <GridCellEdit
                                                column={cell.column.columnDef}
                                                accessor={accessor}
                                                tags={tags}
                                                buckets={buckets}
                                                value={(editedRowData as Record<string, unknown>)[accessor]}
                                                onChange={(value) => handleFieldChange(accessor, value)}
                                            />
                                        </TableCell>
                                    )
                                }

                                return (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    )
                })}

            {onRowAdd && (
                <TableRow>
                    {columns.map((column, idx) => {
                        const key = column.id ?? `col-${idx}`;
                        const hasAccessorKey = 'accessorKey' in column;
                        const accessor = hasAccessorKey ? String(column.accessorKey) : key;
                        return (
                            <TableCell key={"new-" + key}>
                                {key === "actions" ? (
                                    <Button onClick={handleAdd}>Agregar</Button>
                                ) : hasAccessorKey ? (
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
                                ) : null}
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
