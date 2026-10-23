'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddUserModel,
  UpdateUserModel,
  UpdateUserSimSerialModel,
} from '@/app/tenants/[tenant]/users/_model/user.types'
import { createData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'
import { objectToFormData } from '@/utils/object-to-form-data'

export const addUserAction = async (
  _prvState: OperationResult<void> | null,
  data: AddUserModel,
) => {
  const formattedImageFile = {
    ...data,
    imageFile: { mediaFile: data.imageFile?.[0] },
  }
  const formData = objectToFormData(formattedImageFile, {
    useDotNotation: true,
  })
  return serverActionWrapper(
    async () =>
      await createData<FormData, void>('user/register-employee', formData),
  )
}

export const updateUserAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdateUserModel,
) => {
  const formattedImageFile = {
    ...data,
    imageFile: { mediaFile: data.imageFile?.[0], mediaUrl: data.imageUrl },
  }
  const formData = objectToFormData(formattedImageFile, {
    useDotNotation: true,
  })
  return serverActionWrapper(
    async () => await updateData<FormData, void>('user/update-user', formData),
  )
}

export const updateUserSimSerialAction = async (
  _prvState: OperationResult<void> | null,
  data: UpdateUserSimSerialModel,
) => {
  return serverActionWrapper(
    async () =>
      await updateData<UpdateUserSimSerialModel, void>(
        `user/update-simserial?userId=${data.userId}&simSerial=${data.simSerial}`,
        data,
      ),
  )
}
export const activationUserAction = async (
  _prvState: OperationResult<void> | null,
  userId: string,
) => {
  return serverActionWrapper(
    async () =>
      await updateData<string, void>(
        `user/active-users?userId=${userId}`,
        userId,
      ),
  )
}
