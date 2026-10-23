'use client'

import { MoveLeftIcon, PenIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteTrafficAction } from '@/actions/record'
import AreYouSure from '@/components/common/are-you-sure'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUserStore } from '@/store/user.store'
import { TrafficRecordInterface } from '@/types/traffic.interface'

import AddTrafficDialog from './add-traffic-dialog'
import UpdateTrafficDialog from './update-traffic-dialog'

type TrafficCellProps = {
  date: string
  records: TrafficRecordInterface[]
}

export default function TrafficCell({ records, date }: TrafficCellProps) {
  const [addTraffic, setAddTraffic] = useState(false)
  const [updateTraffic, setUpdateTraffic] =
    useState<TrafficRecordInterface | null>(null)
  const [deleteTraffic, setDeleteTraffic] =
    useState<TrafficRecordInterface | null>(null)

  const handleOpenAddTraffic = () => setAddTraffic(true)

  const handleOpenUpdateTraffic = (traffic: TrafficRecordInterface) => {
    setUpdateTraffic(traffic)
  }

  const handleOpenDeleteTraffic = (traffic: TrafficRecordInterface) => {
    setDeleteTraffic(traffic)
  }

  // delete record
  const router = useRouter()
  const [isDeleting, startTransition] = useTransition()
  const [formState, action] = useActionState(deleteTrafficAction, null)

  const handleDeleteTraffic = () =>
    startTransition(() => action(deleteTraffic!.id))

  useEffect(() => {
    if (!!formState && formState.isSuccess) {
      toast.success('تردد با موفقیت حذف شد.')
      setDeleteTraffic(null)
      router.refresh()
    } else if (!!formState && !!formState?.error) {
      toast.error(formState.error.title, {
        description: formState.error.detail,
      })
    }
    // eslint-disable-next-line
  }, [formState])

  const sp = useSearchParams()
  const userId = sp.get('userId')
  const isAdmin = useUserStore((store) => store.isAdmin)
  const isSupervisor = useUserStore((store) => store.isSupervisor)

  return (
    <div className="flex flex-wrap gap-2">
      {(isAdmin || isSupervisor) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenAddTraffic}
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>ثبت تردد جدید</TooltipContent>
        </Tooltip>
      )}
      {records?.map((r) => (
        /** Use the SmartHoverCard component if you need accessibility on mobile devices. **/
        <HoverCard key={r.id} openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Badge
              lang="en"
              variant="outline"
              key={r.id}
              className="cursor-default p-1.5 font-bold transition-all hover:scale-105"
              onDoubleClick={() => handleOpenUpdateTraffic(r)}
            >
              <span className="text-success-foreground">{r.enterTime}</span>
              <MoveLeftIcon className="text-muted-foreground mx-0.5" />
              <span className="text-destructive-foreground/70">
                {r?.exitTime ?? '----'}
              </span>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                className="hover:text-info size-4"
                onClick={() => handleOpenUpdateTraffic(r)}
              >
                <PenIcon />
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                className="hover:text-destructive-foreground size-4"
                onClick={() => handleOpenDeleteTraffic(r)}
              >
                <Trash2Icon />
              </Button>
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-full max-w-md">
            <div className="flex h-16 items-center space-x-4 text-xs">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-start gap-2">
                  <span className="text-success-foreground mx-auto whitespace-nowrap">
                    محل ورود:{' '}
                  </span>
                  <span className="w-full max-w-[150px] truncate text-center">
                    {r.enterStation.name}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  {r.enterStationDistance ? (
                    <>
                      <span className="whitespace-nowrap">فاصله: </span>
                      <span>{r.enterStationDistance}</span>
                    </>
                  ) : (
                    <>
                      <span className="whitespace-nowrap">درج کننده: </span>
                      <span>{r.enterInserter}</span>
                    </>
                  )}
                </div>
              </div>
              <Separator orientation="vertical" />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-start gap-2">
                  <span className="text-destructive-foreground mx-auto whitespace-nowrap">
                    محل خروج:{' '}
                  </span>
                  <span className="w-full max-w-[150px] truncate text-center">
                    {r.exitStation?.name ?? '----'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  {r.exitStationDistance ? (
                    <>
                      <span className="whitespace-nowrap">فاصله: </span>
                      <span>{r.exitStationDistance}</span>
                    </>
                  ) : (
                    <>
                      <span className="whitespace-nowrap">درج کننده: </span>
                      <span>{r.exitInserter ?? '--'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
      {addTraffic && (
        <AddTrafficDialog
          open={addTraffic}
          onOpenChange={setAddTraffic}
          userId={userId}
          date={date}
        />
      )}
      {updateTraffic && (
        <UpdateTrafficDialog
          record={updateTraffic}
          userId={userId}
          date={date}
          open={!!updateTraffic}
          onOpenChange={() => setUpdateTraffic(null)}
        />
      )}
      {deleteTraffic && (
        <AreYouSure
          open={!!deleteTraffic}
          onOpenChange={() => setDeleteTraffic(null)}
          action={handleDeleteTraffic}
          loading={isDeleting}
          title="حذف تردد ثبت شده"
          description="آیا از حذف تردد ثبت شده اطمینان دارید؟"
          confirmLabel="حذف تردد"
        />
      )}
    </div>
  )
}
