'use client'

import { ChevronRight } from '@/components/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import * as React from 'react'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { normalizeApiUserRole } from '@/constants/user-role'
import { SIDEBAR_OPTIONS } from '@/constants/sidebar'
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

  return (
    <Sidebar
      side="right"
      className="border-border top-[calc(--spacing(14))] h-[calc(100svh-calc(--spacing(14)))]!"
      {...props}
    >
      {/* HamOwj lockup: mark + Persian and Latin wordmarks (guide: approved lockup). */}
      <div className="bg-card mx-3 my-3 rounded-lg border px-3 py-4 shadow-sm">
        <Link
          href="/"
          aria-label="هم‌اوج؛ داشبورد"
          className="focus-visible:ring-ring flex flex-row items-center gap-3 rounded-lg betwee outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        >
          <span className="bg-foreground text-background flex size-12 shrink-0 items-center justify-center rounded-lg">
            <HamOwjBrand className="size-9" />
          </span>

          <span className="flex min-w-0 flex-col items-start">
            <span className="font-extrabold tracking-tight">هم‌اوج</span>
            <span
              dir="ltr"
              className="text-muted-foreground text-xs font-semibold"
            >
              HamOwj
            </span>
          </span>
        </Link>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SIDEBAR_OPTIONS.tree.map((item, index) => (
                <Tree
                  key={`${item.name}-${index}`}
                  item={item}
                  userRoles={userRoles}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser data={user} error={error} />
      </SidebarFooter>
    </Sidebar>
  )
}

function Tree({
  item,
  userRoles,
  inheritedRoles = [],
}: {
  item: SidebarItem
  userRoles: ApiUserRole[]
  /** Roles of the parent node; a child without its own `role` is limited to these. */
  inheritedRoles?: ApiUserRole[]
}) {
  const isMounted = useIsMounted()
  const pathname = usePathname()
  const { name, path, icon, colorClass, children, role } = item
  const href = path ? (path === '/' ? '/' : path) : undefined

  const effectiveRoles = role && role.length > 0 ? role : inheritedRoles
  const hasRoleAccess =
    effectiveRoles.length === 0 ||
    effectiveRoles.some((value) => userRoles.includes(value))

  // Prevent hydration mismatch: the session role is only known on the client.
  if (!isMounted) return null
  if (!hasRoleAccess) return null

  if (!children?.length) {
    return (
      <SidebarMenuButton
        asChild
        isActive={href ? pathname === href : false}
        className="data-[active=true]:bg-primary/15 data-[active=true]:text-foreground data-[active=true]:before:bg-primary hover:bg-muted focus-visible:ring-ring relative rounded-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2 data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:start-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-full data-[active=true]:before:content-['']"
      >
        {href ? (
          <Link
            href={href}
            className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            <span className={colorClass}>{icon}</span>
            {name}
          </Link>
        ) : (
          <>
            <span className={colorClass}>{icon}</span>
            {name}
          </>
        )}
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2">
            <ChevronRight className="h-4 w-4 transition-transform" />
            <span className={colorClass}>{icon}</span>
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((subItem, index) => (
              <Tree
                key={`${subItem.name}-${index}`}
                item={subItem}
                userRoles={userRoles}
                inheritedRoles={effectiveRoles}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
