'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  getGymEquipment,
  saveGymEquipment,
  type GymEquipment,
} from '@/app/(tenant)/_api/gym-equipment-api'
import {
  getGymSettings,
  saveGymSettings,
  type GymSettings,
  type UpdateGymSettingsInput,
} from '@/app/(tenant)/_api/gym-settings-api'
import { BarbellLoad } from '@/components/barbell-load'
import {
  Loader2,
  MapPin,
  Plus,
  Ruler,
  Save,
  Settings2,
  ShieldCheck,
  Weight,
  X,
} from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { TRAINING_AREAS } from '@/lib/training-areas'
import { toast } from '@/lib/toast'

const panel = 'rounded-2xl border bg-card shadow-sm'
const field =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const labelClass = 'block text-xs font-semibold text-muted-foreground'
const btn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

const fa = (value: number) => value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })

const TIME_ZONES = [
  'UTC',
  'Asia/Tehran',
  'Asia/Dubai',
  'Asia/Istanbul',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
]

type ProfileForm = {
  name: string
  legalName: string
  licenseNumber: string
  licenseExpiresOn: string
  isListedPublicly: boolean
  phoneNumber: string
  landLine: string
  email: string
  website: string
  address: string
  postalCode: string
  city: string
  province: string
  country: string
  primaryColor: string
  trainingAreas: string[]
  timeZoneId: string
  defaultCulture: string
  weightUnit: 'kg' | 'lb'
}

const toForm = (settings: GymSettings): ProfileForm => ({
  name: settings.name ?? '',
  legalName: settings.legalName ?? '',
  licenseNumber: settings.licenseNumber ?? '',
  licenseExpiresOn: settings.licenseExpiresOn?.slice(0, 10) ?? '',
  isListedPublicly: settings.isListedPublicly,
  phoneNumber: settings.phoneNumber ?? '',
  landLine: settings.landLine ?? '',
  email: settings.email ?? '',
  website: settings.website ?? '',
  address: settings.address ?? '',
  postalCode: settings.postalCode ?? '',
  city: settings.city ?? '',
  province: settings.province ?? '',
  country: settings.country ?? '',
  primaryColor: settings.primaryColor ?? '#FB9A3C',
  trainingAreas: settings.trainingAreas ?? [],
  timeZoneId: settings.timeZoneId || 'UTC',
  defaultCulture: settings.defaultCulture || 'fa',
  weightUnit: settings.weightUnit === 'lb' ? 'lb' : 'kg',
})

const toPayload = (form: ProfileForm): UpdateGymSettingsInput => ({
  name: form.name.trim(),
  legalName: form.legalName.trim() || null,
  licenseNumber: form.licenseNumber.trim() || null,
  licenseExpiresOn: form.licenseExpiresOn || null,
  isListedPublicly: form.isListedPublicly,
  phoneNumber: form.phoneNumber.trim(),
  landLine: form.landLine.trim() || null,
  email: form.email.trim() || null,
  website: form.website.trim() || null,
  address: form.address.trim() || null,
  postalCode: form.postalCode.trim() || null,
  city: form.city.trim() || null,
  province: form.province.trim() || null,
  country: form.country.trim().toUpperCase() || null,
  primaryColor: form.primaryColor,
  trainingAreas: form.trainingAreas,
  timeZoneId: form.timeZoneId.trim() || 'UTC',
  defaultCulture: form.defaultCulture,
  weightUnit: form.weightUnit,
})

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string
  description?: string
  icon?: typeof Settings2
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground border-b pb-1 text-[11px] font-bold uppercase tracking-wide">
      {children}
    </h3>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <p className="text-sm font-semibold">دریافت تنظیمات باشگاه ناموفق بود</p>
      <p className="text-muted-foreground mt-1 text-xs leading-6">{message}</p>
      <button type="button" className={`${btn} mt-4 border`} onClick={onRetry}>
        تلاش دوباره
      </button>
    </div>
  )
}

export function GymSettingsWorkspace() {
  const [settings, setSettings] = useState<GymSettings | null>(null)
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [baseline, setBaseline] = useState('')
  const [equipment, setEquipment] = useState<GymEquipment | null>(null)
  const [barbell, setBarbell] = useState('20')
  const [plates, setPlates] = useState<number[]>([])
  const [plateInput, setPlateInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingEquipment, setSavingEquipment] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setProblem(null)

      try {
        const [loadedSettings, loadedEquipment] = await Promise.all([
          getGymSettings(),
          getGymEquipment(),
        ])

        if (cancelled) return

        const nextForm = toForm(loadedSettings)

        setSettings(loadedSettings)
        setForm(nextForm)
        setBaseline(JSON.stringify(nextForm))
        setEquipment(loadedEquipment)
        setBarbell(String(loadedEquipment.barbellWeightKg))
        setPlates(loadedEquipment.plateSetKg)
      } catch (error) {
        if (!cancelled)
          setProblem(error instanceof Error ? error.message : 'خطای نامشخص در ارتباط با سرور')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const update = useCallback((patch: Partial<ProfileForm>) => {
    setForm((current) => (current ? { ...current, ...patch } : current))
  }, [])

  const dirty = Boolean(form) && JSON.stringify(form) !== baseline

  const saveProfile = useCallback(async () => {
    if (!form) return

    if (!form.name.trim()) {
      toast.error('نام باشگاه الزامی است')
      return
    }

    setSavingProfile(true)

    try {
      const saved = await saveGymSettings(toPayload(form))
      const nextForm = toForm(saved)

      setSettings(saved)
      setForm(nextForm)
      setBaseline(JSON.stringify(nextForm))
      toast.success('تنظیمات باشگاه ذخیره شد')
    } catch (error) {
      toast.error('ذخیره تنظیمات باشگاه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSavingProfile(false)
    }
  }, [form])

  const addPlate = useCallback(() => {
    const value = Number(plateInput)

    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      toast.error('وزن صفحه باید بین ۰ و ۱۰۰ کیلوگرم باشد')
      return
    }

    setPlates((current) =>
      current.includes(value) ? current : [...current, value].sort((a, b) => b - a),
    )
    setPlateInput('')
  }, [plateInput])

  const saveEquipment = useCallback(async () => {
    const barbellWeightKg = Number(barbell)

    if (!Number.isFinite(barbellWeightKg) || barbellWeightKg <= 0 || barbellWeightKg > 100) {
      toast.error('وزن هالتر باید بین ۰ و ۱۰۰ کیلوگرم باشد')
      return
    }

    if (plates.length === 0) {
      toast.error('حداقل یک صفحه لازم است')
      return
    }

    setSavingEquipment(true)

    try {
      const saved = await saveGymEquipment({ barbellWeightKg, plateSetKg: plates })

      setEquipment(saved)
      setBarbell(String(saved.barbellWeightKg))
      setPlates(saved.plateSetKg)
      toast.success('تجهیزات باشگاه ذخیره شد')
    } catch (error) {
      toast.error('ذخیره تجهیزات باشگاه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSavingEquipment(false)
    }
  }, [barbell, plates])

  const equipmentDirty = useMemo(() => {
    if (!equipment) return false

    return (
      Number(barbell) !== equipment.barbellWeightKg ||
      plates.length !== equipment.plateSetKg.length ||
      plates.some((plate, index) => plate !== equipment.plateSetKg[index])
    )
  }, [barbell, equipment, plates])

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (problem || !form || !equipment) {
    return <ErrorState message={problem ?? 'اطلاعات باشگاه در دسترس نیست'} onRetry={() => setAttempt((n) => n + 1)} />
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
      <Panel
        icon={ShieldCheck}
        title="اطلاعات باشگاه"
        description="این مقادیر برای همه اعضای گروه یکسان است. فقط مدیر باشگاه می‌تواند آن‌ها را تغییر دهد."
        action={
          <span className="bg-muted text-muted-foreground rounded-full border px-2.5 py-1 text-[10px] font-bold">
            {settings?.host ?? settings?.identifier}
          </span>
        }
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            void saveProfile()
          }}
        >
          <div className="space-y-3">
            <SectionTitle>هویت و مجوز</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                نام باشگاه *
                <input
                  required
                  maxLength={100}
                  className={`${field} mt-1`}
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </label>
              <label className={labelClass}>
                نام حقوقی
                <input
                  maxLength={100}
                  className={`${field} mt-1`}
                  value={form.legalName}
                  onChange={(event) => update({ legalName: event.target.value })}
                />
              </label>
              <label className={labelClass}>
                شماره مجوز
                <input
                  maxLength={50}
                  className={`${field} mt-1`}
                  value={form.licenseNumber}
                  onChange={(event) => update({ licenseNumber: event.target.value })}
                />
              </label>
              <label className={labelClass}>
                تاریخ انقضای مجوز
                <input
                  type="date"
                  dir="ltr"
                  className={`${field} mt-1`}
                  value={form.licenseExpiresOn}
                  onChange={(event) => update({ licenseExpiresOn: event.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold">نمایش در فهرست عمومی باشگاه‌ها</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  با فعال‌کردن این گزینه، باشگاه در جست‌وجوی عمومی دیده می‌شود.
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.isListedPublicly}
                onChange={(event) => update({ isListedPublicly: event.target.checked })}
                className="accent-[var(--primary)] size-5 shrink-0"
              />
            </label>
          </div>

          <div className="space-y-3">
            <SectionTitle>راه‌های تماس</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                موبایل
                <input
                  dir="ltr"
                  inputMode="tel"
                  maxLength={20}
                  className={`${field} mt-1`}
                  value={form.phoneNumber}
                  onChange={(event) => update({ phoneNumber: event.target.value })}
                  placeholder="09120000000"
                />
              </label>
              <label className={labelClass}>
                تلفن ثابت
                <input
                  dir="ltr"
                  inputMode="tel"
                  maxLength={20}
                  className={`${field} mt-1`}
                  value={form.landLine}
                  onChange={(event) => update({ landLine: event.target.value })}
                  placeholder="02100000000"
                />
              </label>
              <label className={labelClass}>
                ایمیل
                <input
                  dir="ltr"
                  type="email"
                  maxLength={200}
                  className={`${field} mt-1`}
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                />
              </label>
              <label className={labelClass}>
                وب‌سایت
                <input
                  dir="ltr"
                  inputMode="url"
                  maxLength={200}
                  className={`${field} mt-1`}
                  value={form.website}
                  onChange={(event) => update({ website: event.target.value })}
                  placeholder="https://"
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> نشانی دفتر مرکزی
              </span>
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>
                کشور
                <input
                  dir="ltr"
                  maxLength={2}
                  className={`${field} mt-1 uppercase`}
                  value={form.country}
                  onChange={(event) => update({ country: event.target.value })}
                  placeholder="IR"
                />
              </label>
              <label className={labelClass}>
                استان
                <input
                  maxLength={100}
                  className={`${field} mt-1`}
                  value={form.province}
                  onChange={(event) => update({ province: event.target.value })}
                />
              </label>
              <label className={labelClass}>
                شهر
                <input
                  maxLength={100}
                  className={`${field} mt-1`}
                  value={form.city}
                  onChange={(event) => update({ city: event.target.value })}
                />
              </label>
            </div>
            <label className={labelClass}>
              نشانی
              <input
                maxLength={250}
                className={`${field} mt-1`}
                value={form.address}
                onChange={(event) => update({ address: event.target.value })}
              />
            </label>
            <label className={`${labelClass} sm:w-1/2`}>
              کد پستی
              <input
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                className={`${field} mt-1`}
                value={form.postalCode}
                onChange={(event) => update({ postalCode: event.target.value })}
              />
            </label>
          </div>

          <div className="space-y-3">
            <SectionTitle>پیش‌فرض‌های باشگاه</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>
                منطقه زمانی
                <input
                  dir="ltr"
                  list="gym-time-zones"
                  maxLength={100}
                  className={`${field} mt-1`}
                  value={form.timeZoneId}
                  onChange={(event) => update({ timeZoneId: event.target.value })}
                />
                <datalist id="gym-time-zones">
                  {TIME_ZONES.map((zone) => (
                    <option key={zone} value={zone} />
                  ))}
                </datalist>
              </label>
              <label className={labelClass}>
                زبان پیش‌فرض
                <select
                  className={`${field} mt-1`}
                  value={form.defaultCulture}
                  onChange={(event) => update({ defaultCulture: event.target.value })}
                >
                  <option value="fa">فارسی</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className={labelClass}>
                واحد وزن باشگاه
                <select
                  className={`${field} mt-1`}
                  value={form.weightUnit}
                  onChange={(event) =>
                    update({ weightUnit: event.target.value === 'lb' ? 'lb' : 'kg' })
                  }
                >
                  <option value="kg">کیلوگرم (kg)</option>
                  <option value="lb">پوند (lb)</option>
                </select>
              </label>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <span className="block text-sm font-semibold">حوزه‌های تمرینی باشگاه</span>
              <span className="text-muted-foreground block text-xs leading-6">
                کتابخانه حرکات فقط تمرین‌های حوزه‌های انتخاب‌شده را نشان می‌دهد. بدون انتخاب، همه
                حرکات در دسترس می‌مانند.
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRAINING_AREAS.map((area) => {
                  const selected = form.trainingAreas.includes(area.code)
                  return (
                    <button
                      key={area.code}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        update({
                          trainingAreas: selected
                            ? form.trainingAreas.filter((code) => code !== area.code)
                            : [...form.trainingAreas, area.code],
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {area.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">رنگ برند</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  رنگ دکمه‌ها و لینک‌های محیط اعضا.
                </span>
              </span>
              <div className="flex items-center gap-1.5">
                {['#FB9A3C', '#E11D48', '#7C3AED', '#2563EB', '#0D9488', '#16A34A'].map(
                  (color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`رنگ برند: ${color}`}
                      aria-pressed={form.primaryColor.toLowerCase() === color.toLowerCase()}
                      onClick={() => update({ primaryColor: color })}
                      className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.primaryColor.toLowerCase() === color.toLowerCase()
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ),
                )}
                <input
                  type="color"
                  aria-label="رنگ برند (انتخاب آزاد)"
                  value={form.primaryColor}
                  onChange={(event) => update({ primaryColor: event.target.value.toUpperCase() })}
                  className="border-input bg-background h-8 w-10 cursor-pointer rounded-md border p-0.5"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span className="text-muted-foreground text-xs">
              {dirty ? 'تغییرات ذخیره نشده' : 'همه تغییرها ذخیره شده‌اند'}
            </span>
            <button
              type="submit"
              disabled={!dirty || savingProfile}
              className={`${btn} bg-primary text-primary-foreground`}
            >
              {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingProfile ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </form>
      </Panel>

      <div className="space-y-5">
        <Panel
          icon={Weight}
          title="تجهیزات باشگاه"
          description="وزن هالتر و صفحه‌های موجود در باشگاه؛ نمودار بارگذاری هالتر از همین مقادیر ساخته می‌شود."
        >
          <div className="space-y-4">
            <label className={labelClass}>
              وزن متوسط هالتر (کیلوگرم)
              <input
                type="number"
                min={0.5}
                max={100}
                step={0.5}
                className={`${field} mt-1`}
                value={barbell}
                onChange={(event) => setBarbell(event.target.value)}
              />
            </label>

            <div>
              <p className={labelClass}>صفحه‌های موجود (هر طرف)</p>
              <div className="mt-2 flex min-h-10 flex-wrap gap-1.5">
                {plates.length === 0 && (
                  <span className="text-muted-foreground text-xs">صفحه‌ای ثبت نشده است.</span>
                )}
                {plates.map((plate) => (
                  <span
                    key={plate}
                    className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full py-0.5 pe-1 ps-2.5 text-[11px] font-bold tabular-nums"
                  >
                    {fa(plate)} kg
                    <button
                      type="button"
                      aria-label={`حذف صفحه ${plate} کیلوگرم`}
                      onClick={() => setPlates((current) => current.filter((item) => item !== plate))}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  min={0.25}
                  max={100}
                  step={0.25}
                  className={field}
                  placeholder="وزن صفحه (kg)"
                  value={plateInput}
                  onChange={(event) => setPlateInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addPlate()
                    }
                  }}
                />
                <button type="button" className={`${btn} shrink-0 border`} onClick={addPlate}>
                  <Plus className="size-4" />
                  افزودن
                </button>
              </div>
            </div>

            <div className="bg-muted/20 rounded-xl border p-3">
              <p className="text-muted-foreground mb-2 text-[11px] font-semibold">
                پیش‌نمایش بارگذاری برای ۱۰۰ کیلوگرم
              </p>
              <BarbellLoad
                weight={100}
                barWeight={Number(barbell) || 20}
                plates={plates}
                className="mx-auto max-w-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Ruler className="size-3.5" />
                {fa(plates.length)} صفحه
              </span>
              <button
                type="button"
                disabled={!equipmentDirty || savingEquipment}
                onClick={() => void saveEquipment()}
                className={`${btn} bg-primary text-primary-foreground`}
              >
                {savingEquipment ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {savingEquipment ? 'در حال ذخیره…' : 'ذخیره تجهیزات'}
              </button>
            </div>
          </div>
        </Panel>

        <Panel
          icon={Settings2}
          title="اعضای باشگاه"
          description="واحدها، تم و تجهیزات شخصی هر عضو در تنظیمات خودش تغییر می‌کند و روی این صفحه اثری ندارد."
        >
          <p className="text-muted-foreground text-xs leading-6">
            این صفحه فقط تنظیمات سطح باشگاه را تغییر می‌دهد. تنظیمات شخصی اعضا شامل واحد وزن،
            شروع هفته، تایمر استراحت و ظاهر برنامه است.
          </p>
        </Panel>
      </div>
    </div>
  )
}
