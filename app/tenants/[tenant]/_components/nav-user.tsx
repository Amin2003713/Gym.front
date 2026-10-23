'use client'

import {
  UserIcon,
  LogOut,
  UserRoundPen,
  MessageCircleQuestion,
  MessageCircleMore,
  BookText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { signOutAction } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { PublicUser } from '@/types/user.interface'

type NavUserProp = ApiResponse<PublicUser> & {
  isHeader?: boolean
}

export function NavUser({ isHeader, data: user, error }: NavUserProp) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const removeUserFromStore = useUserStore((state) => state.removeUser)

  const handleSignOut = () => {
    startTransition(async () => {
      const response = await signOutAction()
      if (response.isSuccess) {
        removeUserFromStore()
        router.push('/')
      }
    })
  }

  if (!user && !!error) {
    return (
      <>
        <HoverCard>
          <HoverCardTrigger className="text-sm" asChild>
            <Button
              variant="ghost"
              className="text-destructive-foreground cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut />
              <span className="hidden md:inline">مجدد وارد شوید</span>
            </Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="text-destructive-foreground truncate text-sm">
              {error.title}
            </div>
            <div className="text-destructive-foreground truncate text-xs">
              {error.detail}
            </div>
          </HoverCardContent>
        </HoverCard>
      </>
    )
  }

  if (!user) {
    return (
      <div className="flex h-12 w-full flex-row-reverse items-center justify-between">
        <Skeleton className="size-8 animate-pulse" />
        <div className={`hidden w-full space-y-1 md:block`}>
          <Skeleton className="h-4 w-[85%] animate-pulse" />
          <Skeleton className="h-3 w-28 animate-pulse" />
        </div>
      </div>
    )
  }

  const { firstName, lastName, phoneNumber, imageUrl: profile } = user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-full w-full flex-row-reverse items-center gap-4 px-1"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={profile ?? undefined} alt={firstName} />
            <AvatarFallback className="shrink-0 rounded-lg">
              <UserIcon className="size-5 shrink-0 sm:size-6" />
            </AvatarFallback>
          </Avatar>

          {!(isHeader && isMobile) && (
            <div className="grid flex-1 gap-1 text-right text-sm leading-tight">
              <span className="truncate text-sm font-semibold">
                {`${firstName} ${lastName}`}
              </span>
              <span className="truncate text-xs">{phoneNumber}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex flex-row-reverse items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profile ?? undefined} alt={firstName} />
              <AvatarFallback className="rounded-lg">
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-1 text-right text-sm leading-tight">
              <span className="truncate font-semibold">{`${firstName} ${lastName}`}</span>
              <span className="truncate text-xs">{phoneNumber}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/#">
              <UserRoundPen />
              ویرایش حساب
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <MessageCircleQuestion />
            راهنمای سریع
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MessageCircleMore />
            ارسال بازخورد
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookText />
            لیست بروزرسانی ها
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut />
          خروج از حساب کاربری
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
