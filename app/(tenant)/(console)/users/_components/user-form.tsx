import { PlusCircleIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { CustomFormField } from '@/components/ui/custom-form-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { FileUploadFormField } from '@/components/ui/file-upload-form-field'
import SelectFormField from '@/components/ui/select-form-field'
import { GENDER } from '@/constants/gender'
import { USER_ROLES } from '@/constants/user-role'
import { ApiUserRole } from '@/features/users/api/users-api'

type UserFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

/**
 * The gym user form. It only renders fields the API stores: identity, phone (which is also the
 * username), one role, gender and the optional avatar. HR-template fields (department, national
 * code, personnel number, …) are deliberately absent — the backend has no such contract.
 */
export function UserForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: UserFormProps<TForm>) {
  const roleOptions = Object.entries(USER_ROLES).map(([value, label]) => ({
    value: Number(value) as ApiUserRole,
    title: label,
  }))

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-4 overflow-y-auto px-2 py-1 *:col-span-12 md:*:col-span-6">
        <CustomFormField control={form.control} name="firstName" label="نام" />
        <CustomFormField
          control={form.control}
          name="lastName"
          label="نام خانوادگی"
        />
        <CustomFormField
          control={form.control}
          name="email"
          type="email"
          dir="ltr"
          label="ایمیل"
        />
        <CustomFormField
          control={form.control}
          name="phoneNumber"
          dir="ltr"
          label="شماره همراه (نام کاربری)"
        />
        <SelectFormField
          name="role"
          control={form.control}
          options={roleOptions}
          label="نقش کاربر"
          className="!col-span-12 md:!col-span-6"
        />
        <SelectFormField
          name="gender"
          control={form.control}
          options={Object.entries(GENDER).map(([value, title]) => ({
            value: Number(value),
            title,
          }))}
          label="جنسیت"
          className="!col-span-12 md:!col-span-6"
        />
        {form.watch('imageUrl') ? (
          <div className="relative !col-span-12 mx-auto size-14 border p-0.5">
            <button
              type="button"
              onClick={() => form.setValue('imageUrl', null)}
              aria-label="حذف تصویر"
              className="bg-secondary absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full"
            >
              <XIcon className="size-3" />
            </button>
            <Image
              className="aspect-square"
              src={form.watch('imageUrl')}
              alt="user"
              width={500}
              height={500}
            />
          </div>
        ) : (
          <FileUploadFormField
            control={form.control}
            name="imageFile"
            label="تصویر کاربر"
            className="!col-span-12"
            accept="image/*"
            maxSize={10 * 1024 * 1024}
            maxFiles={1}
          />
        )}
      </div>
      <DialogFooter className="flex shrink-0 flex-row">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? loadingText : submitText}
          <PlusCircleIcon className="size-4" />
        </button>
        <DialogClose asChild>
          <button
            type="button"
            className="border-destructive/40 text-destructive inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold"
          >
            انصراف
          </button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}
