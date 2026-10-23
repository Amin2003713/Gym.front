import { auth } from '@/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { TrafficInterface } from '@/types/traffic.interface'
import { PublicUser } from '@/types/user.interface'
import { formatJalaliDate } from '@/utils/date'

import TrafficRangePicker from './_components/traffic-range-picker'
import TrafficReportTable from './_components/traffic-report-table'

type UserReportModel = {
  userId: string
  month: string
  year: string
}

type TrafficReportProps = {
  searchParams: Promise<{ userId?: string; month?: string; year?: string }>
}

const getUsers = async () => {
  return readData<PublicUser[]>('user/get-users')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

const getUserReport = async (data: UserReportModel) => {
  return await readData<TrafficInterface[]>('record/report-records', {
    params: data,
  })
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function Page({ searchParams }: TrafficReportProps) {
  const { userId: spId, month, year } = await searchParams
  const session = await auth()
  const user = session?.user
  const userId = spId ?? user?.id

  if (!userId) {
    throw new Error(
      'User ID not found. User must be authenticated or provide userId in query.',
    )
  }

  const { data: users } = await getUsers()

  const today = new Date()
  const payload = {
    userId,
    month: month ?? formatJalaliDate(today, 'MM')!,
    year: year ?? formatJalaliDate(today, 'yyyy')!,
  }

  const { data: trafficReport, error: reportsError } =
    await getUserReport(payload)

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت تردد پرسنل</CardTitle>
        <CardDescription>
          گزارش های حضور، غیاب، ثبت ورود و خروج پرسنل
        </CardDescription>
        <TrafficRangePicker {...payload} users={users ?? []} />
      </CardHeader>
      <CardContent>
        <TrafficReportTable data={trafficReport} error={reportsError} />
      </CardContent>
    </Card>
  )
}
