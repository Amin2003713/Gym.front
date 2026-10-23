import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Plan } from '@/types/plan.interface'
import { formatJalaliDate } from '@/utils/date'

import PlanActionCell from './plan-action-cell'

export const plansListColumns: ColumnDef<Plan>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'نام برنامه',
    cell: ({ row }) => row.original.name,
    meta: { classname: 'text-center' },
  },
  {
    id: 'startDate',
    accessorKey: 'startDate',
    header: 'تاریخ شروع',
    cell: ({ row }) => formatJalaliDate(row.original.startDate),
    meta: { classname: 'text-center' },
  },
  {
    id: 'endDate',
    accessorKey: 'endDate',
    header: 'تاریخ پایان',
    cell: ({ row }) => formatJalaliDate(row.original.endDate),
    meta: { classname: 'text-center' },
  },
  {
    id: 'startTime',
    accessorKey: 'startTime',
    header: 'ساعت شروع',
    cell: ({ row }) => row.original.startTime,
    meta: { classname: 'text-center' },
  },
  {
    id: 'endTime',
    accessorKey: 'endTime',
    header: 'ساعت پایان',
    cell: ({ row }) => row.original.endTime,
    meta: { classname: 'text-center' },
  },
  {
    id: 'departments',
    accessorKey: 'departments',
    header: 'بخش',
    cell: ({ row }) =>
      row.original.departments
        ? row.original.departments.map((d) => (
            <Badge key={d.id} variant="outline" className="m-0.5">
              {d.title}
            </Badge>
          ))
        : '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'entryDeadlineTime',
    accessorKey: 'entryDeadlineTime',
    header: 'فرجه ورود',
    cell: ({ row }) => row.original.entryDeadlineTime || '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'exitDeadlineTime',
    accessorKey: 'exitDeadlineTime',
    header: 'فرجه خروج',
    cell: ({ row }) => row.original.exitDeadlineTime || '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'restTime',
    accessorKey: 'restTime',
    header: 'زمان استراحت',
    cell: ({ row }) => row.original.restTime || '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'action',
    header: 'عملیات',
    cell: ({ row }) => <PlanActionCell plan={row.original} />,
    meta: { classname: 'text-center' },
  },
]
