'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import React from 'react'
import { FieldValues, useFieldArray, UseFormReturn } from 'react-hook-form'

import { useGetDepartments } from '@/app/tenants/[tenant]/_api/use-get-departments'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomFormField, NumberField } from '@/components/ui/custom-form-field'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import SelectFormField from '@/components/ui/select-form-field'
import { SwitchFormField } from '@/components/ui/switch'
import { TimePickerFormField } from '@/components/ui/time-picker-form-field'
import { DAY_OF_WEEK } from '@/constants/day-of-week'
import { DayOfWeekEnum } from '@/enums/day-of-week.enum'

type StationFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

export function PlanForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: StationFormProps<TForm>) {
  const { departments, isLoading } = useGetDepartments()
  const handleChangeDepartment = (
    value: Option[] | null,
    form: UseFormReturn<FieldValues, unknown, TForm>,
  ) => {
    form.setValue('departments', !!value?.length ? value : null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const {
    fields: overtimeRateFields,
    append: appendOvertimeRate,
    remove: removeOvertimeRate,
  } = useFieldArray({
    control: form.control,
    name: 'overtimeRates',
  })

  const {
    fields: exceptionFields,
    append: appendException,
    remove: removeException,
  } = useFieldArray({
    control: form.control,
    name: 'exceptions',
  })

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-3 overflow-y-auto px-2 py-1">
        <CustomFormField
          control={form.control}
          name="name"
          label="نام برنامه"
          placeholder="مثال: شیفت صبح - اداری"
          className="col-span-12 md:col-span-6"
        />
        <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
          <AutoComplete
            multiSelect
            options={departments}
            isLoading={isLoading}
            placeholder="بخش/دپارتمان مورد نظر را انتخاب کنید"
            value={form.watch('departments')}
            onValueChange={(value) => handleChangeDepartment(value, form)}
            label="بخش"
          />
        </div>
        <DatePickerField
          control={form.control}
          name="startDate"
          label="تاریخ شروع"
          className="col-span-12 md:col-span-6"
        />
        <DatePickerField
          control={form.control}
          name="endDate"
          label="تاریخ پایان"
          className="col-span-12 md:col-span-6"
        />
        <TimePickerFormField
          control={form.control}
          name="startTime"
          label="ساعت شروع"
          placeholder="08:00"
          clearable={false}
          className="col-span-12 md:col-span-6"
        />
        <TimePickerFormField
          control={form.control}
          name="endTime"
          label="ساعت پایان"
          placeholder="17:00"
          clearable={false}
          className="col-span-12 md:col-span-6"
        />
        {/* time settings section */}
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle className="text-sm">تنظیمات زمانی</CardTitle>
            <CardContent className="grid grid-cols-12 gap-3">
              <TimePickerFormField
                control={form.control}
                name="entryDeadlineTime"
                label="فرجه ورود"
                placeholder="مثال: 00:20"
                className="col-span-12 md:col-span-6"
              />
              <TimePickerFormField
                control={form.control}
                name="exitDeadlineTime"
                label="فرجه خروج"
                placeholder="مثال: 00:15"
                className="col-span-12 md:col-span-6"
              />
              <TimePickerFormField
                control={form.control}
                name="restTime"
                label="استراحت"
                placeholder="زمان استراحت"
                className="col-span-12 md:col-span-6"
              />
              <TimePickerFormField
                control={form.control}
                name="maximumOvertimeTime"
                label="حداکثر ساعت اضافه کار"
                placeholder=""
                className="col-span-12 md:col-span-6"
              />
            </CardContent>
          </CardHeader>
        </Card>
        {/* coefficient overtime settings section */}
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle className="text-sm">ضریب اضافه‌کار</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-12 gap-3">
            <NumberField
              form={form}
              name="normalOvertimeRate"
              label="ضریب اضافه‌کاری عادی"
              decimalPlaces={2}
              className="col-span-6"
            />
            <NumberField
              form={form}
              name="holidayOvertimeRate"
              label="ضریب اضافه‌کاری تعطیلات"
              decimalPlaces={2}
              className="col-span-6"
            />
            <div className="col-span-12 flex items-center justify-between border-t py-2">
              <CardTitle className="text-sm">
                ضریب شخصی‌سازی شده (اختیاری)
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendOvertimeRate({
                    startTime: '',
                    endTime: '',
                    rate: 1,
                    isLeaveConsidered: false,
                  })
                }
              >
                افزودن ضریب
                <PlusIcon className="size-4" />
              </Button>
            </div>
            <div className="col-span-12 flex-col-reverse justify-center gap-2">
              {overtimeRateFields.length < 1 ? (
                <>
                  <p className="text-muted-foreground mb-1 text-center text-sm">
                    برنامه بدون ضریب‌شخصی سازی شده
                  </p>
                  <p className="text-muted-foreground text-center text-xs">
                    اضافه‌کار، طبق ضریب روزهای عادی محاسبه میشود.همچنین در نظر
                    داشته باشید، الویت محاسبه اضافه‌کار، با ضریب‌های شخصی
                    می‌باشد.
                  </p>
                </>
              ) : (
                overtimeRateFields.map((field, index) => (
                  <div
                    key={`${index}-${field.id}`}
                    className="animate-fadeInUp has-[[data-error=true]]:ring-destructive has-[[data-error=true]]:animate-shake has-[[data-error=true]]:border-destructive ring-input my-1.5 grid grid-cols-12 gap-3 rounded-md border p-2 ring-1 transition-colors"
                  >
                    <div className="col-span-12 flex items-center justify-between border-b p-2 pt-0">
                      <Badge
                        variant="secondary"
                        className="text-sm"
                      >{`ضریب شخصی ${index + 1}`}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOvertimeRate(index)}
                      >
                        <Trash2Icon className="text-destructive-foreground size-4" />
                        حذف
                      </Button>
                    </div>
                    <TimePickerFormField
                      control={form.control}
                      name={`overtimeRates.${index}.startTime`}
                      label="زمان شروع"
                      className="col-span-12 md:col-span-3"
                      clearable={false}
                    />
                    <TimePickerFormField
                      control={form.control}
                      name={`overtimeRates.${index}.endTime`}
                      label="زمان پایان"
                      className="col-span-12 md:col-span-3"
                      clearable={false}
                    />
                    <NumberField
                      form={form}
                      name={`overtimeRates.${index}.rate`}
                      label="ضریب"
                      decimalPlaces={2}
                      className="col-span-12 md:col-span-3"
                    />
                    <SwitchFormField
                      name={`overtimeRates.${index}.isLeaveConsidered`}
                      control={form.control}
                      label="مرخصی سازمانی"
                      className="col-span-12 md:col-span-3"
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* exceptions setting section */}
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm">استثناهای هفتگی (اختیاری)</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendException({
                    dayOfWeek: DayOfWeekEnum.Thursday,
                    startTime: '',
                    endTime: '',
                  })
                }
              >
                افزودن استثنا
                <PlusIcon className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col-reverse gap-3">
            {exceptionFields.length < 1 ? (
              <div className="empty-exeption flex flex-col gap-1">
                <p className="text-muted-foreground text-center text-sm">
                  برنامه بدون استثنای هفتگی
                </p>
                <p className="text-muted-foreground text-center text-xs">
                  برای افزودن روی افزودن استثنا کلیک کنید.
                </p>
              </div>
            ) : (
              exceptionFields.map((field, index) => (
                <div
                  key={`${index}-${field.id}`}
                  className="animate-fadeInUp my-1.5 grid grid-cols-12 gap-3 rounded-md border p-2"
                >
                  <div className="col-span-12 flex items-center justify-between border-b p-2 pt-0">
                    <Badge
                      variant="secondary"
                      className="text-sm"
                    >{`استثنا ${index + 1}`}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeException(index)}
                    >
                      <Trash2Icon className="text-destructive-foreground size-4" />
                      حذف
                    </Button>
                  </div>
                  <SelectFormField
                    name={`exceptions.${index}.dayOfWeek`}
                    control={form.control}
                    options={Object.entries(DAY_OF_WEEK).map(
                      ([value, title]) => ({
                        value: Number(value),
                        title,
                      }),
                    )}
                    label="روز هفته"
                    className="col-span-4"
                  />
                  <TimePickerFormField
                    control={form.control}
                    name={`exceptions.${index}.startTime`}
                    label="زمان شروع"
                    className="col-span-12 md:col-span-4"
                    clearable={false}
                  />
                  <TimePickerFormField
                    control={form.control}
                    name={`exceptions.${index}.endTime`}
                    label="زمان پایان"
                    className="col-span-12 md:col-span-4"
                    clearable={false}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
