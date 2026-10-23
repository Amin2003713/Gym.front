'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CircleIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-input text-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aspect-square size-4 shrink-0 rounded-full border-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

type RadioGroupFormFieldProps<TFormValues extends FieldValues> =
  React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
    control: Control<TFormValues>
    name: Path<TFormValues>
    label: string
    description?: string | ReactNode
    className?: string
    disabled?: boolean
    options: { label: string; value: string }[]
    radioGroupClassName?: string
  }

function RadioGroupFormField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  options,
  radioGroupClassName,
}: RadioGroupFormFieldProps<TFormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {!!label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={cn('flex flex-col space-y-1', radioGroupClassName)}
              disabled={disabled}
            >
              {options.map((el) => (
                <FormItem
                  key={el.value}
                  className="flex items-center space-y-0 space-x-3"
                >
                  <FormControl>
                    <RadioGroupItem value={el.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{el.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { RadioGroup, RadioGroupItem, RadioGroupFormField }
