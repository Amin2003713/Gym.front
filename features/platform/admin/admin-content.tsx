'use client'

import { useCallback, useEffect, useState } from 'react'

import { ArrowDown, ArrowUp, Check, Plus, Trash } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformAuthError, platformAdmin } from '@/features/platform/api'
import { formatToman, slugify } from '@/features/platform/format'
import type { CmsPage, PlatformPlan, SiteFeature, SiteFaq, SitePayload } from '@/features/platform/types'
import { cn } from '@/lib/utils'

import { EmptyState, Field, Notice, Panel, textareaClass } from './admin-ui'

type Section = 'site' | 'pages' | 'plans'

export function AdminContent({
  section,
  onAuthError,
}: {
  section: Section
  onAuthError: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  // Stable identity: the tab editors run `load` in an effect keyed on this callback; a new
  // function per render would refetch forever.
  const handle = useCallback(
    (cause: unknown) => {
      if (cause instanceof PlatformAuthError) {
        onAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'عملیات انجام نشد.')
    },
    [onAuthError],
  )

  return (
    <div className="grid gap-4">
      {error && <Notice tone="danger">{error}</Notice>}
      {section === 'site' && <SiteEditor onError={handle} onClearError={() => setError(null)} />}
      {section === 'pages' && <PagesEditor onError={handle} onClearError={() => setError(null)} />}
      {section === 'plans' && <PlansEditor onError={handle} onClearError={() => setError(null)} />}
    </div>
  )
}

/* ---------------------------------------------------------------------- site */

function SiteEditor({
  onError,
  onClearError,
}: {
  onError: (cause: unknown) => void
  onClearError: () => void
}) {
  const [site, setSite] = useState<SitePayload | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    platformAdmin
      .site()
      .then((result) => {
        if (!cancelled) setSite(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) onError(cause)
      })

    return () => {
      cancelled = true
    }
  }, [onError])

  if (!site) return <div className="bg-muted h-72 animate-pulse rounded-xl" />

  const setSetting = <K extends keyof SitePayload['settings']>(
    key: K,
    value: SitePayload['settings'][K],
  ) => setSite((current) => (current ? { ...current, settings: { ...current.settings, [key]: value } } : current))

  const setFeature = (index: number, patch: Partial<SiteFeature>) =>
    setSite((current) =>
      current
        ? { ...current, features: current.features.map((item, i) => (i === index ? { ...item, ...patch } : item)) }
        : current,
    )

  const setFaq = (index: number, patch: Partial<SiteFaq>) =>
    setSite((current) =>
      current
        ? { ...current, faqs: current.faqs.map((item, i) => (i === index ? { ...item, ...patch } : item)) }
        : current,
    )

  const move = <T,>(items: T[], index: number, direction: -1 | 1): T[] => {
    const target = index + direction
    if (target < 0 || target >= items.length) return items

    const copy = [...items]
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    return copy
  }

  const save = async () => {
    setBusy(true)
    setSaved(false)
    onClearError()

    try {
      const response = await platformAdmin.saveSite({
        settings: site.settings,
        features: site.features,
        faqs: site.faqs,
      })

      setSite(response)
      setSaved(true)
    } catch (cause) {
      onError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Panel
        title="هویت و صفحه نخست"
        description="متن‌هایی که در بالای سایت، دکمه‌ها و فوتر دیده می‌شوند."
        actions={<SaveButton busy={busy} saved={saved} onClick={() => void save()} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نام برند">
            <Input value={site.settings.brandName} onChange={(event) => setSetting('brandName', event.target.value)} />
          </Field>

          <Field label="شعار کوتاه">
            <Input value={site.settings.tagline ?? ''} onChange={(event) => setSetting('tagline', event.target.value)} />
          </Field>

          <Field label="برچسب بالای تیتر">
            <Input value={site.settings.heroEyebrow} onChange={(event) => setSetting('heroEyebrow', event.target.value)} />
          </Field>

          <Field label="متن برجسته تیتر" hint="با رنگ برند زیر خط می‌خورد.">
            <Input value={site.settings.heroHighlight ?? ''} onChange={(event) => setSetting('heroHighlight', event.target.value)} />
          </Field>

          <Field label="تیتر اصلی" className="md:col-span-2">
            <Input value={site.settings.heroTitle} onChange={(event) => setSetting('heroTitle', event.target.value)} />
          </Field>

          <Field label="توضیح زیر تیتر" className="md:col-span-2">
            <textarea
              className={textareaClass}
              value={site.settings.heroSubtitle ?? ''}
              onChange={(event) => setSetting('heroSubtitle', event.target.value)}
            />
          </Field>

          <Field label="برچسب دکمه اصلی">
            <Input value={site.settings.primaryCtaLabel} onChange={(event) => setSetting('primaryCtaLabel', event.target.value)} />
          </Field>

          <Field label="نشانی دکمه اصلی" hint="مثلاً /start">
            <Input value={site.settings.primaryCtaHref} onChange={(event) => setSetting('primaryCtaHref', event.target.value)} dir="ltr" className="text-start" />
          </Field>

          <Field label="برچسب دکمه دوم">
            <Input value={site.settings.secondaryCtaLabel ?? ''} onChange={(event) => setSetting('secondaryCtaLabel', event.target.value)} />
          </Field>

          <Field label="نشانی دکمه دوم">
            <Input value={site.settings.secondaryCtaHref ?? ''} onChange={(event) => setSetting('secondaryCtaHref', event.target.value)} dir="ltr" className="text-start" />
          </Field>

          <Field label="خط اعتماد زیر دکمه‌ها" className="md:col-span-2">
            <Input value={site.settings.proof ?? ''} onChange={(event) => setSetting('proof', event.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="ویژگی‌ها" description="کارت‌های بخش امکانات. حداکثر شش مورد بیشترین خوانایی را دارد.">
        <div className="grid gap-3">
          {site.features.map((feature, index) => (
            <div key={`${feature.id}-${index}`} className="border-border grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_1.4fr_120px_auto]">
              <Input
                aria-label={`عنوان ویژگی ${index + 1}`}
                value={feature.title}
                onChange={(event) => setFeature(index, { title: event.target.value })}
                placeholder="عنوان"
              />
              <Input
                aria-label={`توضیح ویژگی ${index + 1}`}
                value={feature.description}
                onChange={(event) => setFeature(index, { description: event.target.value })}
                placeholder="توضیح کوتاه"
              />
              <select
                aria-label={`آیکون ویژگی ${index + 1}`}
                value={feature.icon}
                onChange={(event) => setFeature(index, { icon: event.target.value })}
                className="border-input h-11 rounded-sm border bg-transparent px-2 text-xs"
              >
                {['members', 'plans', 'checklist', 'payments', 'message', 'reports', 'security', 'clock', 'goal', 'sparkles'].map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <IconButton
                  label="بالا"
                  onClick={() => setSite((current) => (current ? { ...current, features: move(current.features, index, -1) } : current))}
                >
                  <ArrowUp className="size-3.5" />
                </IconButton>
                <IconButton
                  label="پایین"
                  onClick={() => setSite((current) => (current ? { ...current, features: move(current.features, index, 1) } : current))}
                >
                  <ArrowDown className="size-3.5" />
                </IconButton>
                <IconButton
                  label="حذف"
                  onClick={() => setSite((current) => (current ? { ...current, features: current.features.filter((_, i) => i !== index) } : current))}
                >
                  <Trash className="size-3.5" />
                </IconButton>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              setSite((current) =>
                current
                  ? {
                      ...current,
                      features: [
                        ...current.features,
                        {
                          id: 0,
                          title: '',
                          description: '',
                          icon: 'sparkles',
                          sortOrder: current.features.length,
                          isActive: true,
                        },
                      ],
                    }
                  : current,
              )
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            افزودن ویژگی
          </Button>
        </div>
      </Panel>

      <Panel title="پرسش‌های متداول" description="برای ساخت نشانه FAQ در نتایج گوگل، حداقل سه پرسش واقعی بنویسید.">
        <div className="grid gap-3">
          {site.faqs.map((faq, index) => (
            <div key={`${faq.id}-${index}`} className="border-border grid gap-2 rounded-lg border p-3">
              <Input
                aria-label={`پرسش ${index + 1}`}
                value={faq.question}
                onChange={(event) => setFaq(index, { question: event.target.value })}
                placeholder="پرسش"
              />
              <textarea
                aria-label={`پاسخ ${index + 1}`}
                className={textareaClass}
                value={faq.answer}
                onChange={(event) => setFaq(index, { answer: event.target.value })}
                placeholder="پاسخ"
              />
              <div className="flex justify-end">
                <IconButton
                  label="حذف"
                  onClick={() => setSite((current) => (current ? { ...current, faqs: current.faqs.filter((_, i) => i !== index) } : current))}
                >
                  <Trash className="size-3.5" />
                </IconButton>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              setSite((current) =>
                current
                  ? {
                      ...current,
                      faqs: [
                        ...current.faqs,
                        { id: 0, question: '', answer: '', sortOrder: current.faqs.length, isActive: true },
                      ],
                    }
                  : current,
              )
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            افزودن پرسش
          </Button>
        </div>
      </Panel>

      <Panel title="تماس و فوتر">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ایمیل تماس">
            <Input value={site.settings.contactEmail ?? ''} onChange={(event) => setSetting('contactEmail', event.target.value)} dir="ltr" className="text-start" />
          </Field>
          <Field label="تلفن تماس">
            <Input value={site.settings.contactPhone ?? ''} onChange={(event) => setSetting('contactPhone', event.target.value)} dir="ltr" className="text-start" />
          </Field>
          <Field label="نشانی">
            <Input value={site.settings.contactAddress ?? ''} onChange={(event) => setSetting('contactAddress', event.target.value)} />
          </Field>
          <Field label="جمله فوتر">
            <Input value={site.settings.footerNote ?? ''} onChange={(event) => setSetting('footerNote', event.target.value)} />
          </Field>
          <Field label="اینستاگرام">
            <Input value={site.settings.instagramUrl ?? ''} onChange={(event) => setSetting('instagramUrl', event.target.value)} dir="ltr" className="text-start" />
          </Field>
          <Field label="تلگرام">
            <Input value={site.settings.telegramUrl ?? ''} onChange={(event) => setSetting('telegramUrl', event.target.value)} dir="ltr" className="text-start" />
          </Field>
        </div>
      </Panel>

      <Panel title="پیش‌فرض‌های سئو" description="متای صفحه نخست؛ هر صفحه می‌تواند مقدار خودش را داشته باشد.">
        <div className="grid gap-4">
          <Field label="عنوان متا" hint="۳۰ تا ۶۰ نویسه.">
            <Input value={site.settings.metaTitle} onChange={(event) => setSetting('metaTitle', event.target.value)} />
          </Field>
          <Field label="توضیح متا" hint="۷۰ تا ۱۶۰ نویسه.">
            <textarea
              className={textareaClass}
              value={site.settings.metaDescription ?? ''}
              onChange={(event) => setSetting('metaDescription', event.target.value)}
            />
          </Field>
          <Field label="کلیدواژه‌ها" hint="با ویرگول جدا کنید.">
            <Input value={site.settings.metaKeywords ?? ''} onChange={(event) => setSetting('metaKeywords', event.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="نشانی کانونیکال" hint="مثال: https://hamowj.ir">
              <Input value={site.settings.canonicalBaseUrl ?? ''} onChange={(event) => setSetting('canonicalBaseUrl', event.target.value)} dir="ltr" className="text-start" />
            </Field>
            <Field label="تصویر OG" hint="۱۲۰۰×۶۳۰ پیکسل، نشانی کامل.">
              <Input value={site.settings.ogImageUrl ?? ''} onChange={(event) => setSetting('ogImageUrl', event.target.value)} dir="ltr" className="text-start" />
            </Field>
            <Field label="کد تأیید گوگل">
              <Input value={site.settings.googleSiteVerification ?? ''} onChange={(event) => setSetting('googleSiteVerification', event.target.value)} dir="ltr" className="text-start" />
            </Field>
            <Field label="کد تأیید بینگ">
              <Input value={site.settings.bingSiteVerification ?? ''} onChange={(event) => setSetting('bingSiteVerification', event.target.value)} dir="ltr" className="text-start" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={site.settings.allowIndexing}
              onChange={(event) => setSetting('allowIndexing', event.target.checked)}
              className="accent-primary size-4"
            />
            موتورهای جستجو اجازه ایندکس این سایت را دارند
          </label>
        </div>
      </Panel>

      <div className="flex justify-end">
        <SaveButton busy={busy} saved={saved} onClick={() => void save()} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- pages */

const blankPage: CmsPage = {
  id: null,
  slug: '',
  title: '',
  summary: null,
  body: null,
  metaTitle: null,
  metaDescription: null,
  isPublished: true,
  showInFooter: true,
  sortOrder: 0,
  updatedAtUtc: null,
}

function PagesEditor({
  onError,
  onClearError,
}: {
  onError: (cause: unknown) => void
  onClearError: () => void
}) {
  const [pages, setPages] = useState<CmsPage[]>([])
  const [draft, setDraft] = useState<CmsPage | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setPages(await platformAdmin.pages())
    } catch (cause) {
      onError(cause)
    }
  }, [onError])

  useEffect(() => {
    let cancelled = false

    platformAdmin
      .pages()
      .then((result) => {
        if (!cancelled) setPages(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) onError(cause)
      })

    return () => {
      cancelled = true
    }
  }, [onError])

  const save = async () => {
    if (!draft) return

    setBusy(true)
    onClearError()

    try {
      const saved = draft.id
        ? await platformAdmin.updatePage(draft.id, draft)
        : await platformAdmin.createPage(draft)

      setDraft(saved)
      await load()
    } catch (cause) {
      onError(cause)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    onClearError()

    try {
      await platformAdmin.deletePage(id)
      setConfirming(null)
      if (draft?.id === id) setDraft(null)
      await load()
    } catch (cause) {
      onError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Panel
        title="صفحه‌های سایت"
        actions={
          <Button size="sm" variant="outline" onClick={() => setDraft({ ...blankPage })}>
            <Plus className="size-4" aria-hidden="true" />
            جدید
          </Button>
        }
      >
        {pages.length === 0 ? (
          <p className="text-muted-foreground text-xs">هنوز صفحه‌ای ساخته نشده است.</p>
        ) : (
          <ul className="grid gap-1">
            {pages.map((page) => (
              <li key={page.id ?? page.slug}>
                <button
                  type="button"
                  onClick={() => setDraft(page)}
                  className={cn(
                    'w-full rounded-md px-2.5 py-2 text-right text-xs transition-colors',
                    draft?.id === page.id ? 'bg-foreground text-background' : 'hover:bg-muted',
                  )}
                >
                  <span className="block font-bold">{page.title}</span>
                  <span
                    className={cn(
                      'mt-0.5 block text-[10px]',
                      draft?.id === page.id ? 'text-background/70' : 'text-muted-foreground',
                    )}
                    dir="ltr"
                  >
                    /p/{page.slug}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {!draft ? (
        <Panel title="ویرایش صفحه">
          <EmptyState title="یک صفحه انتخاب کنید" body="صفحه‌ای از فهرست انتخاب کنید یا صفحه تازه بسازید." />
        </Panel>
      ) : (
        <Panel
          title={draft.id ? `ویرایش: ${draft.title}` : 'صفحه تازه'}
          actions={
            <div className="flex items-center gap-2">
              {draft.id && (
                <Button
                  size="sm"
                  variant={confirming === draft.id ? 'destructive' : 'outline'}
                  disabled={busy}
                  onClick={() =>
                    confirming === draft.id ? void remove(draft.id!) : setConfirming(draft.id)
                  }
                >
                  {confirming === draft.id ? 'تأیید حذف' : 'حذف'}
                </Button>
              )}
              <Button size="sm" isLoading={busy} onClick={() => void save()}>
                <Check className="size-4" aria-hidden="true" />
                ذخیره
              </Button>
            </div>
          }
        >
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="عنوان">
                <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </Field>
              <Field label="نشانی" hint="حروف کوچک انگلیسی، رقم و خط تیره.">
                <Input
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
                  dir="ltr"
                  className="text-start"
                />
              </Field>
            </div>

            <Field label="خلاصه">
              <Input value={draft.summary ?? ''} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </Field>

            <Field label="متن صفحه" hint="هر پاراگراف را با یک خط خالی جدا کنید. برای تیتر از «## » استفاده کنید.">
              <textarea
                className={cn(textareaClass, 'min-h-64')}
                value={draft.body ?? ''}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="عنوان متا">
                <Input value={draft.metaTitle ?? ''} onChange={(event) => setDraft({ ...draft, metaTitle: event.target.value })} />
              </Field>
              <Field label="توضیح متا">
                <Input value={draft.metaDescription ?? ''} onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={draft.isPublished}
                  onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })}
                  className="accent-primary size-4"
                />
                منتشرشده
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={draft.showInFooter}
                  onChange={(event) => setDraft({ ...draft, showInFooter: event.target.checked })}
                  className="accent-primary size-4"
                />
                نمایش در فوتر
              </label>

              <Field label="ترتیب" className="w-24">
                <Input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })}
                />
              </Field>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

/* --------------------------------------------------------------------- plans */

function PlansEditor({
  onError,
  onClearError,
}: {
  onError: (cause: unknown) => void
  onClearError: () => void
}) {
  const [plans, setPlans] = useState<PlatformPlan[]>([])
  const [draft, setDraft] = useState<PlatformPlan | null>(null)
  const [featuresText, setFeaturesText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setPlans(await platformAdmin.plans())
    } catch (cause) {
      onError(cause)
    }
  }, [onError])

  useEffect(() => {
    let cancelled = false

    platformAdmin
      .plans()
      .then((result) => {
        if (!cancelled) setPlans(result)
      })
      .catch((cause: unknown) => {
        if (!cancelled) onError(cause)
      })

    return () => {
      cancelled = true
    }
  }, [onError])

  const open = (plan: PlatformPlan | null) => {
    setDraft(
      plan ?? {
        id: null,
        code: '',
        name: '',
        description: null,
        monthlyPriceToman: 0,
        yearlyPriceToman: 0,
        features: [],
        isPopular: false,
        isActive: true,
        sortOrder: plans.length,
        tenantPlan: 0,
      },
    )
    setFeaturesText((plan?.features ?? []).join('\n'))
  }

  const save = async () => {
    if (!draft) return

    setBusy(true)
    onClearError()

    const payload: PlatformPlan = {
      ...draft,
      features: featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }

    try {
      const saved = draft.id
        ? await platformAdmin.updatePlan(draft.id, payload)
        : await platformAdmin.createPlan(payload)

      setDraft(saved)
      setFeaturesText(saved.features.join('\n'))
      await load()
    } catch (cause) {
      onError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Panel
        title="پلن‌های فروش"
        description="قیمت‌ها به تومان است. پلن غیرفعال از صفحه قیمت‌ها حذف می‌شود اما سفارش‌های قبلی دست‌نخورده می‌مانند."
        actions={
          <Button size="sm" variant="outline" onClick={() => open(null)}>
            <Plus className="size-4" aria-hidden="true" />
            پلن جدید
          </Button>
        }
      >
        <div className="grid gap-2">
          {plans.map((plan) => (
            <button
              key={plan.id ?? plan.code}
              type="button"
              onClick={() => open(plan)}
              className="border-border hover:border-primary/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-right transition-colors"
            >
              <span>
                <span className="block text-xs font-extrabold">
                  {plan.name} {plan.isPopular && <span className="text-primary">· پیشنهاد ما</span>}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[10px]" dir="ltr">
                  {plan.code}
                </span>
              </span>
              <span className="text-xs font-bold">{formatToman(plan.monthlyPriceToman)}</span>
              <span className="text-muted-foreground text-[10px]">
                {plan.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {draft && (
        <Panel
          title={draft.id ? `ویرایش پلن ${draft.name}` : 'پلن تازه'}
          actions={
            <Button size="sm" isLoading={busy} onClick={() => void save()}>
              <Check className="size-4" aria-hidden="true" />
              ذخیره
            </Button>
          }
        >
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="کد" hint="حروف کوچک انگلیسی.">
                <Input
                  value={draft.code}
                  onChange={(event) => setDraft({ ...draft, code: slugify(event.target.value) })}
                  dir="ltr"
                  className="text-start"
                />
              </Field>
              <Field label="نام">
                <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </Field>
              <Field label="پلن پایه پورتال">
                <select
                  value={draft.tenantPlan}
                  onChange={(event) => setDraft({ ...draft, tenantPlan: Number(event.target.value) })}
                  className="border-input h-11 rounded-sm border bg-transparent px-2 text-xs"
                >
                  <option value={0}>پایه</option>
                  <option value={1}>حرفه‌ای</option>
                  <option value={2}>سازمانی</option>
                </select>
              </Field>
            </div>

            <Field label="توضیح">
              <Input value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="قیمت ماهانه (تومان)">
                <Input
                  type="number"
                  value={draft.monthlyPriceToman}
                  onChange={(event) => setDraft({ ...draft, monthlyPriceToman: Number(event.target.value) })}
                  dir="ltr"
                  className="text-start"
                />
              </Field>
              <Field label="قیمت سالانه (تومان)">
                <Input
                  type="number"
                  value={draft.yearlyPriceToman}
                  onChange={(event) => setDraft({ ...draft, yearlyPriceToman: Number(event.target.value) })}
                  dir="ltr"
                  className="text-start"
                />
              </Field>
              <Field label="ترتیب">
                <Input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })}
                />
              </Field>
            </div>

            <Field label="مزایا" hint="هر مورد در یک خط.">
              <textarea
                className={cn(textareaClass, 'min-h-40')}
                value={featuresText}
                onChange={(event) => setFeaturesText(event.target.value)}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={draft.isPopular}
                  onChange={(event) => setDraft({ ...draft, isPopular: event.target.checked })}
                  className="accent-primary size-4"
                />
                پیشنهاد ما
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                  className="accent-primary size-4"
                />
                فعال برای فروش
              </label>
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- helpers */

function SaveButton({
  busy,
  saved,
  onClick,
}: {
  busy: boolean
  saved: boolean
  onClick: () => void
}) {
  return (
    <Button size="sm" isLoading={busy} onClick={onClick}>
      <Check className="size-4" aria-hidden="true" />
      {saved ? 'ذخیره شد' : 'ذخیره تغییرات'}
    </Button>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="border-border hover:bg-muted text-muted-foreground inline-flex size-8 items-center justify-center rounded-md border transition-colors"
    >
      {children}
    </button>
  )
}
