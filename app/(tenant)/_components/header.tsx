'use client'

import { SidebarIcon } from '@/components/icons'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect } from 'react'

import { NavUser } from '@/app/(tenant)/_components/nav-user'
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
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/85 sticky top-0 z-50 w-full border-b backdrop-blur">
      {/*
        One row on tablet and up. On phones the search drops to a second row instead of
        squeezing the title and the account menu out of the viewport.
      */}
      <div className="flex w-full flex-wrap items-center gap-2 px-2 py-2 sm:h-[var(--header-height)] sm:flex-nowrap sm:px-4 sm:py-0">
        <Button
          className="size-9 shrink-0"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="باز و بسته کردن منو"
        >
          <SidebarIcon />
        </Button>

        <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />

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
                <Fragment key={segment}>
                  {isLast ? <BreadcrumbPage>{label}</BreadcrumbPage> : label}

                  {index + 1 !== pathSegments.length && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Phones get the current page name; a breadcrumb would truncate to nothing. */}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold md:hidden">
          {currentTitle}
        </span>

        <SearchForm className="order-5 w-full sm:order-4 sm:ms-auto sm:w-auto" />

        <div className="order-4 ms-auto flex shrink-0 items-center gap-1 sm:order-5 sm:ms-0 sm:gap-2">
          <NavUser isHeader data={user} error={error} />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
