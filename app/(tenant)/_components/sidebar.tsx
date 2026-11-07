'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import * as React from 'react'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  type SidebarItem,
} from '@/components/ui/sidebar'
import { SIDEBAR_SECTIONS } from '@/constants/sidebar'
import { normalizeApiUserRole } from '@/constants/user-role'
import { ApiUserRole } from '@/features/users/api/users-api'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { ApiResponse } from '@/types/api-response.interface'
import { PublicUser } from '@/types/user.interface'

import { NavUser } from './nav-user'

type MainSidebarProps = React.ComponentProps<typeof Sidebar> &
  ApiResponse<PublicUser>

/** Session roles → normalized enum values; unknown/legacy strings are dropped. */
function useSessionRoles(): ApiUserRole[] {
  const { data: session } = useSession()
  const raw = session?.user?.role
  const values = Array.isArray(raw) ? raw : raw ? [raw] : []

  return values
    .map((value) =>
      normalizeApiUserRole(value as string | number | null | undefined),
    )
    .filter((role): role is ApiUserRole => role !== null)
}

export function MainSidebar({ data: user, error, ...props }: MainSidebarProps) {
  const userRoles = useSessionRoles()
  const isMounted = useIsMounted()
  const pathname = usePathname()

  return (
    <Sidebar
      side="right"
      className="border-border bg-sidebar md:top-14 md:h-[calc(100svh-3.5rem)]"
      {...props}
    >
      {/* HamOwj lockup: orange mark tile on the ivory surface (guide: approved lockup). */}
      <div className="mx-3 mt-3 mb-2">
        <Link
          href="/"
          aria-label="هم‌اوج؛ داشبورد"
          className="focus-visible:ring-ring flex items-center gap-3 rounded-xl border border-transparent p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        >
          <span className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm">
            <HamOwjBrand className="size-8" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-base leading-6 font-extrabold tracking-tight">
              هم‌اوج
            </span>
            <span
              dir="ltr"
              className="text-muted-foreground text-[11px] leading-4 font-semibold"
            >
              HamOwj
            </span>
          </span>
        </Link>
      </div>

      <SidebarContent className="gap-1 px-2 pb-3">
        {isMounted &&
          SIDEBAR_SECTIONS.map((section) => {
            const allowed =
              section.role.length === 0 ||
              section.role.some((value) => userRoles.includes(value))
            if (!allowed) return null

            const visible = section.items.filter(
              (item) =>
                !item.role?.length ||
                item.role.some((value) => userRoles.includes(value)),
            )
            if (!visible.length) return null

            return (
              <section key={section.title} className="pt-2">
                <p className="text-muted-foreground/90 px-2 pb-1.5 text-[10px] font-extrabold tracking-[0.14em]">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {visible.map((item) => (
                    <SidebarRow
                      key={`${section.title}-${item.name}`}
                      item={item}
                      pathname={pathname}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        <NavUser data={user} error={error} />
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarRow({
  item,
  pathname,
}: {
  item: SidebarItem
  pathname: string
}) {
  if (!item.path) return null

  const active =
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)

  return (
    <li>
      <Link
        href={item.path}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex min-h-10 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-extrabold'
            : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground font-semibold'
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="bg-primary absolute inset-y-1.5 start-0 w-1 rounded-full"
          />
        )}
        <span
          aria-hidden
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-foreground'
          }`}
        >
          {item.icon}
        </span>
        <span className="min-w-0 truncate">{item.name}</span>
      </Link>
    </li>
  )
}
