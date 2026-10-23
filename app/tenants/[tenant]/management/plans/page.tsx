import { readData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { Plan } from '@/types/plan.interface'

import PlansList from './_components/plans-list'

const getPlans = async () => {
  return readData<Plan[]>('plan/get-plans')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function PlansManagement() {
  const { data: plans, error } = await getPlans()

  return (
    <>
      {/*<PlansKpi/>*/}
      <PlansList data={plans} error={error} />
    </>
  )
}
