'use server'

import { serverActionWrapper } from '@/actions/server-action-wrapper'
import { createData, deleteData, readData, updateData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { OperationResult } from '@/types/operation-result'

/** Wraps a client-side validation failure into the Problem shape the UI reads. */
function problem(detail: string): Problem {
  return { title: 'خطا', status: 0, detail }
}

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

/** Accepts either a direct array or a wrapped API response ({passkeys|data}). */
function unwrapPasskeys(result: unknown): PasskeyRecord[] {
  let records: unknown = result

  if (result && typeof result === 'object') {
    const wrapped = result as Record<string, unknown>
    records = wrapped.passkeys ?? wrapped.data ?? result
  }

  if (!Array.isArray(records)) {
    throw problem('ساختار پاسخ فهرست کلیدهای عبور معتبر نیست.')
  }

  return records as PasskeyRecord[]
}

export async function getPasskeysAction(): Promise<
  OperationResult<PasskeyRecord[]>
> {
  return serverActionWrapper(async () => {
    const result = await readData<unknown>('user/passkeys')
    return unwrapPasskeys(result)
  })
}

export async function getPasskeyRegistrationOptionsAction(): Promise<
  OperationResult<PasskeyOptionsResponse>
> {
  return serverActionWrapper(async () => {
    const response = await createData<
      Record<string, never>,
      PasskeyOptionsResponse
    >('user/passkeys/options', {})

    if (!response?.cid || !response?.optionsJson) {
      throw problem('دریافت اطلاعات ثبت کلید عبور ناموفق بود.')
    }

    return response
  })
}

export async function registerPasskeyAction(input: {
  cid: string
  attestation: string
}): Promise<OperationResult<void>> {
  return serverActionWrapper(async () => {
    await createData<typeof input, unknown>('user/passkeys', input)
  })
}

export async function renamePasskeyAction(
  passkeyId: string,
  name: string,
): Promise<OperationResult<void>> {
  return serverActionWrapper(async () => {
    await updateData<{ name: string }, unknown>(
      `user/passkeys/${encodeURIComponent(passkeyId)}`,
      { name },
    )
  })
}

export async function deletePasskeyAction(
  passkeyId: string,
): Promise<OperationResult<void>> {
  return serverActionWrapper(async () => {
    await deleteData(`user/passkeys/${encodeURIComponent(passkeyId)}`)
  })
}
