'use client'

import type { Column, Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Scroller } from '@/components/ui/scroller'

interface ColumnVisibilityToggleProps<TData> {
  table: Table<TData>
}

export function ColumnVisibilityToggle<TData>({
  table,
}: ColumnVisibilityToggleProps<TData>) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide()) // Only show toggleable columns (enableHiding !== false)

  if (columns.length === 0) {
    return null
  }

  const getLabel = (column: Column<TData>) =>
    column.columnDef.meta?.label
      ? column.columnDef.meta?.label
      : typeof column.columnDef.header === 'string'
        ? column.columnDef.header
        : column.id

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto flex">
          <Settings2 className="size-4" />
          نمایش ستون‌ها
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[200px]">
        <Scroller
          hideScrollbar
          withNavigation
          scrollTriggerMode="press"
          className="flex max-h-60 w-full flex-col"
        >
          {columns.map((column) => {
            const label = getLabel(column)
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(value)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </Scroller>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
