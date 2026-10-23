import React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  CustomFormField,
  CustomTextareaField,
  NumberField,
} from '@/components/ui/custom-form-field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
// import { MapLocationPickerField } from '@/components/ui/map-location-picker-field'
import SelectFormField from '@/components/ui/select-form-field'
import { TimePickerFormField } from '@/components/ui/time-picker-form-field'
import { STATION_STATUS, STATION_TYPE } from '@/constants/station'

type StationFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

export function StationForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: StationFormProps<TForm>) {
  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-3 overflow-y-auto px-2 py-1">
        <CustomFormField
          control={form.control}
          name="name"
          label="نام ایستگاه"
          className="col-span-12 md:col-span-4"
        />
        <CustomFormField
          control={form.control}
          name="code"
          label="کد ایستگاه"
          className="col-span-12 md:col-span-4"
        />
        <NumberField
          form={form}
          name="allowedDistance"
          label="فاصله مجاز"
          className="col-span-12 md:col-span-4"
          placeholder="فاصله مجاز تا ثبت تردد (متر)"
        />
        <SelectFormField
          control={form.control}
          name="stationStatus"
          options={Object.entries(STATION_STATUS).map(([value, title]) => ({
            value: Number(value),
            title,
          }))}
          label="وضعیت ایستگاه"
          className="col-span-12 md:col-span-4"
        />
        <SelectFormField
          control={form.control}
          name="stationType"
          options={Object.entries(STATION_TYPE).map(([value, title]) => ({
            value: Number(value),
            title,
          }))}
          label="نوع ایستگاه"
          className="col-span-12 md:col-span-4"
        />
        <TimePickerFormField
          control={form.control}
          label="تو راهی"
          placeholder="زمان رسیدن از مبدا به ایستگاه"
          name="onWay"
          className="col-span-12 md:col-span-4"
        />
        <NumberField
          form={form}
          name="location.latitude"
          label="عرض جغرافیایی"
          decimalPlaces={6}
          className="col-span-12 md:col-span-6"
        />
        <NumberField
          form={form}
          name="location.longitude"
          label="طول جغرافیایی"
          decimalPlaces={6}
          className="col-span-12 md:col-span-6"
        />
        <CustomTextareaField
          control={form.control}
          name="location.address"
          label="آدرس ایستگاه"
          className="col-span-12"
        />
        {/*<MapLocationPickerField*/}
        {/*  control={form.control}*/}
        {/*  name="location"*/}
        {/*  label="موقعیت جغرافیایی"*/}
        {/*  placeholder="موقعیت ایستگاه را انتخاب کنید"*/}
        {/*  defaultCenter={[35.70005000340338, 51.33803855319477]}*/}
        {/*  zoom={10}*/}
        {/*  height="300px"*/}
        {/*  className="col-span-12"*/}
        {/*/>*/}
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
