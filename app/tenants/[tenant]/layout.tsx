import { MainSidebar } from '@/app/tenants/[tenant]/_components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { readData } from '@/core/http-service'
import { AuthProvider } from '@/providers/auth-provider'
import { Problem } from '@/types/http-errors.interface'
import { PublicUser } from '@/types/user.interface'

import Header from './_components/header'

const getUserInfo = async () =>
  readData<PublicUser>('user/user-info')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const problem = err as Problem
      return {
        data: null,
        error: problem,
      }
    })

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: user, error } = await getUserInfo()

  return (
    <AuthProvider>
      <div className="[--header-height:calc(theme(spacing.14))]">
        <SidebarProvider className="flex flex-col">
          <Header data={user} error={error} />
          <div className="flex flex-1">
            <MainSidebar data={user} error={error} />
            <SidebarInset className="@container/main overflow-hidden [--full-h:calc(100svh-0.8px-var(--header-height))]">
              {/* اگر scrollArea مشکلی ایجاد کرد فقط کلاس ها با SidebarInset جایگزین بشوند تا از scroll پیش فرض مرورگر استفاده بشه */}
              <ScrollArea className="h-[calc(100svh-0.8px-var(--header-height))] gap-4 p-2">
                {children}
              </ScrollArea>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </AuthProvider>
  )
}
