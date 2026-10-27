'use server'

import { createData, readData, deleteData } from '@/core/http-service'

export interface PasskeyRecord {
  id?: string
  passkeyId?: string
  name?: string | null
  deviceName?: string | null
  credentialId?: string | null
  createdAt?: string | null
  lastUsedAt?: string | null
  transports?: string[] | null
}

export interface PasskeyOptionsResponse {
  cid: string
  optionsJson: string
}

export interface PasskeyActionResult<T> {
  isSuccess: boolean
  response?: T
  error?: {
    title: string
    detail: string
    status: number
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'درخواست ناموفق بود. دوباره تلاش کنید.'
}

function failure<T>(error: unknown): PasskeyActionResult<T> {
  return {
    isSuccess: false,
    error: {
      title: 'خطا',
      detail: getErrorMessage(error),
      status: 0,
    },
  }
}

export async function getPasskeysAction(): Promise<
  PasskeyActionResult<PasskeyRecord[]>
> {
  try {
    const result = await readData<unknown>('user/passkeys')

    // Support either a direct array or a wrapped API response.
    let records: unknown = result

    if (result && typeof result === 'object') {
      const wrapped = result as Record<string, unknown>
      records = wrapped.passkeys ?? wrapped.data ?? result
    }

    if (!Array.isArray(records)) {
      throw new Error('ساختار پاسخ فهرست کلیدهای عبور معتبر نیست.')
    }

    return {
      isSuccess: true,
      response: records as PasskeyRecord[],
    }
  } catch (error: unknown) {
    return failure(error)
  }
}

export async function getPasskeyRegistrationOptionsAction(): Promise<
  PasskeyActionResult<PasskeyOptionsResponse>
> {
  try {
    const response = await createData<
      Record<string, never>,
      PasskeyOptionsResponse
    >('user/passkeys/options', {})

    if (!response?.cid || !response?.optionsJson) {
      throw new Error('دریافت اطلاعات ثبت کلید عبور ناموفق بود.')
    }

    return {
      isSuccess: true,
      response,
    }
  } catch (error: unknown) {
    return failure(error)
  }
}

export async function registerPasskeyAction(input: {
  cid: string
  attestation: string
}): Promise<PasskeyActionResult<void>> {
  try {
    await createData<typeof input, unknown>('user/passkeys', input)

    return { isSuccess: true }
  } catch (error: unknown) {
    return failure(error)
  }
}

export async function deletePasskeyAction(
  passkeyId: string,
): Promise<PasskeyActionResult<void>> {
  try {
    await deleteData(`user/passkeys/${encodeURIComponent(passkeyId)}`)

    return { isSuccess: true }
  } catch (error: unknown) {
    return failure(error)
  }
}
