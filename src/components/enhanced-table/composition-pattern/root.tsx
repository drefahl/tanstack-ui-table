import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove } from "@dnd-kit/sortable"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import React from "react"
import { TableProvider } from "../table-context"
import { filterRows } from "./filters/utils"

interface TableRootProps<TData, TValue> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  children: React.ReactNode
  enableSelection?: boolean
  enableExpansion?: boolean
  enableEditing?: boolean
  enableColumnReorder?: boolean
}

export function TableRoot<TData, TValue>({
  data,
  columns,
  enableExpansion,
  enableSelection,
  enableEditing,
  enableColumnReorder,
  children,
}: TableRootProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [tableData, setTableData] = React.useState(data)

  const updateData = (rowIndex: number, updatedData: TData) => {
    setTableData((prevData) => {
      const newData = [...prevData]
      newData[rowIndex] = updatedData
      return newData
    })
  }

  const memoColumns = React.useMemo(() => {
    let newColumns = [...columns]

    if (enableSelection && enableExpansion) {
      newColumns = [
        {
          id: "select-expand",
          header: ({ table }) => (
            <div className="flex items-center">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
              <Button variant="ghost" size="sm" onClick={() => table.toggleAllRowsExpanded()}>
                {table.getIsAllRowsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
              {row.getCanExpand() && (
                <Button variant="ghost" size="sm" onClick={() => row.toggleExpanded()}>
                  {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        } as ColumnDef<TData, unknown>,
        ...newColumns,
      ]
    } else if (enableSelection && !enableExpansion) {
      newColumns = [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        } as ColumnDef<TData, unknown>,
        ...newColumns,
      ]
    } else if (enableExpansion && !enableSelection) {
      newColumns = [
        {
          id: "expand",
          header: ({ table }) => (
            <Button variant="ghost" onClick={() => table.toggleAllRowsExpanded()}>
              {table.getIsAllRowsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ),
          cell: ({ row }) =>
            row.getCanExpand() ? (
              <Button variant="ghost" onClick={() => row.toggleExpanded()}>
                {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : null,
          enableSorting: false,
          enableHiding: false,
        } as ColumnDef<TData, unknown>,
        ...newColumns,
      ]
    }

    return newColumns
  }, [columns, enableExpansion, enableSelection])

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    memoColumns.map((column) => (enableColumnReorder && column.id ? column.id : "")),
  )

  const table = useReactTable({
    data: tableData,
    columns: memoColumns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: any) => row.subRows,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      pagination,
      expanded,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    filterFns: {
      filterRows: filterRows,
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id && !["select", "expand", "select-expand"].includes(over.id as string)) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))

  if (enableColumnReorder) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <TableProvider
          table={table}
          updateData={updateData}
          columnOrder={columnOrder}
          enableEditing={enableEditing}
          enableColumnReorder={enableColumnReorder}
        >
          <div className="space-y-4">{children}</div>
        </TableProvider>
      </DndContext>
    )
  }

  return (
    <TableProvider
      table={table}
      updateData={updateData}
      columnOrder={columnOrder}
      enableEditing={enableEditing}
      enableColumnReorder={enableColumnReorder}
    >
      <div className="space-y-4">{children}</div>
    </TableProvider>
  )
}
