'use client'

import { eachDayOfInterval } from 'date-fns'
import { CalendarClockIcon, Loader, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import AddLeaveDialog from '@/app/tenants/[tenant]/reports/leaves/_components/add-leave-dialog'
import { LeavesColumns } from '@/app/tenants/[tenant]/reports/leaves/_components/columns'
import DataTable from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/use-debounce-search'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { Leave } from '@/types/leave.interface'

type LeavesListProps = ApiResponse<Leave[]>

export default function LeavesList({ data: leaves, error }: LeavesListProps) {
  const [addLeave, setAddLeave] = useState(false)

  const isAdmin = useUserStore((state) => state.isAdmin)
  const isSupervisor = useUserStore((state) => state.isSupervisor)

  useEffect(() => {
    if (!leaves && !!error) {
      toast.error('خطا در دریافت اطلاعات!', { description: error.detail })
    }
  }, [leaves, error])

  const leavesWithDuration = leaves?.map((leave) => ({
    ...leave,
    duration: eachDayOfInterval({
      start: leave.startDate,
      end: leave.endDate,
    }).length,
  }))

  const { filteredData, handleChange, isSearching } = useDebouncedSearch<Leave>(
    {
      data: leavesWithDuration ?? [],
      searchKeys: ['user.name'],
      delay: 300,
    },
  )

  const handleAddLeave = () => {
    if (isAdmin || isSupervisor) {
      setAddLeave(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 md:flex-row">
          <div className="flex w-full items-center justify-between">
            <CardTitle className="whitespace-nowrap">لیست مرخصی‌ها</CardTitle>
            {(isAdmin || isSupervisor) && (
              <Button variant="outline" onClick={handleAddLeave}>
                افزودن مرخصی
                <CalendarClockIcon className="text-muted-foreground size-5" />
              </Button>
            )}
          </div>
          <div className="relative mr-auto w-full sm:w-fit">
            <Input
              className="pl-7 transition-all duration-300 placeholder:text-sm sm:w-[200px] sm:focus:w-[320px]"
              placeholder="جستجو"
              onChange={handleChange}
            />
            {isSearching ? (
              <Loader className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 animate-spin opacity-50 select-none" />
            ) : (
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-destructive-foreground text-sm md:text-base">
                {error.detail}!
              </span>
            </div>
          ) : (
            <DataTable
              columns={LeavesColumns}
              initialData={filteredData}
              enableColumnVisibility
              initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              fullHeight
            />
          )}
        </CardContent>
      </Card>
      {addLeave && (
        <AddLeaveDialog open={addLeave} onOpenChange={setAddLeave} />
      )}
    </>
  )
}
