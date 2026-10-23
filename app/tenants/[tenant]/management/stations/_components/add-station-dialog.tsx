'use client'

import { useRouter } from 'next/navigation'
import React, { useActionState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'

import { addStationAction } from '@/actions/station'
import {
  AddStationModel,
  addStationSchema,
} from '@/app/tenants/[tenant]/management/stations/_model'
import { FormWrapper } from '@/components/forms/form-wrapper'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StationStatus, StationType } from '@/enums/station.enums'

import { StationForm } from './station-form'

type AddStationProps = {
  open: boolean
  onOpenChange(state: boolean): void
}

export default function AddStationDialog({
  open,
  onOpenChange,
}: AddStationProps) {
  const router = useRouter()
  const [formState, action] = useActionState(addStationAction, null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (values: AddStationModel) => {
    console.log({ values })
    startTransition(() => action(values))
  }

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      onOpenChange(false)
      toast.success('ایستگاه با موفقیت افزوده شد')
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
          <DialogTitle>ثبت ایستگاه</DialogTitle>
          <DialogDescription>افزودن ایستگاه ثبت تردد</DialogDescription>
        </DialogHeader>
        <FormWrapper
          schema={addStationSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            onWay: null,
            stationStatus: StationStatus.Complete,
            stationType: StationType.Traffic,
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {(form) => (
            <StationForm
              form={form}
              isPending={isPending}
              loadingText="در حال ثبت ایستگاه"
              submitText="ثبت ایستگاه"
            />
          )}
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
