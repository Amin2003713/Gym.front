'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { updateStationAction } from '@/actions/station'
import {
  UpdateStationModel,
  updateStationSchema,
} from '@/app/tenants/[tenant]/management/stations/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Station } from '@/types/station.interface'

import { StationForm } from './station-form'

type UpdateStationDialogProps = {
  open: boolean
  onOpenChange(state: boolean): void
  station: Station
}

export default function UpdateStationDialog({
  open,
  onOpenChange,
  station,
}: UpdateStationDialogProps) {
  const router = useRouter()
  const [formState, action] = useActionState(updateStationAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: UpdateStationModel) => {
    console.log(values)
    startTransition(() => action(values))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('ایستگاه با موفقیت ویرایش شد')
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 border-b py-3">
          <DialogTitle>ویرایش ایستگاه</DialogTitle>
          <DialogDescription>
            ویرایش ایستگاه {`${station.name}`}
          </DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={updateStationSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            id: station.id,
            name: station.name,
            code: station.code,
            location: {
              latitude: station.latitude,
              longitude: station.longitude,
              address: station.address,
            },
            allowedDistance: station.allowedDistance,
            onWay: station.onWay,
            stationStatus: station.stationStatus,
            stationType: station.stationType,
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <StationForm
              form={form}
              isPending={isPending}
              loadingText="در حال ویرایش ایستگاه"
              submitText="ویرایش ایستگاه"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
