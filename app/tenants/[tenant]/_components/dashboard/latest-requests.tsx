import { InboxIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { LEAVE_STATUS } from '@/constants/leave'
import { REQUEST_TYPE } from '@/constants/request-type'
import { readData } from '@/core/http-service'
import { LatestRequests as LatestRequestsType } from '@/types/dashboard.interfaces'
import { Problem } from '@/types/http-errors.interface'

const getLatestRequests = async () => {
  return await readData<LatestRequestsType[]>('dashboard/recent-requests')
    .then((res) => ({ data: res, error: null }))
    .catch((err) => {
      const error = err as Problem
      return { data: null, error }
    })
}

export default async function LatestRequests({
  className,
}: {
  className?: string
}) {
  const { data, error } = await getLatestRequests()
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>درخواست‌های اخیر</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!!data?.length ? (
          data?.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex items-center justify-between">
                <div className="flex flex-col justify-center gap-2">
                  <span className="text-sm">
                    {REQUEST_TYPE[request.requestType]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {`${request.requester} - ${request.duration} روز`}
                  </span>
                </div>
                <Badge variant="default">
                  {LEAVE_STATUS[request.status].label}
                </Badge>
              </CardContent>
            </Card>
          ))
        ) : (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>بدون درخواست فعال</EmptyTitle>
              <EmptyDescription>
                درخواست فعالی برای نمایش یافت نشد.
              </EmptyDescription>
            </EmptyHeader>
            {!!error && (
              <EmptyContent className="text-destructive-foreground text-xs">
                <span>{error.title ?? 'خطا در دریافت درخواست های اخیر!'}</span>
                <span>{error.detail}</span>
              </EmptyContent>
            )}
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
