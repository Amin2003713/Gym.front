'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddTrafficModel,
  UpdateTrafficModel,
} from '@/app/tenants/[tenant]/reports/personnel-traffic/_model'
import { createData, deleteData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'

export const addTrafficAction = async (
  _prvState: OperationResult<void> | null,
  data: AddTrafficModel,
) => {
  return serverActionWrapper(
    async () => await createData<AddTrafficModel, void>('record', data),
  )
}

export const updateTrafficAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdateTrafficModel,
) => {
  return serverActionWrapper(
    async () => await updateData<UpdateTrafficModel, void>('record', data),
  )
}

export const deleteTrafficAction = async (
  _formState: OperationResult<void> | null,
  trafficId: string,
) => {
  return serverActionWrapper(
    async () => await deleteData(`record?id=${trafficId}`),
  )
}
