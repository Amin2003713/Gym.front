import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Department } from '@/types/department.interface'

import DepartmentActionCell from './department-action-cell'

export const departmentsListColumns: ColumnDef<Department>[] = [
  {
    id: '#',
    header: '#',
    cell: ({ row }) => row.index + 1,
    meta: { classname: 'text-center' },
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'نام بخش',
    cell: ({ row }) => row.original.title,
    meta: { classname: 'text-center' },
  },
  {
    id: 'parent',
    accessorKey: 'parent',
    header: 'بخش والد',
    cell: ({ row }) => row.original.parentDepartment?.title || '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'managers',
    accessorKey: 'managers',
    header: 'مدیران بخش',
    cell: ({ row: { original } }) =>
      !!original.managers?.length
        ? original.managers.map((manager) => (
            <Badge
              key={manager.id}
              variant="outline"
              className="mx-auto my-0.5 flex justify-center gap-1.5 text-xs"
            >
              {manager.name}
            </Badge>
          ))
        : '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'action',
    header: 'عملیات',
    cell: ({ row }) => <DepartmentActionCell department={row.original} />,
    meta: { classname: 'text-center' },
  },
]
