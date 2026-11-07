'use server'

import { AxiosRequestHeaders } from 'axios'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { AuthError, CredentialsSignin } from 'next-auth'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import { NewPasswordModel } from '@/app/(auth)/forget-password/_types/new-password-model'
import {
  PasskeyLoginRequest,
  PasskeyLoginResponse,
  PasskeyOptionsResponse,
} from '@/app/(auth)/signin/_types/passkey-auth.types'
import { SigninUserModel } from '@/app/(auth)/signin/_types/signin-user-model.type'
import {
  SignupValues,
  VerificationValues,
} from '@/app/(auth)/signup/_types/signup.interface'
import { AuthorizeError, signIn, signOut } from '@/auth'
import { createData, updateData } from '@/core/http-service'
import { OperationResult } from '@/types/operation-result'
import { SignedInUser } from '@/types/user.interface'
import { normalizeProblem } from '@/utils/normalize-problem'


export const signupCompanyAction = async (
  formState: OperationResult<string> | null,
  data: SignupValues,
) => {
  return serverActionWrapper(
    async () =>
      await createData<SignupValues, string>('tenant/initialize-tenant', data),
  )
}

/**
 * Verifies the one-time code that was emailed to the account. The phone number remains the
 * login identity; the code itself is delivered by email.
 */
export const verifyPhoneNumber = async (
  formState: OperationResult<string> | null,
  data: VerificationValues,
) => {
  const { email, phoneNumber, code, domain } = data
  const headers = domain ? { 'X-Tenant': domain } : undefined
  return serverActionWrapper(() =>
    updateData<{ email?: string; phoneNumber?: string; code: string }, string>(
      'user/verify',
      { email, phoneNumber, code },
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
    const user = await createData<SigninUserModel, SignedInUser>(
      'user/login',
      data,
    )

    if (!user?.token) {
      return {
        isSuccess: false,
        error: {
          detail: 'نام کاربری یا رمز عبور اشتباه است',
          title: '',
          status: 0,
        },
      }
    }

    // 2) Establish the NextAuth session using the token we already have.
    //    No second HTTP call — `authorize` trusts this token.
    await signIn('credentials', { accessToken: user.token, redirect: false })

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
          status: 0,
        },
      }
    }

    if (error instanceof AuthError) {
      return {
        isSuccess: false,
        error: {
          detail: 'خطا در احراز هویت',
          title: '',
          status: 0,
        },
      }
    }

    // Real API failures land here — return the actual Problem.
    return {
      isSuccess: false,
      error: normalizeProblem(error, 'خطا در ورود. لطفاً دوباره تلاش کنید.'),
    }
  }
}

/**
 * Establishes the NextAuth session from a token returned by `user/verify`
 * (or any other flow that yields an access token without a login round-trip).
 */
export async function signinWithTokenAction(
  accessToken: string,
): Promise<OperationResult<void>> {
  try {
    if (!accessToken) {
      return {
        isSuccess: false,
        error: {
          title: '',
          detail: 'توکن نامعتبر است',
          status: 0,
        },
      }
    }

    await signIn('credentials', { accessToken, redirect: false })
    return { isSuccess: true }
  } catch (error) {
    if (isRedirectError(error)) throw error

    if (error instanceof CredentialsSignin) {
      return {
        isSuccess: false,
        error: {
          detail: 'ایجاد نشست کاربری ناموفق بود',
          title: '',
          status: 0,
        },
      }
    }

    return {
      isSuccess: false,
      error: normalizeProblem(error, 'خطا در ایجاد نشست کاربری'),
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
  data: { email?: string; phoneNumber?: string; domain: string },
) => {
  const { email, phoneNumber, domain } = data

  const headers: AxiosRequestHeaders | undefined = domain
    ? ({ 'X-Tenant': domain } as unknown as AxiosRequestHeaders)
    : undefined

  return serverActionWrapper(
    async () =>
      await createData<{ email?: string; phoneNumber?: string }, void>(
        'user/send-activation-code',
        { email, phoneNumber },
        headers,
      ),
  )
}

export const newPasswordAction = async (
  prevState: OperationResult<void> | undefined,
  data: NewPasswordModel,
) => {
  return serverActionWrapper(
    async () =>
      await updateData<NewPasswordModel, void>('user/forgot-password', data),
  )
}

export async function getPasskeyLoginOptionsAction(): Promise<
  OperationResult<PasskeyOptionsResponse>
> {
  try {
    const response = await createData<
      Record<string, never>,
      PasskeyOptionsResponse
    >('user/passkey/login-options', {})

    if (!response?.cid || !response?.optionsJson) {
      return {
        isSuccess: false,
        error: {
          title: 'خطا در ورود',
          detail: 'دریافت اطلاعات ورود با کلید عبور ناموفق بود.',
          status: 0,
        },
      }
    }

    return {
      isSuccess: true,
      response,
    }
  } catch (error: unknown) {
    return {
      isSuccess: false,
      error: normalizeProblem(
        error,
        'دریافت اطلاعات ورود با کلید عبور ناموفق بود.',
      ),
    }
  }
}

/**
 * Step 2: Verify the WebAuthn assertion and establish
 * the existing NextAuth credentials session using the returned token.
 */
export async function verifyPasskeyLoginAction(
  request: PasskeyLoginRequest,
): Promise<OperationResult<void>> {
  try {
    const result = await createData<PasskeyLoginRequest, PasskeyLoginResponse>(
      'user/passkey/login',
      request,
    )

    const accessToken = result?.token

    if (!accessToken) {
      return {
        isSuccess: false,
        error: {
          title: 'خطا در ورود',
          detail: 'ورود با کلید عبور ناموفق بود.',
          status: 0,
        },
      }
    }

    // Reuse your existing Credentials provider and JWT callbacks.
    await signIn('credentials', {
      accessToken,
      redirect: false,
    })

    return { isSuccess: true }
  } catch (error: unknown) {
    if (error instanceof AuthorizeError) {
      return {
        isSuccess: false,
        error: error.problem,
      }
    }

    if (error instanceof CredentialsSignin) {
      return {
        isSuccess: false,
        error: {
          title: 'خطا در ورود',
          detail: 'ورود با کلید عبور ناموفق بود.',
          status: 0,
        },
      }
    }

    if (error instanceof AuthError) {
      return {
        isSuccess: false,
        error: {
          title: 'خطا در احراز هویت',
          detail: 'ایجاد نشست کاربری ناموفق بود.',
          status: 0,
        },
      }
    }

    return {
      isSuccess: false,
      error: normalizeProblem(error, 'ورود با کلید عبور ناموفق بود.'),
    }
  }
}
