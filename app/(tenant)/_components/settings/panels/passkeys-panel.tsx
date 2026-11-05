'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { Fingerprint, KeyRound, Loader2, Pencil, Plus, Trash2, X } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import {
  deletePasskeyAction,
  getPasskeysAction,
  getPasskeyRegistrationOptionsAction,
  registerPasskeyAction,
  renamePasskeyAction,
  type PasskeyRecord,
} from '@/actions/user/passkeys'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'

type RegistrationOptions = Parameters<typeof startRegistration>[0]

const passkeyIdOf = (passkey: PasskeyRecord) =>
  passkey.id ?? passkey.passkeyId ?? ''

const nameOf = (passkey: PasskeyRecord) =>
  passkey.name ?? passkey.deviceName ?? 'کلید عبور'

const formatDate = (value?: string | null) => {
  if (!value) return 'نامشخص'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'نامشخص'
    : new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(date)
}

/**
 * Passkeys for the signed-in member: add one, rename it so the list stays readable, or remove one.
 * Password sign-in stays available, so removing the last passkey never locks anyone out.
 */
export function PasskeysPanel() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const { confirm } = useConfirm()

  const load = useCallback(async () => {
    try {
      const result = await getPasskeysAction()

      if (!result.isSuccess || !result.response) {
        toast.error(result.error?.detail ?? 'دریافت کلیدهای عبور ناموفق بود.')
        return
      }

      setPasskeys(result.response)
    } catch (error) {
      toast.error('دریافت کلیدهای عبور ناموفق بود.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)

    return () => window.clearTimeout(timer)
  }, [load])

  const register = async () => {
    if (registering) return

    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      !('PublicKeyCredential' in window) ||
      !('credentials' in navigator)
    ) {
      toast.error('ثبت کلید عبور در این مرورگر پشتیبانی نمی‌شود.')
      return
    }

    setRegistering(true)

    try {
      const optionsResult = await getPasskeyRegistrationOptionsAction()

      if (!optionsResult.isSuccess || !optionsResult.response) {
        toast.error(optionsResult.error?.detail ?? 'دریافت اطلاعات ثبت ناموفق بود.')
        return
      }

      const { cid, optionsJson } = optionsResult.response
      const attestation = await startRegistration(
        JSON.parse(optionsJson) as RegistrationOptions,
      )

      const saved = await registerPasskeyAction({
        cid,
        attestation: JSON.stringify(attestation),
      })

      if (!saved.isSuccess) {
        toast.error(saved.error?.detail ?? 'ثبت کلید عبور ناموفق بود.')
        return
      }

      toast.success('کلید عبور ثبت شد')
      await load()
    } catch (error) {
      if (
        error instanceof Error &&
        /cancel|abort|notallowed/i.test(`${error.name} ${error.message}`)
      )
        return

      toast.error('ثبت کلید عبور ناموفق بود.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setRegistering(false)
    }
  }

  const startRename = (passkey: PasskeyRecord) => {
    setEditingId(passkeyIdOf(passkey))
    setDraftName(nameOf(passkey))
  }

  const saveRename = async (passkeyId: string) => {
    const name = draftName.trim()

    if (!name) {
      toast.error('نام کلید را وارد کن')
      return
    }

    setBusyId(passkeyId)

    try {
      const result = await renamePasskeyAction(passkeyId, name)

      if (!result.isSuccess) {
        toast.error(result.error?.detail ?? 'تغییر نام ناموفق بود.')
        return
      }

      setPasskeys((current) =>
        current.map((item) =>
          passkeyIdOf(item) === passkeyId ? { ...item, name } : item,
        ),
      )
      setEditingId(null)
      toast.success('نام کلید عبور تغییر کرد')
    } catch (error) {
      toast.error('تغییر نام ناموفق بود.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (passkey: PasskeyRecord) => {
    const passkeyId = passkeyIdOf(passkey)

    if (!passkeyId) return

    const ok = await confirm({
      title: `حذف «${nameOf(passkey)}»؟`,
      description:
        'این کلید دیگر برای ورود استفاده نمی‌شود. ورود با رمز عبور همچنان کار می‌کند.',
      confirmText: 'حذف کلید',
      destructive: true,
    })

    if (!ok) return

    setBusyId(passkeyId)

    try {
      const result = await deletePasskeyAction(passkeyId)

      if (!result.isSuccess) {
        toast.error(result.error?.detail ?? 'حذف کلید عبور ناموفق بود.')
        return
      }

      setPasskeys((current) =>
        current.filter(
          (item) =>
            passkeyIdOf(item) !== passkeyId && item.credentialId !== passkeyId,
        ),
      )
      toast.success('کلید عبور حذف شد')
    } catch (error) {
      toast.error('حذف کلید عبور ناموفق بود.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Fingerprint className="text-primary size-4" aria-hidden />
            ورود با اثر انگشت یا چهره
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-5">
            کلید عبور جای رمز عبور را نمی‌گیرد؛ فقط ورود را سریع‌تر و امن‌تر می‌کند.
          </p>
        </div>

        <Button size="sm" onClick={() => void register()} disabled={registering}>
          {registering ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {registering ? 'در حال ثبت…' : 'افزودن کلید عبور'}
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex h-24 items-center justify-center gap-2 text-xs">
          <Loader2 className="size-4 animate-spin" /> در حال دریافت کلیدها…
        </div>
      ) : passkeys.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <KeyRound className="size-6" aria-hidden />
          <p className="text-foreground text-sm font-semibold">هنوز کلیدی ثبت نکرده‌ای</p>
          <p className="max-w-sm text-xs leading-6">
            با افزودن کلید، دفعه بعد می‌توانی بدون تایپ رمز وارد شوی. این کار اختیاری است.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {passkeys.map((passkey) => {
            const id = passkeyIdOf(passkey)
            const editing = editingId === id
            const busy = busyId === id

            return (
              <li key={id || passkey.credentialId} className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Fingerprint className="size-4" aria-hidden />
                  </span>

                  {editing ? (
                    <input
                      value={draftName}
                      autoFocus
                      maxLength={64}
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void saveRename(id)
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      aria-label="نام کلید عبور"
                      className="border-input bg-background h-8 min-w-0 flex-1 rounded-lg border px-2 text-sm"
                    />
                  ) : (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {nameOf(passkey)}
                      </span>
                      <span className="text-muted-foreground block text-[11px]">
                        ثبت {formatDate(passkey.createdAt)}
                        {passkey.lastUsedAt
                          ? ` · آخرین استفاده ${formatDate(passkey.lastUsedAt)}`
                          : ''}
                      </span>
                    </span>
                  )}

                  {editing ? (
                    <span className="flex items-center gap-1">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void saveRename(id)}
                      >
                        ذخیره
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="انصراف"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="تغییر نام"
                        onClick={() => startRename(passkey)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="حذف کلید"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={busy}
                        onClick={() => void remove(passkey)}
                      >
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-muted-foreground text-[11px] leading-5">
        بهتر است دو کلید روی دستگاه‌های مختلف داشته باشی تا اگر یکی در دسترس نبود،
        راه دیگری برای ورود بمانَد.
      </p>
    </div>
  )
}
