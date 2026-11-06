import { redirect } from 'next/navigation'

import { MainSidebar } from '@/app/(tenant)/_components/sidebar'
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
    <div data-slot="console-layout" className="bg-background min-h-svh [--header-height:3.5rem]">
      <SidebarProvider className="flex min-h-svh flex-col">
        <Header data={user} error={error} />

        <div className="flex min-h-0 flex-1">
          <MainSidebar data={user} error={error} />

          {/*
            Let the document scroll instead of trapping the page in a fixed-height ScrollArea.
            On phones that area was shorter than the visible viewport (browser chrome, a
            two-row header) and clipped the last cards; the sidebar stays fixed on desktop.
          */}
          <SidebarInset className="@container/main min-w-0 flex-1">
            <div className="w-full flex-1 p-2 sm:p-3 lg:p-4">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
