import React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { useGetDepartments } from '@/app/tenants/[tenant]/_api/use-get-departments'
import { useGetUsers } from '@/app/tenants/[tenant]/_api/use-get-users'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/ui/custom-form-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'

type DepartmentFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

export function DepartmentForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: DepartmentFormProps<TForm>) {
  const { departments, isLoading: gettingDepartments } = useGetDepartments()
  const { users, isLoading: gettingUsers } = useGetUsers()
  const activeUsers = users.filter((u) => u.isActive)
  // remove current department from list ( in update mode )
  const activeDepartments = departments.filter(
    (d) => d.id !== form.getValues('id'),
  )

  const handleChangeManagers = (
    managers: Option[] | null,
    form: UseFormReturn<FieldValues, unknown, TForm>,
  ) => {
    form.setValue('managers', managers, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleChangeParent = (
    parent: Option | null,
    form: UseFormReturn<FieldValues, unknown, TForm>,
  ) => {
    form.setValue('parentDepartment', parent, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-3 overflow-y-auto px-2 py-2 md:py-6">
        <CustomFormField
          control={form.control}
          name="title"
          label="نام بخش"
          className="col-span-12"
        />
        <div className="col-span-12 md:col-span-6">
          <AutoComplete
            multiSelect
            options={activeUsers}
            value={form.watch('managers')}
            label="مدیران بخش"
            isLoading={gettingUsers}
            onValueChange={(values) => handleChangeManagers(values, form)}
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          <AutoComplete
            options={activeDepartments}
            value={form.watch('parentDepartment')}
            label="بخش والد"
            isLoading={gettingDepartments}
            className="col-span-12 md:col-span-6"
            onValueChange={(value) => handleChangeParent(value, form)}
          />
        </div>
      </div>
      <DialogFooter className="shrink-0 flex-row">
        <Button
          isLoading={isPending}
          loadingText={loadingText}
          className="flex-1"
        >
          {submitText}
        </Button>
        <DialogClose asChild>
          <Button variant="destructive">انصراف</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}
