'use client'

import { PenIcon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteStationAction } from '@/actions/station'
import AreYouSure from '@/components/common/are-you-sure'
import { Button } from '@/components/ui/button'
import { Station } from '@/types/station.interface'

import UpdateStationDialog from './update-station-dialog'

export default function StationActionCell({ station }: { station: Station }) {
  const router = useRouter()

  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleOpenUpdate = () => setIsUpdateOpen(true)
  const handleOpenDelete = () => setIsDeleteOpen(true)

  const [formState, action] = useActionState(deleteStationAction, null)
  const [isDeleting, startTransition] = useTransition()

  useEffect(() => {
    if (formState?.isSuccess) {
      router.refresh()
      setIsDeleteOpen(false)
      toast.success(`ایستگاه ${station.name} با موفقیت حذف شد.`)
    } else if (!!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const handleDelete = () => startTransition(() => action(station.id))

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
        <UpdateStationDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          station={station}
        />
      )}
      {isDeleteOpen && (
        <AreYouSure
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          action={handleDelete}
          loading={isDeleting}
          title={`حذف ایستگاه ${station.name}`}
          description={`آیا از حذف ایستگاه ${station.name} اطمینان دارید؟`}
          confirmLabel="حذف ایستگاه"
        />
      )}
    </>
  )
}
