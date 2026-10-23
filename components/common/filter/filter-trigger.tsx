'use client'

import { FilterIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFilterStore } from '@/store/filter.store'

type FilterTriggerProps = ButtonProps & {
  showCount?: boolean
}

export function FilterTrigger({
  variant = 'outline',
  size = 'default',
  showCount = true,
  className,
  ...rest
}: FilterTriggerProps) {
  const appliedFilters = useFilterStore((state) => state.appliedFilters)
  const openFilter = useFilterStore((state) => state.openFilter)

  const activeFiltersCount = Object.keys(appliedFilters).filter(
    (key) =>
      appliedFilters[key] !== undefined &&
      appliedFilters[key] !== '' &&
      (Array.isArray(appliedFilters[key])
        ? appliedFilters[key].length > 0
        : true),
  ).length

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openFilter}
      className={cn('relative', className)}
      {...rest}
    >
      <FilterIcon className="mr-2 h-4 w-4" />
      فیلتر
      {showCount && activeFiltersCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  )
}
