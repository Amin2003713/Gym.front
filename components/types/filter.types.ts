export type FilterFieldType =
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'dateRange'
  | 'numberRange'
  | 'checkbox'
  | 'radio'

export interface FilterOption {
  label: string
  value: string
}

export interface BaseFilterField {
  key: string
  label: string
  type: FilterFieldType
  placeholder?: string
  required?: boolean
}

export interface TextFilterField extends BaseFilterField {
  type: 'text'
}

export interface SelectFilterField extends BaseFilterField {
  type: 'select'
  options: FilterOption[]
}

export interface MultiSelectFilterField extends BaseFilterField {
  type: 'multiSelect'
  options: FilterOption[]
}

export interface RadioFilterField extends BaseFilterField {
  type: 'radio'
  options: FilterOption[]
}

export interface DateRangeFilterField extends BaseFilterField {
  type: 'dateRange'
  minDate?: Date
  maxDate?: Date
}

export interface NumberRangeFilterField extends BaseFilterField {
  type: 'numberRange'
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface CheckboxFilterField extends BaseFilterField {
  type: 'checkbox'
  options: FilterOption[]
}

export type FilterField =
  | TextFilterField
  | SelectFilterField
  | MultiSelectFilterField
  | RadioFilterField
  | DateRangeFilterField
  | NumberRangeFilterField
  | CheckboxFilterField

export interface FilterConfig<T> {
  fields: FilterField[]
  onFilter: (data: T[], filters: Record<string, unknown>) => T[]
}

export interface FilterState {
  isOpen: boolean
  activeFilters: Record<string, unknown>
  appliedFilters: Record<string, unknown>
}
