'use client'

import { useSearchParams } from 'next/navigation'
import React, { ReactNode } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface CustomPaginationProps {
  pageCount: number
  currentPage: number
  paginationKey?: string
  maxVisiblePages?: number
  className?: string
}

const CustomPagination = ({
  currentPage,
  pageCount,
  paginationKey = 'pageNumber',
  maxVisiblePages = 3,
  className,
}: CustomPaginationProps) => {
  const searchParams = useSearchParams()

  const buildLink = (pageNumber: number) => {
    if (pageNumber == currentPage) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    params.set(paginationKey, pageNumber.toString())

    return `?${params.toString()}`
  }

  const renderPageNumbers = () => {
    const items: ReactNode[] = []

    if (pageCount <= maxVisiblePages) {
      for (let i = 1; i <= pageCount; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href={buildLink(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href={buildLink(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>,
      )

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(pageCount - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href={buildLink(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }

      if (currentPage < pageCount - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      items.push(
        <PaginationItem key={pageCount}>
          <PaginationLink
            href={buildLink(pageCount)}
            isActive={currentPage === pageCount}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items.reverse()
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem
          className={
            currentPage === pageCount
              ? 'pointer-events-none opacity-50'
              : undefined
          }
        >
          <PaginationNext href={buildLink(currentPage + 1)} />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem
          className={
            currentPage === 1 ? 'pointer-events-none opacity-50' : undefined
          }
        >
          <PaginationPrevious href={buildLink(currentPage - 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default CustomPagination
