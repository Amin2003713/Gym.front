'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import {
  AddLeaveModel,
  ReviewLeaveModel,
  UpdateLeaveModel,
} from '@/app/tenants/[tenant]/reports/leaves/_model'
import { createData, deleteData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'
import { objectToFormData } from '@/utils/object-to-form-data'

export const addLeaveAction = async (
  _prvState: OperationResult<unknown> | null,
  data: AddLeaveModel,
) => {
  const formattedMediaFiles = (data.mediaFiles ?? []).map((media) => ({
    mediaFile: media,
    mediaUrl: null,
  }))
  const formData = objectToFormData(
    { ...data, mediaFiles: formattedMediaFiles },
    { skipNullish: false, useDotNotation: true },
  )

  return serverActionWrapper(
    async () =>
      await createData<FormData, unknown>('leave/create-admin-leave', formData),
  )
}

export const deleteLeaveAction = async (
  _formState: OperationResult<unknown> | null,
  leaveId: string,
) => {
  return serverActionWrapper(
    async () => await deleteData(`leave/delete-by-admin?id=${leaveId}`),
  )
}

export const updateLeaveAction = async (
  _prvState: OperationResult<unknown> | null,
  data: UpdateLeaveModel,
) => {
  const { mediaUrls, ...rest } = data
  const formattedMediaFiles = (data.mediaFiles ?? []).map((media) => ({
    mediaFile: media,
    mediaUrl: null,
  }))
  const formattedMediaUrls = (mediaUrls ?? []).map((media) => ({
    mediaFile: null,
    mediaUrl: media.url,
  }))
  const formData = objectToFormData(
    {
      ...rest,
      mediaFiles: [...formattedMediaFiles, ...formattedMediaUrls],
    },
    { skipNullish: false, useDotNotation: true },
  )
  return serverActionWrapper(
    async () =>
      await updateData<FormData, unknown>('leave/update-admin-leave', formData),
  )
}

export const reviewLeaveAction = async (
  _prvState: OperationResult<unknown> | null,
  data: ReviewLeaveModel,
) => {
  return serverActionWrapper(
    async () =>
      await updateData<ReviewLeaveModel, unknown>('leave/review', data),
  )
}
