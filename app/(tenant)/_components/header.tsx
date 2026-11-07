'use client'

import { usePathname } from 'next/navigation'
import { Fragment, useEffect } from 'react'

import { NavUser } from '@/app/(tenant)/_components/nav-user'
import { SidebarIcon } from '@/components/icons'
import { ModeToggle } from '@/components/mode-toggle'
import { OfflineIndicator } from '@/components/offline/offline-indicator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { itemsPageSegments } from '@/constants/routes-translation'
import { toast } from '@/lib/toast'
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

  const lastSegment = pathSegments[pathSegments.length - 1]
  const currentTitle = lastSegment
    ? (itemsPageSegments[lastSegment]?.title ?? decodeSlug(lastSegment))
    : 'داشبورد'

  return (
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/85 sticky top-0 z-50 w-full min-w-0 border-b shadow-[0_1px_0_rgb(27_26_27_/_4%)] backdrop-blur">
      {/*
        One row on tablet and up. On phones the search drops to a second row instead of
        squeezing the title and the account menu out of the viewport.
      */}
      <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-2 py-2 sm:flex sm:h-[var(--header-height)] sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-0">
        <Button
          className="bg-muted/60 hover:bg-muted size-9 shrink-0 rounded-lg"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="باز و بسته کردن منو"
        >
          <SidebarIcon />
        </Button>

        <span aria-hidden className="bg-border hidden h-6 w-px sm:block" />

        <Breadcrumb className="hidden min-w-0 md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">داشبورد</BreadcrumbLink>
            </BreadcrumbItem>
            {!!pathSegments.length && <BreadcrumbSeparator />}
            {pathSegments.map((segment, index) => {
              const label = getBreadcrumbLabel(segment)
              const isLast = index + 1 === pathSegments.length

              return (
                <Fragment key={`${segment}-${index}`}>
                  {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : label}
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <span className="min-w-0 truncate text-sm font-semibold md:hidden">
          {currentTitle}
        </span>

        <div className="col-start-3 row-start-1 flex min-w-0 shrink-0 items-center justify-end gap-1 sm:order-none sm:ms-0 sm:gap-2">
          <OfflineIndicator />
          <NavUser isHeader data={user} error={error} />
          <span aria-hidden className="bg-border hidden h-6 w-px sm:block" />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
