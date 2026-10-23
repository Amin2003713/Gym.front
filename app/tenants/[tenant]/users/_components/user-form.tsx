import { PlusCircleIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { useGetDepartments } from '@/app/tenants/[tenant]/_api/use-get-departments'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Button } from '@/components/ui/button'
import {
  CustomFormField,
  CustomTextareaField,
} from '@/components/ui/custom-form-field'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { FileUploadFormField } from '@/components/ui/file-upload-form-field'
import SelectFormField from '@/components/ui/select-form-field'
import { GENDER } from '@/constants/gender'
import { USER_ROLES } from '@/constants/user-role'
import { UserRoleEnum } from '@/enums/user-role.enum'

type UserFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

export function UserForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: UserFormProps<TForm>) {
  const { departments, isLoading } = useGetDepartments()

  const roleOptions = Object.entries(USER_ROLES)
    .map(([value, label]) => ({
      label,
      id: value as UserRoleEnum,
    }))
    .filter((u) => [UserRoleEnum.Employee, UserRoleEnum.Driver].includes(u.id))

  const handleChangeRoles = (value: Option[] | null) => {
    form.setValue(
      'role',
      value?.map((v) => v.id),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    )
  }

  const handleChangeDepartment = (value: Option | null) => {
    form.setValue('department', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-4 overflow-y-auto px-2 py-1 *:col-span-12 md:*:col-span-6">
        <CustomFormField control={form.control} name="firstName" label="نام" />
        <CustomFormField
          control={form.control}
          name="lastName"
          label="نام خانوادگی"
        />
        <div className="flex flex-col gap-1">
          <AutoComplete
            multiSelect
            options={roleOptions}
            label="انتخاب نقش"
            placeholder="نقش کاربر مورد نظر را انتخاب کنید"
            value={roleOptions.filter((role) =>
              (form.watch('role') ?? []).includes(role.id),
            )}
            onValueChange={handleChangeRoles}
            ariaInvalid={!!form.formState.errors['role']?.message}
          />
          <span className="text-destructive-foreground">
            {form.formState.errors['role'] && (
              <p className="text-destructive-foreground text-sm">
                {form.formState.errors['role']?.message as string}
              </p>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <AutoComplete
            options={departments}
            isLoading={isLoading}
            placeholder="بخش/دپارتمان مورد نظر را انتخاب کنید"
            value={form.watch('department')}
            onValueChange={handleChangeDepartment}
            label="بخش"
            ariaInvalid={!!form.formState.errors['department']?.message}
          />
          <span className="text-destructive-foreground">
            {form.formState.errors['department'] && (
              <p className="text-destructive-foreground text-sm">
                {form.formState.errors['department']?.message as string}
              </p>
            )}
          </span>
        </div>
        <CustomFormField
          control={form.control}
          name="phoneNumber"
          label="شماره تماس"
        />
        <CustomFormField
          control={form.control}
          name="nationalCode"
          label="کدملی"
        />
        <CustomFormField
          control={form.control}
          name="personnelNumber"
          label="کد پرسنلی"
        />
        <DatePickerField
          control={form.control}
          name="birthDate"
          label="تاریخ تولد"
        />
        <SelectFormField
          name="gender"
          control={form.control}
          options={Object.entries(GENDER).map(([value, title]) => ({
            value: Number(value),
            title,
          }))}
          label="جنسیت"
          className="!col-span-6 md:!col-span-6"
        />
        <SelectFormField
          name="isLeader"
          control={form.control}
          options={[
            { value: true, title: 'فعال' },
            { value: false, title: 'غیرفعال' },
          ]}
          label="درج ماموریت"
          className="!col-span-6 md:!col-span-6"
        />
        <CustomTextareaField
          control={form.control}
          name="address"
          label="آدرس"
          className="!col-span-12 [&_textarea]:resize-none"
        />
        {form.watch('imageUrl') ? (
          <div className="relative !col-span-12 mx-auto size-14 border p-0.5">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => form.setValue('imageUrl', null)}
              className="absolute -top-1 -right-1 size-4 cursor-pointer rounded-full"
            >
              <XIcon />
            </Button>
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
        <Button
          isLoading={isPending}
          loadingText={loadingText}
          className="flex-1"
        >
          {submitText}
          <PlusCircleIcon />
        </Button>
        <DialogClose asChild>
          <Button variant="destructive">انصراف</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}
