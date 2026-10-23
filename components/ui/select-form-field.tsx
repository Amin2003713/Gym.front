'use client'

import React from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SelectFormFieldProps<TFieldValues extends FieldValues, TOptionValue> {
  name: Path<TFieldValues>
  control: Control<TFieldValues>
  options: { value: TOptionValue; title: string }[]
  placeholder?: string
  label: React.ReactNode
  className?: string
  disabled?: boolean
}

function SelectFormField<TFieldValues extends FieldValues, TOptionValue>({
  options,
  name,
  placeholder = 'گزینه مورد نظر را انتخاب کنید',
  label,
  className,
  disabled = false,
  control,
}: SelectFormFieldProps<TFieldValues, TOptionValue>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="line-clamp-1">{label}</FormLabel>
          <FormControl>
            <Select
              onValueChange={(val) => {
                const option = options.find((opt) => String(opt.value) === val)
                field.onChange(option ? option.value : val)
              }}
              value={field.value != null ? String(field.value) : ''}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  className="line-clamp-1"
                  placeholder={placeholder}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem
                    key={`${index}-${option.value}`}
                    value={String(option.value)}
                  >
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default SelectFormField
