import { ColumnDef } from '@tanstack/react-table'

import { SortableHeader } from '@/components/data-table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { STATION_STATUS, STATION_TYPE } from '@/constants/station'
import { Station } from '@/types/station.interface'

import StationActionCell from './station-action-cell'

export const stationsListColumns: ColumnDef<Station>[] = [
  {
    id: '#',
    header: '#',
    cell: ({ row }) => row.index + 1,
    meta: { classname: 'text-center' },
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'نام ایستگاه',
    cell: ({ row }) => row.original.name,
    meta: { classname: 'text-center' },
  },
  {
    id: 'code',
    accessorKey: 'code',
    header: 'کد ایستگاه',
    cell: ({ row }) => <Badge variant="outline">{row.original.code}</Badge>,
    meta: { classname: 'text-center' },
  },
  {
    id: 'allowedDistance',
    accessorKey: 'allowedDistance',
    header: ({ column }) => (
      <SortableHeader column={column} title="فاصله مجاز (متر)" />
    ),
    cell: ({ row }) => row.original.allowedDistance.toLocaleString(),
    meta: { classname: 'text-center', label: 'فاصله مجاز' },
  },
  {
    id: 'onWay',
    accessorKey: 'onWay',
    header: 'توراهی',
    cell: ({ row }) => row.original.onWay,
    meta: { classname: 'text-center' },
  },
  {
    id: 'latitude',
    accessorKey: 'latitude',
    header: ({ column }) => (
      <SortableHeader column={column} title="عرض جغرافیا" />
    ),
    cell: ({ row }) => row.original.latitude,
    meta: { classname: 'text-center', label: 'عرض جغرافیا' },
  },
  {
    id: 'longitude',
    accessorKey: 'longitude',
    header: ({ column }) => (
      <SortableHeader column={column} title="طول جغرافیا" />
    ),
    cell: ({ row }) => row.original.longitude,
    meta: { classname: 'text-center', label: 'طول جغرافیا' },
  },
  {
    id: 'stationStatus',
    accessorKey: 'stationStatus',
    header: 'وضعیت ایستگاه',
    cell: ({ row }) => STATION_STATUS[row.original.stationStatus],
    meta: { classname: 'text-center' },
  },
  {
    id: 'stationType',
    accessorKey: 'stationType',
    header: 'نوع ایستگاه',
    cell: ({ row }) => STATION_TYPE[row.original.stationType],
    meta: { classname: 'text-center' },
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: 'آدرس',
    cell: ({ row }) =>
      row.original.address ? (
        <Textarea
          value={row.original.address || ''}
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
    id: 'action',
    header: 'عملیات',
    cell: ({ row }) => <StationActionCell station={row.original} />,
    meta: { classname: 'text-center' },
  },
]
