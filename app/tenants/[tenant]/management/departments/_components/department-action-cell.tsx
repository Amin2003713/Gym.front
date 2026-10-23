'use client'

import { BanIcon, PenIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteDepartmentAction } from '@/actions/department'
import AreYouSure from '@/components/common/are-you-sure'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/user.store'
import { Department } from '@/types/department.interface'

import UpdateDepartmentDialog from './update-department-dialog'

export default function DepartmentActionCell({
  department,
}: {
  department: Department
}) {
  const router = useRouter()
  const isAdmin = useUserStore((state) => state.isAdmin)

  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleOpenUpdate = () => setIsUpdateOpen(true)
  const handleOpenDelete = () => setIsDeleteOpen(true)

  const [formState, action] = useActionState(deleteDepartmentAction, null)
  const [isDeleting, startTransition] = useTransition()

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      setIsDeleteOpen(false)
      toast.success(`بخش ${department.title} با موفقیت حذف شد.`)
    } else if (!!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const handleDelete = () => startTransition(() => action(department.id))

  if (!isAdmin)
    return <BanIcon className="text-destructive-foreground mx-auto size-4" />

  return (
    <>
      {/* Update Action Button */}
      <Button variant="ghost" size="icon" onClick={handleOpenUpdate}>
        <PenIcon className="size-4" />
      </Button>
      {/* Delete Action Button */}
      <Button variant="ghost" size="icon" onClick={handleOpenDelete}>
        <Trash2 className="text-destructive-foreground size-4" />
      </Button>
      {isUpdateOpen && (
        <UpdateDepartmentDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          department={department}
        />
      )}
      {isDeleteOpen && (
        <AreYouSure
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          action={handleDelete}
          loading={isDeleting}
          title={`حذف بخش ${department.title}`}
          description={`آیا از حذف بخش ${department.title} اطمینان دارید؟`}
          confirmLabel="حذف بخش"
        />
      )}
    </>
  )
}
