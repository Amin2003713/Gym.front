import { MainSidebar } from '@/app/(tenant)/_components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import Header from '../_components/header'
import { getUserInfo } from '../layout'

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: user, error } = await getUserInfo()

  return (
    <div data-slot="console-layout" className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <Header data={user} error={error} />
        <div className="flex flex-1">
          <MainSidebar data={user} error={error} />
          <SidebarInset className="@container/main overflow-hidden [--full-h:calc(100svh-0.8px-var(--header-height))]">
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
