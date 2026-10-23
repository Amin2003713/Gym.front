'use client'

import { SidebarIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect } from 'react'
import { toast } from 'sonner'

import { NavUser } from '@/app/tenants/[tenant]/_components/nav-user'
import { ModeToggle } from '@/components/mode-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { itemsPageSegments } from '@/constants/routes-translation'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { PublicUser } from '@/types/user.interface'
import { decodeSlug } from '@/utils/string'

import { SearchForm } from './search-form'

type HeaderProps = ApiResponse<PublicUser>

export default function Header({ data: user, error }: HeaderProps) {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const pathSegments = pathname.split('/').filter((segment) => segment)

  const setUser = useUserStore((state) => state.setUser)

  useEffect(() => {
    if (user) {
      setUser(user)
    } else if (!user && error) {
      toast.error('خطا در دریافت اطلاعات کاربر', { description: error.detail })
    }
    // eslint-disable-next-line
  }, [user])

  const getBreadcrumbLabel = (segment: string) => {
    if (itemsPageSegments[segment]) {
      return <BreadcrumbItem>{itemsPageSegments[segment].title}</BreadcrumbItem>
    }

    return <BreadcrumbItem>{decodeSlug(segment)}</BreadcrumbItem>
  }

  return (
    <header className="bg-secondary sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-[var(--header-height)] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">داشبورد</BreadcrumbLink>
            </BreadcrumbItem>
            {!!pathSegments.length && <BreadcrumbSeparator />}
            {pathSegments.map((segment, index) => {
              const label = getBreadcrumbLabel(segment)

              const isLast = index + 1 === pathSegments.length

              return (
                <Fragment key={segment}>
                  {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : label}

                  {index + 1 !== pathSegments.length && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        <Separator orientation="vertical" className="hidden h-full sm:block" />
        <div className="w-1/12 md:w-1/4 lg:w-1/7 xl:w-1/10">
          <NavUser isHeader data={user} error={error} />
        </div>
        <Separator orientation="vertical" className="hidden h-full sm:block" />
        <ModeToggle />
      </div>
    </header>
  )
}
