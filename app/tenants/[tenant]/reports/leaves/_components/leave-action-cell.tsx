'use client'

import {
  MoreVerticalIcon,
  PenIcon,
  Trash2Icon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Fragment,
  ReactNode,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from 'react'
import { toast } from 'sonner'

import { deleteLeaveAction } from '@/actions/leave'
import ApproveOrRejectLeave from '@/app/tenants/[tenant]/reports/leaves/_components/approve-or-reject-leave'
import UpdateLeaveDialog from '@/app/tenants/[tenant]/reports/leaves/_components/update-leave-dialog'
import AreYouSure from '@/components/common/are-you-sure'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LEAVE_TYPE } from '@/constants/leave'
import { LeaveStatusEnum } from '@/enums/leave.enums'
import { Leave } from '@/types/leave.interface'

type LeaveActionCellProps = {
  leave: Leave
}

export default function LeaveActionCell({ leave }: LeaveActionCellProps) {
  const router = useRouter()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [openReview, setOpenReview] = useState<
    LeaveStatusEnum.Approved | LeaveStatusEnum.Rejected | null
  >(null)

  const [formState, action] = useActionState(deleteLeaveAction, null)
  const [isDeleting, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(() => action(leave.id))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('حذف برنامه با موفقیت انجام شد')
      router.refresh()
    } else if (!!formState?.error && !formState.isSuccess) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  const DROPDOWN_MENU_ITEMS: {
    label: string
    icon: ReactNode
    onClick: VoidFunction
    disabled?: boolean
  }[] = [
    {
      label: 'تایید',
      icon: <UserRoundCheckIcon />,
      onClick: () => setOpenReview(LeaveStatusEnum.Approved),
      disabled: leave.status === LeaveStatusEnum.Approved,
    },
    {
      label: 'رد',
      icon: <UserRoundXIcon />,
      onClick: () => setOpenReview(LeaveStatusEnum.Rejected),
      disabled: leave.status === LeaveStatusEnum.Rejected,
    },
    {
      label: 'ویرایش',
      icon: <PenIcon />,
      onClick: () => setIsEditOpen(true),
    },
    {
      label: 'حذف',
      icon: <Trash2Icon />,
      onClick: () => setIsDeleteOpen(true),
    },
  ]
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
            aria-label="باز کردن منوی عملیات"
          >
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="center" className="w-40">
          {DROPDOWN_MENU_ITEMS.map((d, idx) => (
            <Fragment key={`${d.label}-${idx}`}>
              <DropdownMenuItem
                disabled={d.disabled}
                onSelect={d.onClick}
                className="flex items-center justify-between"
              >
                <span>{d.label}</span>
                {d.icon}
              </DropdownMenuItem>
              {idx === 1 && <DropdownMenuSeparator />}
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {isEditOpen && (
        <UpdateLeaveDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          leave={leave}
        />
      )}
      {isDeleteOpen && (
        <AreYouSure
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          action={handleDelete}
          loading={isDeleting}
          title={`حذف مرخصی "${leave.user.name}"`}
          description={`آیا از حذف مرخصی "${leave.user.name}" بابت ${LEAVE_TYPE[leave.type]} اطمینان دارید ؟`}
          confirmLabel="بله، حذف کن"
        />
      )}
      {!!openReview && (
        <ApproveOrRejectLeave
          open={!!openReview}
          onOpenChange={() => setOpenReview(null)}
          leave={leave}
          actionType={openReview}
        />
      )}
    </>
  )
}
