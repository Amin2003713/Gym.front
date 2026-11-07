'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { Flame } from '@/components/icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { MEMBER_FEATURE_GROUPS } from './member-feature-groups'
import { isMemberPathActive } from './member-nav'

/**
 * The trainer's desktop rail, built on the console's sidebar primitives so both roles share the
 * same geometry, active marker and focus behaviour — only the content groups differ.
 */
export function MemberSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="border-border top-[calc(--spacing(14))] h-[calc(100svh-calc(--spacing(14)))]!"
    >
      <div className="bg-card mx-3 my-3 rounded-lg border px-3 py-4 shadow-sm">
        <Link
          href="/home"
          aria-label="هم‌اوج؛ خانه تمرین"
          className="focus-visible:ring-ring flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        >
          <span className="bg-foreground text-background flex size-12 shrink-0 items-center justify-center rounded-lg">
            <HamOwjBrand className="size-9" />
          </span>
          <span className="flex min-w-0 flex-col items-start">
            <span className="font-extrabold tracking-tight">هم‌اوج</span>
            <span dir="ltr" className="text-muted-foreground text-xs font-semibold">
              HamOwj
            </span>
          </span>
        </Link>
      </div>

      <SidebarContent>
        {MEMBER_FEATURE_GROUPS.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isMemberPathActive(pathname, href)

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="data-[active=true]:bg-primary/12 data-[active=true]:text-foreground hover:bg-muted relative h-10 rounded-sm transition-colors data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:start-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary data-[active=true]:before:content-['']"
                      >
                        <Link href={href} aria-current={active ? 'page' : undefined}>
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <p className="text-muted-foreground/80 flex items-center justify-center gap-1 pb-1 text-[10px]">
          <Flame className="size-3" aria-hidden />
          نسخه ۱.۰
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
