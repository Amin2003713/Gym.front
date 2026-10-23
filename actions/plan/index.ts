'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddPlanModel,
  UpdatePlanModel,
} from '@/app/tenants/[tenant]/management/plans/_model'
import { createData, deleteData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'

export const addPlanAction = async (
  _prvState: OperationResult<void> | null,
  data: AddPlanModel,
) => {
  return serverActionWrapper(
    async () => await createData<AddPlanModel, void>('plan', data),
  )
}

export const updatePlanAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdatePlanModel,
) => {
  return serverActionWrapper(
    async () => await updateData<UpdatePlanModel, void>('plan', data),
  )
}

export const deletePlanAction = async (
  _formState: OperationResult<void> | null,
  planId: string,
) => {
  return serverActionWrapper(async () => await deleteData(`plan?id=${planId}`))
}
