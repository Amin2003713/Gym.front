'use client'

import React from 'react'
import { FieldValues, useFieldArray, UseFormReturn } from 'react-hook-form'

import { useGetUsers } from '@/app/tenants/[tenant]/_api/use-get-users'
import { AddLeaveModel } from '@/app/tenants/[tenant]/reports/leaves/_model'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Button } from '@/components/ui/button'
import { CustomTextareaField } from '@/components/ui/custom-form-field'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { FileUploadFormField } from '@/components/ui/file-upload-form-field'
import SelectFormField from '@/components/ui/select-form-field'
import { LEAVE_STATUS, LEAVE_TYPE } from '@/constants/leave'
import { Media } from '@/types/media.interface'

type LeaveFormProps = {
  form: UseFormReturn<FieldValues, unknown, AddLeaveModel>
  isPending: boolean
  loadingText: string
  submitText: string
}

export default function LeaveForm({
  form,
  isPending,
  loadingText,
  submitText,
}: LeaveFormProps) {
  const { users, isLoading } = useGetUsers()
  const handleChangeUser = (
    user: Option | null,
    form: UseFormReturn<FieldValues, unknown, AddLeaveModel>,
  ) => {
    form.setValue('userId', user?.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const { fields: mediaUrls, remove: removeUrl } = useFieldArray({
    control: form.control,
    name: 'mediaUrls',
  })

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-3 overflow-y-auto px-2 py-2 md:py-6">
        <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
          <AutoComplete
            options={users}
            value={users.find((u) => u.id === form.watch('userId'))}
            onValueChange={(value) => handleChangeUser(value, form)}
            label="انتخاب کارمند"
            isLoading={isLoading}
            ariaInvalid={!!form.formState.errors['userId']?.message}
          />
          <span className="text-destructive-foreground">
            {form.formState.errors['userId'] && (
              <p className="text-destructive-foreground text-sm">
                {form.formState.errors['userId']?.message as string}
              </p>
            )}
          </span>
        </div>
        <SelectFormField
          name="type"
          control={form.control}
          options={Object.entries(LEAVE_TYPE).map(([value, title]) => ({
            value: Number(value),
            title,
          }))}
          label="نوع مرخصی"
          className="col-span-12 md:col-span-6"
        />
        <SelectFormField
          name="status"
          control={form.control}
          options={Object.entries(LEAVE_STATUS).map(([value, title]) => ({
            value: Number(value),
            title: title.label,
          }))}
          label="وضعیت مرخصی"
          className="col-span-12 md:col-span-4"
        />
        <DatePickerField
          control={form.control}
          name="startDate"
          label="تاریخ شروع"
          className="col-span-12 md:col-span-4"
        />
        <DatePickerField
          control={form.control}
          name="endDate"
          label="تاریخ پایان"
          className="col-span-12 md:col-span-4"
        />
        <CustomTextareaField
          control={form.control}
          name="description"
          label="توضیحات"
          placeholder="توضیحات، مانند علت یا دلیل مرخصی و . . . را بنویسید."
          className="col-span-12 [&_textarea]:min-h-36"
        />
        <FileUploadFormField
          control={form.control}
          name="mediaFiles"
          label="پیوست ها"
          mediaUrls={mediaUrls as unknown as Media[]}
          onRemoveUrls={removeUrl}
          multiple
          className="col-span-12"
        />
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
