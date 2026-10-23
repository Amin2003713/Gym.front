import LeavesList from '@/app/tenants/[tenant]/reports/leaves/_components/leaves-list'
import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { Leave } from '@/types/leave.interface'

const getLeaves = async () => {
  return readData<Leave[]>('leave/get-leaves')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function Leaves() {
  const { data: leaves, error } = await getLeaves()

  return (
    <>
      {/*<LeavesKpi/>*/}
      <LeavesList data={leaves} error={error} />
    </>
  )
}
