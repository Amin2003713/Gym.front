'use server'

import axios from 'axios'
import type { AxiosRequestHeaders } from 'axios'
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


type SigninDiagnosticStage = 'API_LOGIN' | 'NEXTAUTH_SESSION'

function sanitizeDiagnosticValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (depth > 5) return '[MAX_DEPTH]'

  if (value === null || value === undefined) return value

  if (typeof value !== 'object') return value

  if (seen.has(value)) return '[CIRCULAR]'
  seen.add(value)

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: sanitizeDiagnosticValue(value.cause, depth + 1, seen),
      ...Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          sanitizeDiagnosticValue(item, depth + 1, seen),
        ]),
      ),
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDiagnosticValue(item, depth + 1, seen))
  }

  const sensitiveKeys =
    /password|token|authorization|cookie|secret|credential|accesskey|privatekey/i

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (
        sensitiveKeys.test(key) ||
        ['headers', 'request', 'config', 'data'].includes(key.toLowerCase())
      ) {
        return [key, '[REDACTED]']
      }

      return [key, sanitizeDiagnosticValue(item, depth + 1, seen)]
    }),
  )
}

function logSigninError(
  stage: SigninDiagnosticStage,
  error: unknown,
  durationMs?: number,
) {
  console.error(
    '[AUTH][SIGNIN][FAILURE]',
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        stage,
        durationMs,
        isAxiosError: axios.isAxiosError(error),
        errorType: typeof error,
        errorConstructor:
          error !== null && typeof error === 'object'
            ? error.constructor?.name
            : typeof error,
        error: sanitizeDiagnosticValue(error),
      },
      null,
      2,
    ),
  )
}

function logSigninEvent(
  event: string,
  details: Record<string, unknown> = {},
) {
  console.info(
    '[AUTH][SIGNIN]',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...details,
    }),
  )
}

export async function signinAction(
  prvState: OperationResult<void> | undefined,
  data: SigninUserModel,
): Promise<OperationResult<void>> {
  let stage: SigninDiagnosticStage = 'API_LOGIN'
  let startedAt = Date.now()

  try {
    logSigninEvent('LOGIN_STARTED', {
      stage,
    })

    // Stage 1: Authenticate against the .NET API.
    logSigninEvent('API_REQUEST_STARTED', {
      endpoint: 'user/login',
      method: 'POST',
    })

    const user = await createData<SigninUserModel, SignedInUser>(
      'user/login',
      data,
    )

    const apiDurationMs = Date.now() - startedAt

    logSigninEvent('API_REQUEST_COMPLETED', {
      durationMs: apiDurationMs,
      hasUser: Boolean(user),
      hasToken: Boolean(user?.token),
    })

    if (!user?.token) {
      logSigninEvent('API_INVALID_RESPONSE', {
        reason: 'Missing authentication token',
        durationMs: apiDurationMs,
      })

      return {
        isSuccess: false,
        error: {
          detail: 'نام کاربری یا رمز عبور اشتباه است',
          title: 'خطا در ورود',
          status: 401,
        },
      }
    }

    // Stage 2: Establish NextAuth session.
    stage = 'NEXTAUTH_SESSION'
    startedAt = Date.now()

    logSigninEvent('NEXTAUTH_SESSION_STARTED', {
      provider: 'credentials',
    })

    await signIn('credentials', {
      accessToken: user.token,
      redirect: false,
    })

    logSigninEvent('NEXTAUTH_SESSION_COMPLETED', {
      durationMs: Date.now() - startedAt,
    })

    logSigninEvent('LOGIN_COMPLETED')

    return {
      isSuccess: true,
    }
  } catch (error: unknown) {
    const durationMs = Date.now() - startedAt

    if (isRedirectError(error)) {
      throw error
    }

    // Log the original exception before converting it.
    logSigninError(stage, error, durationMs)

    if (error instanceof AuthorizeError) {
      logSigninEvent('AUTHORIZATION_REJECTED', {
        stage,
        status: error.problem?.status,
      })

      return {
        isSuccess: false,
        error: error.problem,
      }
    }

    if (error instanceof CredentialsSignin) {
      return {
        isSuccess: false,
        error: {
          detail:
            stage === 'NEXTAUTH_SESSION'
              ? 'ایجاد نشست کاربری ناموفق بود'
              : 'نام کاربری یا رمز عبور اشتباه است',
          title: 'خطا در ورود',
          status: 401,
        },
      }
    }

    if (error instanceof AuthError) {
      return {
        isSuccess: false,
        error: {
          detail: 'خطا در احراز هویت',
          title: 'خطا در ورود',
          status: 0,
        },
      }
    }

    return {
      isSuccess: false,
      error: normalizeProblem(
        error,
        stage === 'API_LOGIN'
          ? 'خطا در ارتباط با سرور ورود'
          : 'خطا در ایجاد نشست کاربری',
      ),
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
