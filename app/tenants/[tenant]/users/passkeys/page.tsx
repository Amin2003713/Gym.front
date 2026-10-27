'use client'

import { startRegistration } from '@simplewebauthn/browser'
import {
  Fingerprint,
  Plus,
  ShieldCheck,
  Trash2,
  LoaderCircle,
  KeyRound,
  RefreshCw,
  Smartphone,
  Laptop,
  AlertCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  deletePasskeyAction,
  getPasskeysAction,
  getPasskeyRegistrationOptionsAction,
  registerPasskeyAction,
  type PasskeyRecord,
} from '@/actions/user/passkeys'
import { toast } from '@/lib/toast'

type RegistrationOptions = Parameters<typeof startRegistration>[0]

function getPasskeyId(passkey: PasskeyRecord): string {
  return passkey.id ?? passkey.passkeyId ?? ''
}

function getPasskeyName(passkey: PasskeyRecord): string {
  return passkey.name ?? passkey.deviceName ?? 'کلید عبور'
}

function formatDate(value?: string | null): string {
  if (!value) return 'نامشخص'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'نامشخص'

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function PasskeysPage() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadPasskeys = useCallback(async () => {
    try {
      const result = await getPasskeysAction()

      if (!result.isSuccess || !result.response) {
        toast.error(result.error?.detail ?? 'دریافت کلیدهای عبور ناموفق بود.')
        return
      }

      setPasskeys(result.response)
    } catch (error: unknown) {
      console.error('Failed to load passkeys:', error)
      toast.error('دریافت کلیدهای عبور ناموفق بود.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPasskeys()
  }, [loadPasskeys])

  const handleRegister = async () => {
    if (isRegistering) return

    if (
      !window.isSecureContext ||
      !('PublicKeyCredential' in window) ||
      !('credentials' in navigator)
    ) {
      toast.error('ثبت کلید عبور در این مرورگر یا محیط پشتیبانی نمی‌شود.')
      return
    }

    setIsRegistering(true)

    try {
      // 1. Get registration challenge and options.
      const optionsResult = await getPasskeyRegistrationOptionsAction()

      if (!optionsResult.isSuccess || !optionsResult.response) {
        toast.error(
          optionsResult.error?.detail ??
            'دریافت اطلاعات ثبت کلید عبور ناموفق بود.',
        )
        return
      }

      const { cid, optionsJson } = optionsResult.response

      // 2. Start the browser's WebAuthn registration ceremony.
      const optionsJSON = JSON.parse(optionsJson) as RegistrationOptions

      const attestation = await startRegistration(optionsJSON)

      // 3. Verify and save the new passkey on the backend.
      const registrationResult = await registerPasskeyAction({
        cid,
        attestation: JSON.stringify(attestation),
      })

      if (!registrationResult.isSuccess) {
        toast.error(
          registrationResult.error?.detail ?? 'ثبت کلید عبور ناموفق بود.',
        )
        return
      }

      toast.success('کلید عبور با موفقیت ثبت شد.')
      await loadPasskeys()
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        /cancel|abort|notallowed/i.test(`${error.name} ${error.message}`)
      ) {
        return
      }

      console.error('Passkey registration failed:', error)
      toast.error('ثبت کلید عبور ناموفق بود. دوباره تلاش کنید.')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDelete = async (passkeyId: string) => {
    if (!passkeyId || deletingId) return

    setDeletingId(passkeyId)

    try {
      const result = await deletePasskeyAction(passkeyId)

      if (!result.isSuccess) {
        toast.error(result.error?.detail ?? 'حذف کلید عبور ناموفق بود.')
        return
      }

      setPasskeys((current) =>
        current.filter((item) => getPasskeyId(item) !== passkeyId),
      )

      setConfirmDelete(null)
      toast.success('کلید عبور حذف شد.')
    } catch (error: unknown) {
      console.error('Passkey deletion failed:', error)
      toast.error('حذف کلید عبور ناموفق بود.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#FB9A3C]/15 text-[#a96d20]">
            <Fingerprint className="size-7" />
          </div>

          <div>
            <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
              مدیریت کلیدهای عبور
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
              برای ورود امن‌تر به هم‌اوج، کلیدهای عبور خود را مدیریت کنید.
              می‌توانید از قابلیت امنیتی دستگاه خود مانند اثر انگشت یا تشخیص
              چهره استفاده کنید.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRegister}
          disabled={isRegistering}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FB9A3C] px-5 py-3 font-bold text-[#352820] shadow-sm transition hover:bg-[#f6a951] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistering ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isRegistering ? 'در حال ثبت...' : 'افزودن کلید عبور'}
        </button>
      </header>

      {/* Security notice */}
      <section className="flex gap-3 rounded-2xl border border-[#788584]/30 bg-[#788584]/10 p-4 sm:p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#788584]" />

        <div>
          <h2 className="text-foreground font-bold">ورود بدون رمز عبور</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            کلید عبور با استفاده از سازوکار امنیتی دستگاه یا مدیر رمز عبور شما
            تأیید می‌شود. اطلاعات بیومتریک شما نباید به هم‌اوج ارسال شود.
          </p>
        </div>
      </section>

      {/* List heading */}
      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-foreground font-bold">کلیدهای ثبت‌شده</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {passkeys.length} کلید عبور
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPasskeys()}
            disabled={isLoading}
            aria-label="تازه‌سازی فهرست"
            className="border-border text-muted-foreground hover:bg-muted inline-flex size-10 items-center justify-center rounded-xl border transition disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-3 p-8">
            <LoaderCircle className="size-7 animate-spin" />
            <p className="text-sm">در حال دریافت کلیدهای عبور...</p>
          </div>
        ) : passkeys.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-2xl">
              <KeyRound className="size-8" />
            </div>

            <h3 className="text-foreground mt-5 font-bold">
              هنوز کلید عبوری ثبت نکرده‌اید
            </h3>

            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
              یک کلید عبور اضافه کنید تا بتوانید با قابلیت امنیتی دستگاه یا مدیر
              رمز عبور خود وارد شوید.
            </p>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isRegistering}
              className="border-border text-foreground hover:bg-muted mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition disabled:opacity-50"
            >
              <Plus className="size-4" />
              ثبت اولین کلید عبور
            </button>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {passkeys.map((passkey, index) => {
              const id = getPasskeyId(passkey)
              const name = getPasskeyName(passkey)
              const isConfirming = confirmDelete === id
              const isDeleting = deletingId === id

              return (
                <li
                  key={id || passkey.credentialId || index}
                  className="p-5 sm:px-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FB9A3C]/15 text-[#a96d20]">
                        {passkey.transports?.includes('internal') ? (
                          <Fingerprint className="size-5" />
                        ) : passkey.transports?.includes('usb') ? (
                          <Laptop className="size-5" />
                        ) : (
                          <Smartphone className="size-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-foreground font-bold break-words">
                            {name}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#788584]/15 px-2 py-1 text-xs font-medium text-[#788584]">
                            <ShieldCheck className="size-3.5" />
                            ثبت‌شده
                          </span>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm">
                          تاریخ ثبت: {formatDate(passkey.createdAt)}
                        </p>

                        {passkey.lastUsedAt && (
                          <p className="text-muted-foreground mt-1 text-sm">
                            آخرین استفاده: {formatDate(passkey.lastUsedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isConfirming ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!id) {
                            toast.error(
                              'شناسه این کلید عبور در پاسخ سرور موجود نیست.',
                            )
                            return
                          }
                          setConfirmDelete(id)
                        }}
                        className="text-destructive hover:bg-destructive/10 inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold transition sm:self-center"
                      >
                        <Trash2 className="size-4" />
                        حذف
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(id)}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                        >
                          {isDeleting && (
                            <LoaderCircle className="size-4 animate-spin" />
                          )}
                          تأیید حذف
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          disabled={isDeleting}
                          className="border-border text-foreground hover:bg-muted min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50"
                        >
                          انصراف
                        </button>
                      </div>
                    )}
                  </div>

                  {isConfirming && (
                    <p className="text-destructive mt-3 flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      پس از حذف، این کلید دیگر برای ورود به حساب شما قابل
                      استفاده نخواهد بود.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground text-sm leading-6">
        نکته امنیتی: بهتر است بیش از یک کلید عبور روی دستگاه‌ها یا مدیر رمز عبور
        مورداعتماد خود داشته باشید تا در صورت ازدست‌دادن دسترسی به یک دستگاه،
        راه دیگری برای ورود داشته باشید.
      </p>
    </main>
  )
}
