import React, { RefObject } from 'react'
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

import { AutoComplete, Option } from '@/components/ui/autoComplete'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

interface AutoCompleteFormProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>
  form: UseFormReturn<TFieldValues>
  allowCustomValue?: boolean
  className?: string
  disabled?: boolean
  emptyMessage?: string
  isLoading?: boolean
  label?: React.ReactNode
  options: Option[]
  placeholder?: string
  onFocus?: VoidFunction
  popoverContainer?: RefObject<HTMLDivElement | null>
  limitTags?: null
  multiSelect?: false
  onValueChange?: (value: Option | null) => void
  value?: Option | null
}

function AutoCompleteFormField<T extends FieldValues>({
  form,
  name,
  className,
  disabled,
  options,
  placeholder,
  isLoading,
  label,
  onFocus,
  popoverContainer,
  allowCustomValue,
  emptyMessage,
  multiSelect,
  limitTags,
}: AutoCompleteFormProps<T>) {
  const setValue = (value: Option | null) => {
    form.setValue(name, value as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <FormItem className={className}>
      <FormField
        control={form.control}
        render={({ field, fieldState }) => (
          <>
            <FormLabel>{label}</FormLabel>

            <FormControl>
              <AutoComplete
                options={options}
                allowCustomValue={allowCustomValue}
                value={field.value}
                disabled={disabled}
                isLoading={isLoading}
                onFocus={onFocus}
                placeholder={placeholder}
                onValueChange={(value) => setValue(value)}
                emptyMessage={emptyMessage}
                popoverContainer={popoverContainer}
                multiSelect={multiSelect}
                className={cn({
                  'border-destructive !ring-destructive': !!fieldState.error,
                })}
                limitTags={limitTags}
              />
            </FormControl>
            <FormMessage />
          </>
        )}
        name={name}
        disabled={disabled}
      />
    </FormItem>
  )
}

export default AutoCompleteFormField
