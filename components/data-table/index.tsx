'use client'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useEffect, useId, useMemo, useState } from 'react'

import DraggableRow from '@/components/data-table/draggable-row'
import DragHandle from '@/components/data-table/dragHandle'
import TableFooter from '@/components/data-table/table-footer'
import { DataTableProps } from '@/components/data-table/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    classname?: string
    label?: string
  }
}

export default function DataTable<T extends { [key: string]: any }>({
  initialData,
  data,
  columns,
  serverSide = false,
  fullHeight = false,
  disablePagination = false,
  onStateChange,
  onClickRow,
  totalRowCount,
  initialState,
  idField = 'id',
  onDataChange,
  enableDragAndDrop = false,
  enableColumnVisibility = false,
  emptyMessage = 'نتیجه‌ای یافت نشد.',
  loading,
}: DataTableProps<T>) {
  const [internalData, setInternalData] = useState<T[]>(initialData || [])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialState?.columnFilters ?? [],
  )
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? [],
  )
  const [pagination, setPagination] = useState<PaginationState>(
    initialState?.pagination ?? {
      pageIndex: 0,
      pageSize: 5,
    },
  )
  const sortableId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
  )

  const dragColumn: ColumnDef<T> = {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original?.[idField]} />,
    enableHiding: false,
  }

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => internalData?.map((row) => row?.[idField]) || [],
    [internalData, idField],
  )

  useEffect(() => {
    if (!serverSide) {
      setInternalData(initialData || [])
    }
  }, [initialData, serverSide])

  useEffect(() => {
    if (!serverSide && onDataChange) {
      onDataChange(internalData)
    }
  }, [internalData, onDataChange, serverSide])

  const table = useReactTable({
    data: serverSide ? (data ?? []) : internalData,
    columns:
      enableDragAndDrop && !serverSide ? [dragColumn, ...columns] : columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row?.[idField].toString(),
    enableRowSelection: true,
    columnResizeMode: 'onChange',
    onSortingChange: (updater) => {
      setSorting(updater)
      if (serverSide && onStateChange) {
        const newSorting =
          typeof updater === 'function' ? updater(sorting) : updater
        onStateChange({
          pagination,
          sorting: newSorting,
          columnFilters,
          columnVisibility,
        })
      }
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      if (serverSide && onStateChange) {
        const newFilters =
          typeof updater === 'function' ? updater(columnFilters) : updater
        onStateChange({
          pagination,
          sorting,
          columnFilters: newFilters,
          columnVisibility,
        })
      }
    },
    onPaginationChange: (updater) => {
      setPagination(updater)
      if (serverSide && onStateChange) {
        const newPagination =
          typeof updater === 'function' ? updater(pagination) : updater
        onStateChange({
          pagination: newPagination,
          sorting,
          columnFilters,
          columnVisibility,
        })
      }
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility(updater)
      if (onStateChange) {
        const newVisibility =
          typeof updater === 'function' ? updater(columnVisibility) : updater
        onStateChange({
          pagination,
          sorting,
          columnFilters,
          columnVisibility: newVisibility,
        })
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: serverSide ? getCoreRowModel() : getFilteredRowModel(), // No client filtering for server-side
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: serverSide ? getCoreRowModel() : getSortedRowModel(), // No client sorting for server-side
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: !!serverSide, // Manual for server-side
    manualSorting: !!serverSide,
    manualFiltering: !!serverSide, // (if using column filters)
    ...(serverSide && {
      pageCount: Math.ceil((totalRowCount || 0) / pagination.pageSize),
    }),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setInternalData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const handleRowClick = React.useCallback(
    (row: T) => (event: React.MouseEvent<HTMLTableRowElement>) => {
      // Prevent click if target is interactive element
      const target = event.target as HTMLElement
      const isInteractive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[role="button"]')

      if (isInteractive) return

      onClickRow?.(row, event)
    },
    [onClickRow],
  )

  const tableContent = (
    <Table>
      <TableHeader className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className={header.column.columnDef.meta?.classname}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="**:data-[slot=table-cell]:first:w-8">
        {loading ? (
          <TableRow className="bg-muted/50">
            <TableCell
              colSpan={enableDragAndDrop ? columns.length + 1 : columns.length}
            >
              <Skeleton className="text-muted-foreground flex h-12 items-center justify-start gap-x-2 text-xs md:h-24 md:justify-center md:gap-x-6 md:text-sm">
                <span>در حال دریافت اطلاعات...</span>
                <Loader2 className="animate-spin" />
              </Skeleton>
            </TableCell>
          </TableRow>
        ) : table.getRowModel().rows?.length ? (
          enableDragAndDrop ? (
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.original[idField]} row={row} />
              ))}
            </SortableContext>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.original[idField]}
                data-state={row.getIsSelected() && 'selected'}
                onClick={onClickRow ? handleRowClick(row.original) : undefined}
                className={cn(onClickRow && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.classname}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={enableDragAndDrop ? columns.length + 1 : columns.length}
              className="text-destructive h-24 text-center text-xs md:text-sm"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  const hasPagination: boolean =
    !disablePagination &&
    (serverSide
      ? Math.ceil((totalRowCount || 0) / pagination.pageSize) > 0
      : internalData.length > 5)

  return (
    <>
      <div
        className={cn(
          '@container/main **:data-[slot=table-container]:rounded-lg',
          !serverSide &&
            !fullHeight &&
            '**:data-[slot=table-container]:max-h-[450px]',
        )}
      >
        {enableDragAndDrop ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            {tableContent}
          </DndContext>
        ) : (
          tableContent
        )}
      </div>
      {/* Footer */}
      <TableFooter
        table={table}
        serverSide={serverSide}
        hasPagination={hasPagination}
        enableColumnVisibility={enableColumnVisibility}
      />
    </>
  )
}
