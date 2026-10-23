import React, { InputHTMLAttributes, ReactNode } from 'react'
import gregorian from 'react-date-object/calendars/gregorian'
import persian from 'react-date-object/calendars/persian'
import gregorian_en from 'react-date-object/locales/gregorian_en'
import persian_fa from 'react-date-object/locales/persian_fa'
import { Control, FieldValues, Path } from 'react-hook-form'
import { DateObject } from 'react-multi-date-picker'

import { DatePicker } from '@/components/ui/date-picker'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type DatePickerFieldProps<TFormValues extends FieldValues> = {
  control: Control<TFormValues>
  name: Path<TFormValues>
  label: string
  description?: string | ReactNode
  className?: string
  placeholder?: string
} & InputHTMLAttributes<HTMLInputElement>

export function DatePickerField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  className,
  description,
}: DatePickerFieldProps<TFormValues>) {
  return (
    <>
      <FormField
        name={name}
        control={control}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <DatePicker
                value={!!field.value ? field.value : ''}
                onChange={(date: DateObject | null) =>
                  field.onChange(
                    date?.isValid &&
                      date
                        .convert(gregorian, gregorian_en)
                        .format('YYYY-MM-DDTHH:mm:ss'),
                  )
                }
              />
            </FormControl>
            {!!description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
