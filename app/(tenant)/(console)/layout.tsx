import { redirect } from 'next/navigation'

import { MainSidebar } from '@/app/(tenant)/_components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import Header from '../_components/header'
import { getUserInfo } from '../layout'

/** Roles enum of the API: Admin=0, Trainer=1, Trainee=2. */
const TRAINEE = 2

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: user, error } = await getUserInfo()
  const roles = (Array.isArray(user?.role) ? user.role : [user?.role]).map(Number)

  // Menu access is only one layer: a member must not reach any console screen by URL either.
  if (roles.length > 0 && roles.every((role) => role === TRAINEE)) redirect('/home')

  return (
    <div data-slot="console-layout" className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <Header data={user} error={error} />
        <div className="flex flex-1">
          <MainSidebar data={user} error={error} />
          <SidebarInset className="@container/main [--full-h:calc(100svh-0.8px-var(--header-height))] overflow-hidden">
            {/* اگر scrollArea مشکلی ایجاد کرد فقط کلاس ها با SidebarInset جایگزین بشوند تا از scroll پیش فرض مرورگر استفاده بشه */}
            <ScrollArea className="h-[calc(100svh-0.8px-var(--header-height))] gap-4 p-2 sm:p-3 lg:p-4">
              {children}
            </ScrollArea>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
