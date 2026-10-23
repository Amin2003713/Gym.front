'use client'

import type { Table } from '@tanstack/react-table'

import { ColumnVisibilityToggle } from './column-visibility-toggle'
import { PaginationNavigator, RowsPerPageSelect } from './pagination'

type TableFooterProps<TData> = {
  table: Table<TData>
  serverSide: boolean
  hasPagination: boolean
  enableColumnVisibility: boolean
}

export default function TableFooter<TData>({
  table,
  serverSide,
  hasPagination,
  enableColumnVisibility,
}: TableFooterProps<TData>) {
  return (
    <div className="flex w-full items-center gap-2 border-t py-2">
      {enableColumnVisibility && <ColumnVisibilityToggle table={table} />}
      {hasPagination && (
        <>
          <PaginationNavigator table={table} />
          <RowsPerPageSelect table={table} serverSide={serverSide} />
        </>
      )}
    </div>
  )
}
