'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddStationModel,
  UpdateStationModel,
} from '@/app/tenants/[tenant]/management/stations/_model'
import { createData, deleteData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'

export const addStationAction = async (
  _prvState: OperationResult<void> | null,
  data: AddStationModel,
) => {
  return serverActionWrapper(
    async () => await createData<AddStationModel, void>('station', data),
  )
}

export const updateStationAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdateStationModel,
) => {
  return serverActionWrapper(
    async () => await updateData<UpdateStationModel, void>('station', data),
  )
}

export const deleteStationAction = async (
  _formState: OperationResult<void> | null,
  stationId: string,
) => {
  return serverActionWrapper(
    async () => await deleteData(`station?id=${stationId}`),
  )
}
