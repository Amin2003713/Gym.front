'use client'

import { ChevronRight } from 'lucide-react'
import { HamOwjMark } from '@/components/branding/hamowj-mark'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import * as React from 'react'

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
import { SIDEBAR_OPTIONS } from '@/constants/sidebar'
import { UserRoleEnum } from '@/enums/user-role.enum'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { ApiResponse } from '@/types/api-response.interface'
import { PublicUser } from '@/types/user.interface'

import { NavUser } from './nav-user'

type MainSidebarProps = React.ComponentProps<typeof Sidebar> &
  ApiResponse<PublicUser>

export function MainSidebar({ data: user, error, ...props }: MainSidebarProps) {
  const { data: session } = useSession()
  const userRoles = session?.user?.role ?? []

  return (
    <Sidebar
      side="right"
      className="border-border top-[calc(theme(spacing.14))] !h-[calc(100svh-calc(theme(spacing.14)))]"
      {...props}
    >
      <div className="mx-3 my-3 rounded-2xl border bg-card px-3 py-4 shadow-sm">
        <Link href="/" aria-label="هم‌اوج؛ داشبورد" className="flex flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background"><HamOwjMark className="size-8" /></span>
          <span className="text-center text-sm font-bold">هم‌اوج</span>
          <span className="text-center text-[11px] leading-5 text-muted-foreground">هم‌مسیرِ پیشرفت</span>
        </Link>
      </div>

      <SidebarContent>
        <SidebarGroup>
          {/*<SidebarGroupLabel>Files</SidebarGroupLabel>*/}
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
}: {
  item: SidebarItem
  userRoles: UserRoleEnum[]
}) {
  const isMounted = useIsMounted()
  const pathname = usePathname() // For checking active route
  const { name, path, icon, colorClass, children, role } = item
  const hasRoleAccess = role ? role.some((r) => userRoles.includes(r)) : true

  // prevent hydration mismatch
  if (!isMounted) return null

  if (!hasRoleAccess) return null

  if (!children?.length) {
    // Render as button with link if path exists
    return (
      <SidebarMenuButton
        asChild // Use asChild for wrapping Link to maintain accessibility
        isActive={path ? pathname === path : false}
        className="rounded-xl transition-colors data-[active=true]:bg-primary/15 data-[active=true]:font-semibold data-[active=true]:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        {path ? (
          <Link href={path} className="flex items-center gap-2 rounded-xl transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
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

  // Group node: Collapsible with sub-items
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="flex items-center gap-2 rounded-xl transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
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
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
