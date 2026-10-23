import React from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { useGetStations } from '@/app/tenants/[tenant]/reports/personnel-traffic/_api/use-get-stations'
import { AutoComplete, Option } from '@/components/ui/autoComplete'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { TimePickerFormField } from '@/components/ui/time-picker-form-field'

type TrafficFormProps<TForm> = {
  form: UseFormReturn<FieldValues, unknown, TForm>
  isPending: boolean
  loadingText: string
  submitText: string
}

export function TrafficForm<TForm extends FieldValues>({
  form,
  isPending,
  loadingText,
  submitText,
}: TrafficFormProps<TForm>) {
  const { stations, isLoading } = useGetStations()

  const handleChangeEnterStation = (
    station: Option | null,
    form: UseFormReturn<FieldValues, unknown, TForm>,
  ) => {
    form.setValue('enterStationId', station?.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleChangeExitStation = (
    station: Option | null,
    form: UseFormReturn<FieldValues, unknown, TForm>,
  ) => {
    form.setValue('exitStationId', station?.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <>
      <div className="grid flex-1 grid-cols-12 gap-3 overflow-y-auto px-2 py-1">
        <TimePickerFormField
          control={form.control}
          name="enterTime"
          label="ساعت ورود"
          className="col-span-12 md:col-span-4"
          description="نمونه: 08:00 ق.ظ"
        />
        <div className="col-span-12 flex flex-col gap-1 md:col-span-8">
          <AutoComplete
            options={stations}
            isLoading={isLoading}
            label="ایستگاه ورود"
            placeholder="انتخاب ایستگاه ثبت ورود"
            value={stations
              .map((u) => ({
                id: u.id,
                label: u.label,
              }))
              .find((u) => u.id === form.watch('enterStationId'))}
            onValueChange={(station) => handleChangeEnterStation(station, form)}
            ariaInvalid={!!form.formState.errors['enterStationId']?.message}
          />
          <span className="text-destructive-foreground">
            {form.formState.errors['enterStationId'] && (
              <p className="text-destructive-foreground text-sm">
                {form.formState.errors['enterStationId']?.message as string}
              </p>
            )}
          </span>
        </div>
        <TimePickerFormField
          control={form.control}
          name="exitTime"
          label="ساعت خروج"
          className="col-span-12 md:col-span-4"
          description="نمونه: 05:00 ب.ظ"
        />
        <div className="col-span-12 flex flex-col gap-1 lg:col-span-8">
          <AutoComplete
            options={stations}
            isLoading={isLoading}
            label="ایستگاه خروج"
            placeholder="انتخاب ایستگاه ثبت خروج"
            value={stations
              .map((u) => ({
                id: u.id,
                label: u.label,
              }))
              .find((u) => u.id === form.watch('exitStationId'))}
            onValueChange={(station) => handleChangeExitStation(station, form)}
            ariaInvalid={!!form.formState.errors['exitStationId']?.message}
          />
          <span className="text-destructive-foreground">
            {form.formState.errors['exitStationId'] && (
              <p className="text-destructive-foreground text-sm">
                {form.formState.errors['exitStationId']?.message as string}
              </p>
            )}
          </span>
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
