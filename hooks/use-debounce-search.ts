'use client'

import type React from 'react'
import { useState, useMemo, useCallback } from 'react'

/**
 * Type-safe nested path builder for accessing deep object properties
 * Examples: 'user.name', 'user.profile.email', 'tags[0].name'
 */
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & (string | number)]: T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`
    }[keyof T & (string | number)]
  : never

/**
 * Configuration options for the debounced search hook
 */
type UseDebouncedSearchOptions<T> = {
  /** The data array to search through */
  data: T[]
  /** Array of nested paths to search in (e.g., ['name', 'user.email', 'tags[0].name']) */
  searchKeys: NestedKeyOf<T>[] | string[]
  /** Debounce delay in milliseconds */
  delay?: number
  /** Enable case-sensitive search */
  caseSensitive?: boolean
  /** Custom search function for advanced filtering */
  customMatcher?(item: T, searchTerm: string): boolean
}

/**
 * Return type of the hook
 */
type UseDebouncedSearchReturn<T> = {
  /** Current search term (debounced) */
  searchTerm: string
  /** Filtered data based on search term */
  filteredData: T[]
  /** Handler for input change events */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Direct setter for search term (useful for programmatic updates) */
  setSearchValue: (value: string) => void
  /** Clear search and reset to original data */
  clearSearch: () => void
  /** Whether search is currently active */
  isSearching: boolean
}

/**
 * Custom debounce implementation to avoid external dependencies
 */
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number,
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }) as T & { cancel: () => void }

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debouncedFn
}

/**
 * Type guard to check if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard to check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Type guard to check if value is a primitive that can be converted to string
 */
function isPrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

/**
 * Safely access nested properties using dot notation
 * Supports: 'user.name', 'user.profile.email', etc.
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    // Type guard to ensure current is an object
    if (!isObject(current)) {
      return undefined
    }

    // Handle array notation like 'tags[0]'
    const arrayMatch = key.match(/^(\w+)\[(\d+)]$/)
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch
      const arrayValue = current[arrayKey]

      if (isArray(arrayValue)) {
        return arrayValue[Number.parseInt(index, 10)]
      }
      return undefined
    }

    return current[key]
  }, obj as unknown)
}

/**
 * Normalize text for consistent searching
 */
function normalizeText(text: string, caseSensitive: boolean): string {
  const normalized = text.trim().replace(/\s+/g, ' ')
  return caseSensitive ? normalized : normalized.toLowerCase()
}

/**
 * Convert value to searchable string with type safety
 */
function valueToString(value: unknown): string {
  // Handle null and undefined
  if (!value) {
    return ''
  }

  // Handle primitives
  if (isPrimitive(value)) {
    return String(value)
  }

  // Handle arrays recursively
  if (isArray(value)) {
    return value.map(valueToString).join(' ')
  }

  // Handle objects
  if (isObject(value)) {
    return Object.values(value).map(valueToString).join(' ')
  }

  // Fallback for any other types
  return ''
}

/**
 * Advanced debounced search hook with nested path support
 *
 * @example
 * const { filteredData, handleChange } = useDebouncedSearch({
 *   data: leaves,
 *   searchKeys: ['user.name', 'user.email', 'status'],
 *   delay: 300,
 * })
 */
export function useDebouncedSearch<T>({
  data,
  searchKeys,
  delay = 300,
  caseSensitive = false,
  customMatcher,
}: UseDebouncedSearchOptions<T>): UseDebouncedSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState('')
  const [immediateValue, setImmediateValue] = useState('')

  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setSearchTerm(value), delay),
    [delay],
  )

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setImmediateValue(value)
      debouncedSetSearchTerm(value)
    },
    [debouncedSetSearchTerm],
  )

  // Direct setter for programmatic updates
  const setSearchValue = useCallback(
    (value: string) => {
      setImmediateValue(value)
      debouncedSetSearchTerm(value)
    },
    [debouncedSetSearchTerm],
  )

  // Clear search
  const clearSearch = useCallback(() => {
    setImmediateValue('')
    setSearchTerm('')
    debouncedSetSearchTerm.cancel()
  }, [debouncedSetSearchTerm])

  // Filter data based on search term
  const filteredData = useMemo(() => {
    const term = normalizeText(searchTerm, caseSensitive)

    // Return all data if no search term
    if (!term) return data

    return data.filter((item) => {
      // Use custom matcher if provided
      if (customMatcher) {
        return customMatcher(item, searchTerm)
      }

      // Search through all specified keys
      return searchKeys.some((key) => {
        const value = getNestedValue(item, key as string)
        const stringValue = valueToString(value)

        if (!stringValue) return false

        const normalizedValue = normalizeText(stringValue, caseSensitive)
        return normalizedValue.includes(term)
      })
    })
  }, [searchTerm, data, searchKeys, caseSensitive, customMatcher])

  const isSearching = immediateValue !== searchTerm

  return {
    searchTerm,
    filteredData,
    handleChange,
    setSearchValue,
    clearSearch,
    isSearching,
  }
}
