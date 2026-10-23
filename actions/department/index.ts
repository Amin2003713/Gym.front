'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddDepartmentModel,
  UpdateDepartmentModel,
} from '@/app/tenants/[tenant]/management/departments/_model'
import { createData, deleteData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'

export const addDepartmentAction = async (
  _prvState: OperationResult<void> | null,
  data: AddDepartmentModel,
) => {
  return serverActionWrapper(
    async () => await createData<AddDepartmentModel, void>('department', data),
  )
}

export const updateDepartmentAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdateDepartmentModel,
) => {
  return serverActionWrapper(
    async () =>
      await updateData<UpdateDepartmentModel, void>('department', data),
  )
}

export const deleteDepartmentAction = async (
  _formState: OperationResult<void> | null,
  DepartmentId: string,
) => {
  return serverActionWrapper(
    async () => await deleteData(`department?id=${DepartmentId}`),
  )
}
