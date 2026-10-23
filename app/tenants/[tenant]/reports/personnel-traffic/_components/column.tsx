import { ColumnDef } from '@tanstack/react-table'

import TrafficCell from '@/app/tenants/[tenant]/reports/personnel-traffic/_components/traffic-cell'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { ATTENDANCE_STATUS } from '@/constants/attendance-status'
import { AttendanceStatusEnum } from '@/enums/attendance-status.enum'
import { cn } from '@/lib/utils'
import { TrafficInterface } from '@/types/traffic.interface'
import { formatJalaliDate } from '@/utils/date'

export const trafficReportColumns: ColumnDef<TrafficInterface>[] = [
  {
    id: 'date',
    accessorKey: 'date',
    header: ({ column }) => <SortableHeader column={column} title="تاریخ" />,
    cell: ({ row }) => formatJalaliDate(row.original.date),
    meta: { classname: 'text-center', label: 'تاریخ' },
  },
  {
    id: 'day',
    accessorKey: 'date',
    header: 'روز',
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.hint === AttendanceStatusEnum.Holiday &&
            'text-destructive-foreground',
        )}
      >
        {formatJalaliDate(row.original.date, 'EEEE')}
      </span>
    ),
    meta: { classname: 'text-center' },
  },
  {
    id: 'records',
    accessorKey: 'records',
    header: 'ترددها',
    cell: ({ row }) => (
      <TrafficCell records={row.original.records} date={row.original.date} />
    ),
    meta: { classname: 'text-center' },
  },
  {
    id: 'hint',
    accessorKey: 'hint',
    header: 'وضعیت',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={ATTENDANCE_STATUS[row.original.hint].color}
      >
        {ATTENDANCE_STATUS[row.original.hint].label}
      </Badge>
    ),
    meta: { classname: 'text-center' },
  },
  {
    accessorKey: 'attendanceTime',
    header: 'مدت حضور',
    meta: { classname: 'text-center' },
  },
  {
    accessorKey: 'overTime',
    header: 'اضافه کاری',
    meta: { classname: 'text-center' },
  },
  {
    accessorKey: 'deficitTime',
    header: 'کسرکار',
    meta: { classname: 'text-center' },
  },
]
