'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deletePlanAction } from '@/actions/plan'
import AreYouSure from '@/components/common/are-you-sure'
import { Button } from '@/components/ui/button'
import { Plan } from '@/types/plan.interface'

// import UpdatePlanDialog from './update-plan-dialog'

/**
 update Plan is fully implemented, but should not be available temporarily.
 to use, just comment out the commented code.
 * **/

export default function PlanActionCell({ plan }: { plan: Plan }) {
  const router = useRouter()

  // const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // const handleOpenUpdate = () => setIsUpdateOpen(true)
  const handleOpenDelete = () => setIsDeleteOpen(true)

  const [formState, action] = useActionState(deletePlanAction, null)
  const [isDeleting, startTransition] = useTransition()

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      setIsDeleteOpen(false)
      toast.success(`برنامه ${plan.name} با موفقیت حذف شد.`)
    } else if (!!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const handleDelete = () => startTransition(() => action(plan.id))

  return (
    // use (e.stopPropagation) to prevent rowClick action
    <div onClick={(e) => e.stopPropagation()}>
      {/* Update Action Button */}
      {/*<Button variant="ghost" size="icon" onClick={handleOpenUpdate}>*/}
      {/*  <PenIcon className="size-4" />*/}
      {/*</Button>*/}
      {/* Delete Action Button */}
      <Button variant="ghost" size="icon" onClick={handleOpenDelete}>
        <Trash2 className="text-destructive-foreground size-4" />
      </Button>
      {/*{isUpdateOpen && (*/}
      {/*  <UpdatePlanDialog*/}
      {/*    open={isUpdateOpen}*/}
      {/*    onOpenChange={setIsUpdateOpen}*/}
      {/*    plan={plan}*/}
      {/*  />*/}
      {/*)}*/}
      {isDeleteOpen && (
        <AreYouSure
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          action={handleDelete}
          loading={isDeleting}
          title={`حذف برنامه ${plan.name}`}
          description={`آیا از حذف برنامه ${plan.name} اطمینان دارید؟`}
          confirmLabel="حذف برنامه"
        />
      )}
    </div>
  )
}
