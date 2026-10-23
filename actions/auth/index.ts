'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import { NewPasswordModel } from '@/app/(auth)/forget-password/_types/new-password-model'
import { SigninUserModel } from '@/app/(auth)/signin/_types/signin-user-model.type'
import { SignupValues, VerificationValues } from '@/app/(auth)/signup/_types/signup.interface'
import { AuthorizeError, signIn, signOut } from '@/auth'
import { createData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'

export const signupCompanyAction = async (formState: OperationResult<string> | null, data: SignupValues) => {
  return serverActionWrapper(
    async () => await createData<SignupValues, string>('tenant/initialize-company', data),
  )
}

export const verifyPhoneNumber = async (
  formState: OperationResult<string> | null,
  data: VerificationValues,
) => {
  const { phoneNumber, code, domain } = data
  const headers = domain ? { 'X-Tenant': domain } : undefined
  return serverActionWrapper(() =>
    updateData<Omit<VerificationValues, 'domain'>, string>('user/verify', { phoneNumber, code }, headers),
  )
}

export async function signinAction(prvState: OperationResult<void> | undefined, data: SigninUserModel) {
  try {
    await signIn('credentials', { ...data, redirect: false })

    return { isSuccess: true } satisfies OperationResult<void>
  } catch (error) {
    if (error instanceof AuthorizeError) {
      return {
        isSuccess: false,
        error: error.problem,
      } satisfies OperationResult<void>
    }
  }
}

export const signOutAction = async () => {
  try {
    await signOut({ redirect: false })
    return { isSuccess: true } satisfies OperationResult<void>
  } catch (error: unknown) {
    throw new Error('')
  }
}

export const sendActivationCodeAction = async (
  prevState: OperationResult<void> | undefined,
  data: { phoneNumber: string },
) => {
  return serverActionWrapper(
    async () =>
      await createData<
        {
          phoneNumber: string
        },
        void
      >('user/send-activation-code', data),
  )
}

export const newPasswordAction = async (
  prevState: OperationResult<void> | undefined,
  data: NewPasswordModel,
) => {
  return serverActionWrapper(
    async () => await updateData<NewPasswordModel, void>('user/forgot-password', data),
  )
}
