'use client'
import * as React from 'react'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { TimePicker, type TimePickerProps } from '@/components/ui/time-picker'
import { cn } from '@/lib/utils'
import { convertToTime } from '@/utils/time-utils'

export interface TimePickerFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TimePickerProps, 'value' | 'onChange' | 'error'> {
  name: TName
  control: Control<TFieldValues>
  label?: string
  description?: string
}

export function TimePickerFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  className,
  ...props
}: TimePickerFormFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field, formState }) => (
        <FormItem className={cn('flex flex-col gap-2', className)}>
          {!!label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <TimePicker
              {...props}
              value={field.value ? convertToTime(field.value) : ''}
              onChange={field.onChange}
              error={!!formState.errors[name]}
            />
          </FormControl>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
