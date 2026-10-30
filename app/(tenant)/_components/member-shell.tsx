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
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

import { isMemberPathActive, MEMBER_MORE, MEMBER_NAV } from './member-nav'

type MemberShellProps = {
  user: PublicUser | null
  error: Problem | null
  children: React.ReactNode
}

/**
 * The member-facing chrome: a compact top bar and a bottom tab bar on phones, the same four tabs
 * inline on wide screens. It deliberately shares nothing with the console sidebar except the brand
 * mark and the theme toggle, so the two roles never inherit each other's look.
 */
export function MemberShell({ user, error, children }: MemberShellProps) {
  const pathname = usePathname()

  return (
    <div data-slot="member-shell" dir="rtl" className="bg-background min-h-svh">
      <header className="bg-card/90 supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link href="/home" className="flex items-center gap-2">
            <span className="bg-foreground text-background flex size-9 items-center justify-center rounded-xl">
              <HamOwjBrand className="size-6" />
            </span>
            <span className="text-sm font-extrabold tracking-tight">هم‌اوج</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {MEMBER_NAV.map(({ href, label, icon: Icon }) => {
              const active = isMemberPathActive(pathname, href)

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="ms-auto flex items-center gap-1 md:ms-0">
            <ModeToggle />
            <MemberUserMenu user={user} error={error} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-24 md:pb-10">
        {children}
      </main>

      <nav className="bg-card/95 supports-[backdrop-filter]:bg-card/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {MEMBER_NAV.map(({ href, label, icon: Icon }) => {
            const active = isMemberPathActive(pathname, href)

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    active ? 'bg-primary/12' : ''
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
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
