'use client'

import { eachDayOfInterval } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { reviewLeaveAction } from '@/actions/leave'
import { ReviewLeaveModel } from '@/app/tenants/[tenant]/reports/leaves/_model'
import AreYouSure from '@/components/common/are-you-sure'
import { CustomTextareaField } from '@/components/ui/custom-form-field'
import { Form } from '@/components/ui/form'
import { LeaveStatusEnum } from '@/enums/leave.enums'
import { Leave } from '@/types/leave.interface'
import { formatJalaliDate } from '@/utils/date'

type ApproveOrRejectLeaveProps = {
  open: boolean
  onOpenChange(): void
  leave: Leave
  actionType: LeaveStatusEnum.Approved | LeaveStatusEnum.Rejected
}

export default function ApproveOrRejectLeave({
  leave,
  actionType,
  open,
  onOpenChange,
}: ApproveOrRejectLeaveProps) {
  const actionLabel =
    actionType === LeaveStatusEnum.Approved ? 'تایید مرخصی' : 'رد مرخصی'
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [formState, action] = useActionState(reviewLeaveAction, null)

  const handleReview = (values: ReviewLeaveModel) => {
    startTransition(() => action(values))
  }

  const form = useForm<ReviewLeaveModel>({
    defaultValues: {
      id: leave.id,
      status: actionType,
      adminComment: '',
    },
  })

  useEffect(() => {
    if (formState?.isSuccess) {
      toast.success(`${actionLabel} با موفقیت انجام شد`)
      router.refresh()
      onOpenChange()
    } else if (!formState?.isSuccess && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState])

  const startDate = formatJalaliDate(leave.startDate)!
  const endDate = formatJalaliDate(leave.endDate)!
  const leaveDuration = eachDayOfInterval({
    start: leave.startDate,
    end: leave.endDate,
  }).length

  return (
    <AreYouSure
      action={form.handleSubmit(handleReview)}
      title={`${actionLabel} "${leave.user.name}"`}
      description={` از تاریخ ${startDate} تا تاریخ ${endDate} به مدت ${leaveDuration} روز`}
      loading={isPending}
      open={open}
      onOpenChange={onOpenChange}
      confirmLabel={actionLabel}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReview)} className="space-y-4">
          <CustomTextareaField
            control={form.control}
            name="adminComment"
            placeholder={`دلیل یا یادداشت خود را بابت ${actionLabel} بنویسید.`}
            label="نظر یا یادداشت"
          />
        </form>
      </Form>
    </AreYouSure>
  )
}
