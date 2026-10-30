'use client'

import { startRegistration } from '@simplewebauthn/browser'
import {
  AlertCircle,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  deletePasskeyAction,
  getPasskeysAction,
  getPasskeyRegistrationOptionsAction,
  registerPasskeyAction,
  type PasskeyRecord,
} from '@/actions/user/passkeys'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadPasskeys = useCallback(async () => {
    try {
      const result = await getPasskeysAction()

      if (!result.isSuccess || !result.response) {
        toast.error(
          result.error?.detail ?? 'دریافت کلیدهای عبور ناموفق بود.',
          { description: result.error?.title },
        )
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
          { description: optionsResult.error?.title },
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
          { description: registrationResult.error?.title },
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
        toast.error(result.error?.detail ?? 'حذف کلید عبور ناموفق بود.', {
          description: result.error?.title,
        })
        return
      }

      setPasskeys((current) =>
        current.filter(
          (item) =>
            getPasskeyId(item) !== passkeyId &&
            item.credentialId !== passkeyId,
        ),
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
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت کلیدهای عبور
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
            برای ورود امن‌تر به هم‌اوج، کلیدهای عبور خود را مدیریت کنید؛ با
            اثر انگشت، تشخیص چهره یا مدیر رمز عبور دستگاه.
          </p>
        </div>

        <Button onClick={handleRegister} disabled={isRegistering}>
          {isRegistering ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isRegistering ? 'در حال ثبت…' : 'افزودن کلید عبور'}
        </Button>
      </header>

      <Card>
        <CardContent className="flex gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-bold">ورود بدون رمز عبور</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              کلید عبور با سازوکار امنیتی دستگاه یا مدیر رمز عبور شما تأیید
              می‌شود. اطلاعات بیومتریک شما به هم‌اوج ارسال نمی‌شود.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            کلیدهای ثبت‌شده{' '}
            <span className="text-muted-foreground ms-2 text-sm font-normal">
              ({passkeys.length.toLocaleString('fa-IR')})
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadPasskeys()}
            disabled={isLoading}
            aria-label="تازه‌سازی فهرست"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">در حال دریافت کلیدهای عبور…</p>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-lg">
                <KeyRound className="size-7" />
              </div>
              <p className="mt-4 font-bold">هنوز کلید عبوری ثبت نکرده‌اید</p>
              <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
                یک کلید عبور اضافه کنید تا با قابلیت امنیتی دستگاه یا مدیر رمز
                عبور خود وارد شوید.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                <Plus className="size-4" />
                ثبت اولین کلید عبور
              </Button>
            </div>
          ) : (
            <ul className="border-border divide-border divide-y border-t">
              {passkeys.map((passkey, index) => {
                const id = getPasskeyId(passkey)
                const name = getPasskeyName(passkey)
                const isConfirming = confirmDelete === id
                const isDeleting = deletingId === id

                return (
                  <li key={id || passkey.credentialId || index} className="py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
                          aria-hidden
                        >
                          {passkey.transports?.includes('internal') ? (
                            <Fingerprint className="size-5" />
                          ) : passkey.transports?.includes('usb') ? (
                            <Laptop className="size-5" />
                          ) : (
                            <Smartphone className="size-5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold break-words">{name}</p>
                            <Badge variant="secondary">
                              <ShieldCheck className="size-3.5" />
                              ثبت‌شده
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            تاریخ ثبت: {formatDate(passkey.createdAt)}
                          </p>
                          {passkey.lastUsedAt && (
                            <p className="text-muted-foreground text-sm">
                              آخرین استفاده: {formatDate(passkey.lastUsedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {!isConfirming ? (
                        <Button
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 self-start sm:self-center"
                          onClick={() => {
                            if (!id) {
                              toast.error(
                                'شناسه این کلید عبور در پاسخ سرور موجود نیست.',
                              )
                              return
                            }
                            setConfirmDelete(id)
                          }}
                        >
                          <Trash2 className="size-4" />
                          حذف
                        </Button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => void handleDelete(id)}
                          >
                            {isDeleting && (
                              <Loader2 className="size-4 animate-spin" />
                            )}
                            تأیید حذف
                          </Button>
                          <Button
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => setConfirmDelete(null)}
                          >
                            انصراف
                          </Button>
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
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs leading-6">
        نکته امنیتی: بهتر است بیش از یک کلید عبور روی دستگاه‌ها یا مدیر رمز عبور
        مورد اعتماد خود داشته باشید تا در صورت از دست‌دادن دسترسی به یک دستگاه،
        راه دیگری برای ورود داشته باشید.
      </p>
    </div>
  )
}
