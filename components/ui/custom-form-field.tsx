import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Control, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type BaseProps<TFormValues extends FieldValues> = {
  control: Control<TFormValues>
  name: Path<TFormValues>
  label: string | ReactNode
  description?: string | ReactNode
}

type InputProps<TFormValues extends FieldValues> = BaseProps<TFormValues> &
  InputHTMLAttributes<HTMLInputElement>

type NumberInputProps<TFormValues extends FieldValues> = Omit<
  InputProps<TFormValues>,
  'control' | 'form'
> & {
  allowLeadingZeros?: boolean
  allowNegative?: boolean
  decimalPlaces?: number
  form: UseFormReturn<TFormValues>
  thousandSeparator?: boolean | string
}

type TextareaProps<TFormValues extends FieldValues> = BaseProps<TFormValues> &
  TextareaHTMLAttributes<HTMLTextAreaElement>

export function CustomFormField<TFormValues extends FieldValues>({
  control,
  name,
  className,
  label,
  description,
  ...props
}: InputProps<TFormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} {...props} />
          </FormControl>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function NumberField<TFormValues extends FieldValues>({
  form,
  name,
  label,
  className,
  description,
  maxLength,
  decimalPlaces = 0,
  allowNegative = false,
  thousandSeparator = false,
  allowLeadingZeros = true,
  ...props
}: NumberInputProps<TFormValues>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <NumericFormat
              {...field}
              customInput={Input}
              dir="ltr"
              placeholder={props.placeholder}
              disabled={props.disabled}
              required={props.required}
              maxLength={maxLength}
              decimalScale={decimalPlaces}
              thousandSeparator={thousandSeparator}
              allowLeadingZeros={allowLeadingZeros}
              className="placeholder:text-right"
              allowNegative={allowNegative}
            />
          </FormControl>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CustomTextareaField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  className,
  description,
  ...props
}: TextareaProps<TFormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ''} {...props} />
          </FormControl>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
