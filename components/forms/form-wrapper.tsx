import { zodResolver } from '@hookform/resolvers/zod'
import { ReactNode } from 'react'
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from 'react-hook-form'
// import * as z from 'zod'

import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'

interface FormWrapperProps<T extends FieldValues> {
  children: (form: UseFormReturn<FieldValues, unknown, T>) => ReactNode
  // todo: after updating zod and @hookform/resolvers/zod we have an issue in schema types
  // eslint-disable-next-line
  schema: any
  onSubmit: (data: T) => void
  defaultValues?: DefaultValues<T>
  className?: string
  resetAfterSubmit?: boolean
}

export function FormWrapper<T extends FieldValues>({
  children,
  schema,
  onSubmit,
  defaultValues,
  className,
  resetAfterSubmit = false,
}: FormWrapperProps<T>) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })
  const handleSubmit = (data: T) => {
    onSubmit(data)
    if (resetAfterSubmit) {
      form.reset()
    }
  }

  // console.log({ values: form.getValues(), errors: form.formState.errors })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-4', className)}
      >
        {children(form)}
      </form>
    </Form>
  )
}
