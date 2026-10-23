'use client'

import { MapPinnedIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import DataTable from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/use-debounce-search'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { Station } from '@/types/station.interface'

import AddStationDialog from './add-station-dialog'
import { stationsListColumns } from './columns'

type StationsListProps = ApiResponse<Station[]>

export default function StationsList({
  data: stations,
  error,
}: StationsListProps) {
  const [addStation, setAddStation] = useState(false)

  const isAdmin = useUserStore((state) => state.isAdmin)

  useEffect(() => {
    if (!stations && !!error) {
      toast.error('خطا در دریافت اطلاعات!', { description: error.detail })
    }
  }, [stations, error])

  const { filteredData, handleChange } = useDebouncedSearch<Station>({
    data: stations ?? [],
    searchKeys: ['name', 'code'],
    delay: 300,
  })

  const handleAddStation = () => {
    if (!isAdmin) return
    setAddStation(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 md:flex-row">
          <div className="flex w-full items-center justify-between">
            <CardTitle className="whitespace-nowrap">لیست ایستگاه‌ها</CardTitle>
            {isAdmin && (
              <Button variant="outline" onClick={handleAddStation}>
                افزودن ایستگاه
                <MapPinnedIcon className="text-muted-foreground size-5" />
              </Button>
            )}
          </div>
          <div className="relative mr-auto w-full sm:w-fit">
            <Input
              className="pl-7 transition-all duration-300 placeholder:text-sm sm:w-[200px] sm:focus:w-[320px]"
              placeholder="جستجو براساس نام و کد"
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
              columns={stationsListColumns}
              initialData={filteredData}
              enableColumnVisibility
              initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              fullHeight
            />
          )}
        </CardContent>
      </Card>
      {addStation && (
        <AddStationDialog open={addStation} onOpenChange={setAddStation} />
      )}
    </>
  )
}
