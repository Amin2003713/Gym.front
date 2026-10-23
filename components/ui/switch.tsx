'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'
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

interface SwitchFormFieldProps<TFieldValues extends FieldValues, TOptionValue> {
  name: Path<TFieldValues>
  control: Control<TFieldValues>
  description?: string
  placeholder?: string
  label: React.ReactNode
  className?: string
  disabled?: boolean
}

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow-lg ring-0 transition-transform',
          'data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

function SwitchFormField<TFieldValues extends FieldValues, TOptionValue>({
  control,
  label,
  description,
  name,
  disabled = false,
  className,
}: SwitchFormFieldProps<TFieldValues, TOptionValue>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('', className)}>
          <FormLabel>{label}</FormLabel>
          <div className="border-input flex h-9 w-full min-w-0 items-center rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </div>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage className="-mt-2 text-left" />
        </FormItem>
      )}
    />
  )
}

export { Switch, SwitchFormField }
