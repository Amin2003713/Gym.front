import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'

import { UserActionCell } from '@/app/tenants/[tenant]/users/_components/user-action-cell'
import { Badge } from '@/components/ui/badge'
import { FilePreview } from '@/components/ui/file-preview'
import { FileType } from '@/enums/file-types.enum'
import { GenderEnum } from '@/enums/gender.enum'
import { cn } from '@/lib/utils'
import { PublicUser } from '@/types/user.interface'

export const usersListColumns: ColumnDef<PublicUser>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'نام',
    cell: ({ row: { original } }) => {
      const name = `${original.firstName} ${original.lastName}`
      return (
        <span className="flex w-[250px] items-center gap-2" title={name}>
          {original.imageUrl ? (
            <FilePreview
              url={original.imageUrl}
              compressedUrl={original.imageUrlCompress ?? undefined}
              fileName={name}
              alt={name}
              type={FileType.Picture}
              className="aspect-square size-10 rounded-full border"
            />
          ) : (
            <Image
              src={
                original.gender === GenderEnum.Male
                  ? '/man-image.webp'
                  : '/woman-image.webp'
              }
              alt={name}
              width={40}
              height={40}
              quality={50}
              className="aspect-square size-10 rounded-full border"
            />
          )}
          <span className="truncate">{name}</span>
        </span>
      )
    },
    meta: { classname: 'text-right' },
  },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: 'شماره تماس',
    cell: ({ row }) => row.original.phoneNumber,
    meta: { classname: 'text-center' },
  },
  {
    id: 'nationalCode',
    accessorKey: 'nationalCode',
    header: 'کدملی',
    cell: ({ row }) => row.original.nationalCode,
    meta: { classname: 'text-center' },
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'وضعیت',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          row.original.isActive
            ? 'text-success-foreground'
            : 'text-destructive',
        )}
      >
        {row.original.isActive ? 'فعال' : 'غیرفعال'}
      </Badge>
    ),
    meta: { classname: 'text-center' },
  },
  {
    id: 'personnelNumber',
    accessorKey: 'personnelNumber',
    header: 'شماره پرسنلی',
    cell: ({ row }) => row.original.personnelNumber ?? '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'departmentName',
    accessorKey: 'departmentName',
    header: 'بخش',
    cell: ({ row }) => row.original.department?.label ?? '--',
    meta: { classname: 'text-center' },
  },
  {
    id: 'action',
    accessorKey: 'action',
    header: 'عملیات',
    cell: ({ row }) => (
      <UserActionCell user={row.original} className="mx-auto" />
    ),
    meta: { classname: 'text-center' },
  },
]
