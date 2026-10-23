'use client'

import type { Column } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>
  title: React.ReactNode
  className?: string
}

export function SortableHeader<TData>({
  column,
  title,
  className,
}: SortableHeaderProps<TData>) {
  const sortDirection = column.getIsSorted()

  const getSortIcon = () => {
    switch (sortDirection) {
      case 'asc':
        return <ArrowUp className="ml-2 h-4 w-4" />
      case 'desc':
        return <ArrowDown className="ml-2 h-4 w-4" />
      default:
        return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sortDirection === 'asc')}
      className={cn('hover:bg-muted/50 h-auto p-0 font-semibold', className)}
    >
      {title}
      {getSortIcon()}
    </Button>
  )
}
