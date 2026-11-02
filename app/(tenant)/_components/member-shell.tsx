'use client'

import { LogOut, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { signOutAction } from '@/actions/auth'
import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { ModeToggle } from '@/components/mode-toggle'
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
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

import { MemberFeatureSheet } from './member-feature-sheet'
import { isMemberPathActive, MEMBER_MORE, MEMBER_NAV } from './member-nav'
import { MemberSidebar } from './member-sidebar'

type MemberShellProps = {
  user: PublicUser | null
  error: Problem | null
  children: React.ReactNode
}

/**
 * The trainer shell. Wide screens get the same rail + inset pattern as the coach console (shared
 * sidebar primitives and tokens, with the trainer's own groups); phones keep the compact top bar
 * and tab bar, now with statistics and an "all features" sheet so nothing hides in a dropdown.
 */
export function MemberShell({ user, error, children }: MemberShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider className="min-h-svh">
      <div data-slot="member-shell" dir="rtl" className="bg-background flex min-h-svh w-full">
        <MemberSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-card/90 supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40 border-b backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-3 sm:px-4">
              <span className="hidden md:inline-flex">
                <SidebarTrigger aria-label="جمع کردن منو" />
              </span>

              <Link href="/home" className="flex items-center gap-2 md:hidden">
                <span className="bg-foreground text-background flex size-9 items-center justify-center rounded-xl">
                  <HamOwjBrand className="size-6" />
                </span>
                <span className="text-sm font-extrabold tracking-tight">هم‌اوج</span>
              </Link>

              <div className="ms-auto flex items-center gap-1">
                <ModeToggle />
                <MemberUserMenu user={user} error={error} />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10">
            {children}
          </main>

          <nav
            aria-label="ناوبری اصلی"
            className="bg-card/95 supports-[backdrop-filter]:bg-card/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
          >
            <div className="mx-auto grid max-w-lg grid-cols-6">
              {MEMBER_NAV.map(({ href, label, icon: Icon }) => {
                const active = isMemberPathActive(pathname, href)

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-11 items-center justify-center rounded-full transition-colors ${
                        active ? 'bg-primary/12' : ''
                      }`}
                    >
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    {label}
                  </Link>
                )
              })}
              <MemberFeatureSheet
                active={MEMBER_NAV.find((item) => isMemberPathActive(pathname, item.href))?.href}
              />
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  )
}

function MemberUserMenu({ user, error }: Pick<MemberShellProps, 'user' | 'error'>) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const signOut = () =>
    startTransition(async () => {
      const response = await signOutAction()
      if (response.isSuccess) router.push('/')
    })

  if (!user) {
    return (
      <Button variant="ghost" size="icon" onClick={signOut} aria-label="ورود مجدد">
        <LogOut className={error ? 'text-destructive' : undefined} />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.imageUrl ?? undefined} alt={user.firstName} />
            <AvatarFallback className="rounded-lg">
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">
            {user.firstName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold">
            {`${user.firstName} ${user.lastName}`}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {user.phoneNumber}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {MEMBER_MORE.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild>
              <Link href={href}>
                <Icon className="size-4" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="size-4" />
            خروج از حساب
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
