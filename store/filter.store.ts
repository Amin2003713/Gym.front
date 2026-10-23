import isEqual from 'lodash.isequal'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface FilterState {
  isOpen: boolean
  activeFilters: Record<string, unknown>
  appliedFilters: Record<string, unknown>
}

interface FilterStore extends FilterState {
  // Actions
  openFilter: () => void
  closeFilter: () => void
  setActiveFilters: (filters: Record<string, unknown>) => void
  applyFilters: () => void
  clearFilters: () => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOpen: false,
      activeFilters: {},
      appliedFilters: {},

      // Actions
      openFilter: () => set({ isOpen: true }),

      closeFilter: () => set({ isOpen: false }),

      setActiveFilters: (filters) => {
        const current = get().activeFilters
        const hasChanges = !isEqual(current, filters)
        if (hasChanges) {
          set({ activeFilters: { ...filters } })
        }
      },

      applyFilters: () => {
        const { activeFilters } = get()
        set({
          appliedFilters: { ...activeFilters },
          isOpen: false,
        })
      },

      clearFilters: () =>
        set({
          activeFilters: {},
          appliedFilters: {},
        }),

      resetFilters: () =>
        set({
          isOpen: false,
          activeFilters: {},
          appliedFilters: {},
          // activeFilters: get().appliedFilters,
        }),
    }),
    { name: 'filter-store' },
  ),
)
