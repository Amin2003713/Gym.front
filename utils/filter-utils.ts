import { FilterField, FilterOption } from '@/components/types/filter.types'

// Helper function to create filter configurations
export function createFilterConfig<T>(
  fields: FilterField[],
  filterFunction: (data: T[], filters: Record<keyof T, any>) => T[],
) {
  return {
    fields,
    onFilter: filterFunction,
  }
}

// Common filter functions
export const filterUtils = {
  // Text search filter
  textFilter: <T>(data: T[], key: keyof T, searchTerm: string): T[] => {
    if (!searchTerm) return data
    return data.filter((item) => String(item[key]).toLowerCase().includes(searchTerm.toLowerCase()))
  },

  // Select filter
  selectFilter: <T>(data: T[], key: keyof T, value: string | number): T[] => {
    if (!value) return data
    return data.filter((item) => item[key] == value)
  },

  multiCheckFilter: <T>(data: T[], key: keyof T, values: (string | number)[]): T[] => {
    if (!values?.length) return data
    const set = new Set(values.map(String))
    return data.filter((i) => set.has(String(i[key] as string | number)))
  },

  // Multi-select filter
  multiSelectFilter: <T extends Record<K, { id: string }>, K extends keyof T>(
    data: T[],
    key: K,
    values: { value: string; label: string }[],
  ): T[] => {
    if (!values || values.length === 0) return data
    const valuesIds = values.map((v) => v.value)
    return data.filter((item) => valuesIds.includes(item[key]?.id))
  },

  // Number range filter
  numberRangeFilter: <T>(data: T[], key: keyof T, range: { min?: number; max?: number }): T[] => {
    if (!range.min && !range.max) return data
    return data.filter((item) => {
      const value = Number(item[key])
      if (range.min && value < range.min) return false
      if (range.max && value > range.max) return false
      return true
    })
  },

  // Date range filter
  dateRangeFilter: <T>(data: T[], key: keyof T, range: { from?: Date; to?: Date }): T[] => {
    if (!range.from && !range.to) return data
    return data.filter((item) => {
      const date = new Date(item[key] as string)
      if (range.from && date < range.from) return false
      if (range.to && date > range.to) return false
      return true
    })
  },
}

export function isFilterActive(value: unknown): boolean {
  if (value === undefined || value === '') return false

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object' && value !== null) {
    const values = Object.values(value)
    if (values.length === 0) return false
    return values.some((v) => v !== undefined && v !== '')
  }

  return true
}

// Helper to generate options from data
export function generateOptionsFromData<T>(data: T[], key: keyof T, labelKey?: keyof T): FilterOption[] {
  const uniqueValues = [...new Set(data.filter((d) => !!d).map((item) => item[key]))]
  return uniqueValues.map((value) => ({
    value: value as string,
    label: labelKey ? String(data.find((item) => item?.[key] === value)?.[labelKey]) : String(value),
  }))
}
