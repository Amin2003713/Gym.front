import { ColumnDef } from '@tanstack/react-table'

import LeaveActionCell from '@/app/tenants/[tenant]/reports/leaves/_components/leave-action-cell'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { LEAVE_STATUS, LEAVE_TYPE } from '@/constants/leave'
import { Leave } from '@/types/leave.interface'
import { formatJalaliDate } from '@/utils/date'

export const LeavesColumns: ColumnDef<Leave>[] = [
  {
    id: 'user',
    accessorKey: 'user',
    header: ({ column }) => (
      <SortableHeader column={column} title="نام کارمند" />
    ),
    accessorFn: ({ user }) => user.name,
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.user.name}</span>
    ),
    meta: { classname: 'text-center', label: 'نام کارمند' },
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: ({ column }) => (
      <SortableHeader column={column} title="نوع مرخصی" />
    ),
    cell: ({ row }) => LEAVE_TYPE[row.original.type],
    meta: { classname: 'text-center', label: 'نوع مرخصی' },
  },
  {
    id: 'dates',
    header: 'بازه مرخصی',
    cell: ({ row }) => (
      <span className="flex flex-col gap-1">
        <div>{formatJalaliDate(row.original.startDate)!}</div>
        <div className="text-[10px]">تا</div>
        <div>{formatJalaliDate(row.original.endDate)!}</div>
      </span>
    ),
    meta: { classname: 'text-center' },
  },
  {
    id: 'duration',
    accessorKey: 'duration',
    header: ({ column }) => (
      <SortableHeader column={column} title="مدت مرخصی(روز)" />
    ),
    meta: { classname: 'text-center', label: 'مدت مرخصی' },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <SortableHeader column={column} title="وضعیت" />,
    cell: ({ row }) => (
      <Badge
        variant="default"
        className={LEAVE_STATUS[row.original.status].color}
      >
        {LEAVE_STATUS[row.original.status].label}
      </Badge>
    ),
    meta: { classname: 'text-center', label: 'وضعیت' },
  },
  {
    id: 'description',
    header: 'توضیحات',
    cell: ({ row }) =>
      row.original.description ? (
        <Textarea
          value={row.original.description || ''}
          readOnly
          disabled
          className="max-h-16 min-h-8 !cursor-ns-resize !text-xs !opacity-80"
        />
      ) : (
        '--'
      ),
    meta: { classname: 'text-center w-[300px] min-w-[200px]' },
  },
  {
    id: 'inserter',
    accessorKey: 'inserter',
    header: 'درج کننده',
    cell: ({ row }) => (
      <span>
        <div>{row.original.inserter.name}</div>
        <div className="text-[10px]">در تاریخ</div>
        <div className="text-xs">
          {formatJalaliDate(row.original.createdAt)!}
        </div>
      </span>
    ),
    meta: { classname: 'text-center' },
  },
  {
    id: 'actions',
    header: 'عملیات',
    cell: ({ row }) => <LeaveActionCell leave={row.original} />,
    meta: { classname: 'text-center' },
  },
]
