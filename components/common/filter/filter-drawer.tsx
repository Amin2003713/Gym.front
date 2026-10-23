'use client'

import isEqual from 'lodash.isequal'
import { X, Filter } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

import { FilterConfig } from '@/components/types/filter.types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Form } from '@/components/ui/form'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFilterStore } from '@/store/filter.store'
import { isFilterActive } from '@/utils/filter-utils'

import { FilterFieldRenderer } from './filter-field-renderer'

interface FilterDrawerProps<T> {
  config: FilterConfig<T>
  title?: string
}

// todo => performance: should prevent additional re-renders!
export function FilterDrawer<T>({
  config,
  title = 'فیلترها',
}: FilterDrawerProps<T>) {
  const {
    isOpen,
    activeFilters,
    appliedFilters,
    closeFilter,
    openFilter,
    setActiveFilters,
    applyFilters,
    clearFilters,
    resetFilters,
  } = useFilterStore()

  const form = useForm({
    defaultValues: appliedFilters,
  })

  const drawerRef = useRef(null)
  const isMobile = useIsMobile()

  const { handleSubmit, reset, watch } = form

  // Watch form changes and update store
  const watchedValues = watch()

  useEffect(() => {
    const hasChanges = !isEqual(watchedValues, activeFilters)
    if (hasChanges) {
      setActiveFilters(watchedValues)
    }
  }, [watchedValues, setActiveFilters, activeFilters])

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      reset(appliedFilters)
    }
  }, [isOpen, appliedFilters, reset])

  useEffect(() => {
    resetFilters()
    reset({})
  }, [resetFilters, reset])

  const onSubmit = () => applyFilters()

  const handleClearAll = () => {
    clearFilters()
    reset({})
  }

  const hasActiveFilters = !isEqual(activeFilters, appliedFilters)

  const hasAppliedFilters = Object.values(appliedFilters).some(isFilterActive)

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => (open ? openFilter() : closeFilter())}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent
        className="h-svh !max-h-svh"
        ref={drawerRef}
        aria-describedby={undefined}
      >
        <DrawerHeader className="flex shrink-0 flex-row items-center justify-between border-b">
          {hasAppliedFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              حذف فیلترها
            </Button>
          )}
          <DrawerTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            {title}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-scroll p-4">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-2 md:space-y-4"
            >
              {config.fields.map((field) => (
                <FilterFieldRenderer
                  key={field.key}
                  field={field}
                  form={form}
                  drawerRef={drawerRef}
                />
              ))}
            </form>
          </Form>
        </div>

        <DrawerFooter className="shrink-0 border-t">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            اعمال فیلترها
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
