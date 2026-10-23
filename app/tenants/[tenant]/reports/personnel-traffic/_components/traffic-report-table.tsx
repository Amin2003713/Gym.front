'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import DataTable from '@/components/data-table'
import { ApiResponse } from '@/types/api-response.interface'
import { TrafficInterface } from '@/types/traffic.interface'

import { trafficReportColumns } from './column'

type TrafficReportTableProps = ApiResponse<TrafficInterface[]>

export default function TrafficReportTable({
  data: trafficReport,
  error,
}: TrafficReportTableProps) {
  useEffect(() => {
    if (!trafficReport && !!error) {
      toast.error('خطا در دریافت اطلاعات!', { description: error.detail })
    }
  }, [trafficReport, error])

  return (
    <>
      {error ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-destructive-foreground text-sm md:text-base">
            {error.detail}!
          </span>
        </div>
      ) : (
        <DataTable
          columns={trafficReportColumns}
          initialData={trafficReport ?? []}
          idField="date"
          enableColumnVisibility
          initialState={{ pagination: { pageSize: 31, pageIndex: 0 } }}
          fullHeight
        />
      )}
    </>
  )
}
