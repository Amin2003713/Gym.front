'use server'

import { AuthError, CredentialsSignin } from 'next-auth'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import { NewPasswordModel } from '@/app/(auth)/forget-password/_types/new-password-model'
import { SigninUserModel } from '@/app/(auth)/signin/_types/signin-user-model.type'
import { SignupValues, VerificationValues } from '@/app/(auth)/signup/_types/signup.interface'
import { AuthorizeError, signIn, signOut } from '@/auth'
import { createData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'
import { SignedInUser } from '@/types/user.interface'
import { normalizeProblem } from '@/utils/normalize-problem'
import { cwd } from 'process'

export const signupCompanyAction = async (
  formState: OperationResult<string> | null,
  data: SignupValues,
) => {
  return serverActionWrapper(
    async () => await createData<SignupValues, string>('tenant/initialize-tenant', data),
  )
}

export const verifyPhoneNumber = async (
  formState: OperationResult<string> | null,
  data: VerificationValues,
) => {
  const { phoneNumber, code, domain } = data
  const headers = domain ? { 'X-Tenant': domain } : undefined
  return serverActionWrapper(() =>
    updateData<Omit<VerificationValues, 'domain'>, string>(
      'user/verify',
      { phoneNumber, code },
      headers,
    ),
  )
}

export async function signinAction(
  prvState: OperationResult<void> | undefined,
  data: SigninUserModel,
): Promise<OperationResult<void>> {
  try {
    // 1) Perform the real login here so we keep the full `Problem` shape.
    const user = await createData<SigninUserModel, SignedInUser>('user/login', data)

    if (!user?.token) {
      return {
        isSuccess: false,
        error: {
          detail: 'نام کاربری یا رمز عبور اشتباه است',
          title: '',
          status: 0
        },
      }
    }

    // 2) Establish the NextAuth session using the token we already have.
    //    No second HTTP call — `authorize` trusts this token.
    await signIn('credentials', { accessToken: user.token, redirect: false })
      console.log(" no faid")

    return { isSuccess: true }
  } catch (error) {
    if (isRedirectError(error)) throw error

    // Auth.js may still throw if authorize returns null or the fallback path fires.
    if (error instanceof CredentialsSignin) {
      if (error instanceof AuthorizeError) {
        return { isSuccess: false, error: error.problem }
      }
      return {
        isSuccess: false,
        error: {
          detail: 'نام کاربری یا رمز عبور اشتباه است',
          title: '',
          status: 0
        },
      }
    }

    if (error instanceof AuthError) {
      return { isSuccess: false, error: {
        detail: 'خطا در احراز هویت',
        title: '',
        status: 0
      } }
    }

    // Real API failures land here — return the actual Problem.
    return {
      isSuccess: false,
      error: normalizeProblem(error, 'خطا در ورود. لطفاً دوباره تلاش کنید.'),
    }
  }
}

export const signOutAction = async (): Promise<OperationResult<void>> => {
  try {
    await signOut({ redirect: false })
    return { isSuccess: true }
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error
    return { isSuccess: false, error: normalizeProblem(error, 'خطا در خروج') }
  }
}

export const sendActivationCodeAction = async (
  prevState: OperationResult<void> | undefined,
  data: { phoneNumber: string; domain: string },
) => {
  const { phoneNumber, domain } = data
  const headers = domain ? { 'X-Tenant': domain } : undefined

  return serverActionWrapper(
    async () =>
      await createData<{ phoneNumber: string }, void>(
        'user/send-activation-code',
        { phoneNumber },
        headers,
      ),
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