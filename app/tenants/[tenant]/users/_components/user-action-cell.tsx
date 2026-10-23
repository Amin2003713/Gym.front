'use client'

import {
  BadgeCheckIcon,
  BanIcon,
  FingerprintIcon,
  MoreVerticalIcon,
  PenIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  ReactNode,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from 'react'
import { toast } from 'sonner'

import { activationUserAction } from '@/actions/user'
import UpdateUserDialog from '@/app/tenants/[tenant]/users/_components/update-user-dialog'
import { UpdateUserSimSerialDialog } from '@/app/tenants/[tenant]/users/_components/update-user-sim-serial'
import AreYouSure from '@/components/common/are-you-sure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/user.store'
import { PublicUser } from '@/types/user.interface'

type UserActionCellProps = {
  user: PublicUser
  className?: string
}

export const UserActionCell = ({ user, className }: UserActionCellProps) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false)
  const [isSimSerialOpen, setIsSimSerialOpen] = useState<boolean>(false)
  const [isActivationOpen, setIsActivationOpen] = useState<boolean>(false)

  const [isPending, startTransition] = useTransition()
  const [formState, action] = useActionState(activationUserAction, null)

  const handleActivationUser = () => startTransition(() => action(user.id))

  const router = useRouter()
  const isAdmin = useUserStore((state) => state.isAdmin)
  const isSupervisor = useUserStore((state) => state.isSupervisor)

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success('کاربر با موفقیت ویرایش یافت')
      setIsActivationOpen(false)
      router.refresh()
    } else if (!!formState && !formState.isSuccess && !!formState.error) {
      toast.error('خطا!', { description: formState.error.detail })
    }
    // eslint-disable-next-line
  }, [formState])

  const DROPDOWN_MENU_ITEMS: {
    label: string
    icon: ReactNode
    onClick: VoidFunction
  }[] = [
    {
      label: 'ویرایش',
      icon: <PenIcon />,
      onClick: () => setIsUpdateOpen(true),
    },
    {
      label: 'ویرایش شناسه',
      icon: <FingerprintIcon />,
      onClick: () => setIsSimSerialOpen(true),
    },
    {
      label: 'فعال/غیرفعال',
      icon: <BadgeCheckIcon />,
      onClick: () => setIsActivationOpen(true),
    },
  ]

  if (!isAdmin && !isSupervisor)
    return <BanIcon className="text-destructive-foreground mx-auto size-4" />

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'text-muted-foreground data-[state=open]:bg-muted flex size-8',
              className,
            )}
            aria-label="باز کردن منوی عملیات"
          >
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="center" className="w-40">
          {DROPDOWN_MENU_ITEMS.map((d, id) => (
            <DropdownMenuItem
              key={`${d.label}-${id}`}
              onSelect={d.onClick}
              className="flex items-center justify-between"
            >
              <span>{d.label}</span>
              {d.icon}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Dialogs */}
      {isUpdateOpen && (
        <UpdateUserDialog
          user={user}
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
        />
      )}
      {isSimSerialOpen && (
        <UpdateUserSimSerialDialog
          userName={`${user.firstName} ${user.lastName}`}
          userId={user.id}
          prevSimSerial={user.simSerial}
          open={isSimSerialOpen}
          onOpenChange={setIsSimSerialOpen}
        />
      )}
      {isActivationOpen && (
        <AreYouSure
          open={isActivationOpen}
          onOpenChange={setIsActivationOpen}
          title="ویرایش وضعیت"
          action={handleActivationUser}
          loading={isPending}
          description={
            <span className="flex items-center gap-2">
              آیا از ویرایش وضعیت
              <Badge variant="outline" className="p-2 font-semibold">
                {`${user.firstName} ${user.lastName}`}
              </Badge>
              به
              <Badge variant={user.isActive ? 'destructive' : 'default'}>
                {user.isActive ? 'غیرفعال' : 'فعال'}
              </Badge>
              اطمینان دارید؟
            </span>
          }
        />
      )}
    </>
  )
}
