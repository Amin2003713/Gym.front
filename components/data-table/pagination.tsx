'use client'

import type { Table } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/ui/typography'

type RowsPerPageSelectProps<TData> = {
  table: Table<TData>
  serverSide: boolean
}

function RowsPerPageSelect<TData>({
  table,
  serverSide,
}: RowsPerPageSelectProps<TData>) {
  const PAGE_SIZE_OPTIONS = [
    { id: 'page-size-5', value: '5', pageSize: 5 },
    { id: 'page-size-10', value: '10', pageSize: 10 },
    { id: 'page-size-20', value: '20', pageSize: 20 },
    { id: 'page-size-30', value: '30', pageSize: 30 },
    { id: 'page-size-50', value: '50', pageSize: 50 },
    ...(!serverSide
      ? [
          {
            id: 'page-size-all',
            label: 'همه',
            value: 'all',
            pageSize: table.getRowCount(),
          },
        ]
      : []),
  ]
  return (
    <div className="mr-auto hidden items-center gap-2 lg:flex">
      <Label htmlFor="rows-per-page">تعداد در صفحه</Label>
      <Select
        value={
          PAGE_SIZE_OPTIONS.find(
            (o) => o.pageSize === table.getState().pagination.pageSize,
          )?.value ?? 'all'
        }
        onValueChange={(value) => {
          const option = PAGE_SIZE_OPTIONS.find((o) => o.value === value)
          if (option) {
            table.setPageSize(option.pageSize)
          }
        }}
      >
        <SelectTrigger className="w-20" id="rows-per-page">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="bottom" align="center">
          {PAGE_SIZE_OPTIONS.map((o) => (
            <SelectItem key={o.id} value={o.value}>
              {o.label ?? o.pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PaginationNavigator<TData>({ table }: { table: Table<TData> }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="size-8"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRightIcon />
        </Button>
        <Button
          variant="outline"
          className="hidden size-8 lg:flex"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRightIcon />
        </Button>
        <Typography
          variant="smallText"
          className="flex w-fit items-center justify-center text-xs"
        >
          {`صفحه ${table.getState().pagination.pageIndex + 1} از ${table.getPageCount()}`}
        </Typography>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="outline"
          className="size-8"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeftIcon />
        </Button>
      </div>
    </>
  )
}

export { RowsPerPageSelect, PaginationNavigator }
