import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'

type TableState = {
  pagination: PaginationState
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
}

export interface DataTableProps<T> {
  initialData?: T[]
  data?: T[]
  columns: ColumnDef<T>[]
  idField?: keyof T
  onDataChange?: (newData: T[]) => void
  enableDragAndDrop?: boolean
  disablePagination?: boolean
  enableColumnVisibility?: boolean
  emptyMessage?: string
  loading?: boolean
  serverSide?: boolean
  fullHeight?: boolean
  totalRowCount?: number
  initialState?: Partial<TableState>
  onStateChange?: (state: TableState) => void
  onClickRow?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void
}
