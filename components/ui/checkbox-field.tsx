import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { ReactNode } from 'react'
import * as React from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type CheckboxProps<TFormValues extends FieldValues> = React.ComponentProps<
  typeof CheckboxPrimitive.Root
> & {
  control: Control<TFormValues>
  name: Path<TFormValues>
  label: string
  description?: string | ReactNode
  className?: string
  disabled?: boolean
}

export function CheckboxField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  className,
  description,
  disabled,
  ...props
}: CheckboxProps<TFormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <div className="flex items-center space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                {...props}
              />
            </FormControl>
            <FormLabel className="font-normal">{label}</FormLabel>
          </div>
          {!!description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
