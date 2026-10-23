'use client'

import { CalendarRangeIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import ViewPlanDialog from '@/app/tenants/[tenant]/management/plans/_components/view-plan-dialog'
import DataTable from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/use-debounce-search'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { Plan } from '@/types/plan.interface'

import AddPlanDialog from './add-plan-dialog'
import { plansListColumns } from './columns'

type PlansListProps = ApiResponse<Plan[]>

export default function PlansList({ data: plans, error }: PlansListProps) {
  const [addPlan, setAddPlan] = useState(false)
  const [openPlan, setOpenPlan] = useState<Plan | null>()

  const isAdmin = useUserStore((state) => state.isAdmin)

  useEffect(() => {
    if (!plans && !!error) {
      toast.error('خطا در دریافت اطلاعات!', { description: error.detail })
    }
  }, [plans, error])

  const { filteredData, handleChange } = useDebouncedSearch<Plan>({
    data: plans ?? [],
    searchKeys: ['name'],
    delay: 300,
  })

  const handleAddPlan = () => {
    if (!isAdmin) return
    setAddPlan(true)
  }

  const handleClickRow = (row: Plan) => setOpenPlan(row)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 md:flex-row">
          <div className="flex w-full items-center justify-between">
            <CardTitle className="whitespace-nowrap">لیست برنامه‌ها</CardTitle>
            {isAdmin && (
              <Button variant="outline" onClick={handleAddPlan}>
                افزودن برنامه
                <CalendarRangeIcon className="text-muted-foreground size-5" />
              </Button>
            )}
          </div>
          <div className="relative mr-auto w-full sm:w-fit">
            <Input
              className="pl-7 transition-all duration-300 placeholder:text-sm sm:w-[200px] sm:focus:w-[320px]"
              placeholder="جستجو براساس نام برنامه"
              onChange={handleChange}
            />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
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
              columns={plansListColumns}
              initialData={filteredData}
              enableColumnVisibility
              initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              onClickRow={handleClickRow}
              fullHeight
            />
          )}
        </CardContent>
      </Card>
      {addPlan && <AddPlanDialog open={addPlan} onOpenChange={setAddPlan} />}
      {openPlan && (
        <ViewPlanDialog
          open={!!openPlan}
          onOpenChange={() => setOpenPlan(null)}
          plan={openPlan}
        />
      )}
    </>
  )
}
