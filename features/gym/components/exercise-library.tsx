'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Activity, AlertCircle, ArrowLeft, Check, ChevronLeft, Dumbbell, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { exerciseApi, exerciseCoverUrl, type ExerciseDto, type ExerciseInput, type ExerciseListItemDto, type ExerciseMuscleRole } from '../api/exercises-api'

const fieldClass = 'min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'
const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
const emptyForm = (): ExerciseInput => ({ name: '', description: '', languageCode: 'fa', category: '', bodyPart: '', equipment: '', target: '', level: '', mechanic: '', force: '', exerciseType: '', muscles: [], instructions: [], media: [] })
const val = (value?: string | null) => value ?? ''

export function ExerciseLibrary() {
  const [items, setItems] = useState<ExerciseListItemDto[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [rowCount, setRowCount] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [equipment, setEquipment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ExerciseInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<ExerciseDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await exerciseApi.list({ pageNumber: page, pageSize: 20, search: search.trim() || undefined, category: category || undefined, bodyPart: bodyPart || undefined, equipment: equipment || undefined, languageCode: 'fa' })
      setItems(result.results ?? []); setPageCount(result.pageCount ?? 0); setRowCount(result.rowCount ?? 0)
    } catch (e) {
      const err = e as { message?: string; response?: { data?: { detail?: string; title?: string } } }
      const message = err.response?.data?.detail || err.response?.data?.title || err.message || 'دریافت فهرست حرکات ناموفق بود.'
      setError(message); setItems([])
    } finally { setLoading(false) }
  }, [page, search, category, bodyPart, equipment])
  useEffect(() => { void load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setEditorOpen(true) }
  const openEdit = async (id: string) => {
    setDetailLoading(true)
    try {
      const detail = await exerciseApi.get(id, 'fa')
      setEditingId(id)
      setForm({ name: detail.name, description: detail.description ?? '', languageCode: detail.languageCode || 'fa', category: detail.category ?? '', bodyPart: detail.bodyPart ?? '', equipment: detail.equipment ?? '', target: detail.target ?? '', level: detail.level ?? '', mechanic: detail.mechanic ?? '', force: detail.force ?? '', exerciseType: detail.exerciseType ?? '', muscles: detail.muscles.map(x => ({ muscleId: x.muscleId, role: x.role })), instructions: detail.instructions.sort((a,b) => a.stepNumber - b.stepNumber).map(x => x.text), media: detail.media.map(x => ({ assetId: x.asset.id, role: x.role, order: x.order, isPrimary: x.isPrimary })) })
      setEditorOpen(true)
    } catch { toast.error('جزئیات حرکت دریافت نشد.') } finally { setDetailLoading(false) }
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) { toast.error('نام حرکت را وارد کنید.'); return }
    setSaving(true)
    const payload: ExerciseInput = { ...form, name: form.name.trim(), description: form.description?.trim() || null, languageCode: form.languageCode || 'fa', category: form.category || null, bodyPart: form.bodyPart || null, equipment: form.equipment || null, target: form.target || null, level: form.level || null, mechanic: form.mechanic || null, force: form.force || null, exerciseType: form.exerciseType || null }
    try {
      if (editingId) await exerciseApi.update(editingId, payload); else await exerciseApi.create(payload)
      toast.success(editingId ? 'حرکت به‌روزرسانی شد.' : 'حرکت ایجاد شد.'); setEditorOpen(false); await load()
    } catch (e) { const err = e as { response?: { data?: { detail?: string; title?: string } }; message?: string }; toast.error(err.response?.data?.detail || err.response?.data?.title || err.message || 'ذخیره حرکت ناموفق بود.') }
    finally { setSaving(false) }
  }
  const remove = async (item: ExerciseListItemDto) => {
    if (!window.confirm(`حرکت «${item.name}» حذف شود؟`)) return
    setDeletingId(item.id)
    try { await exerciseApi.delete(item.id); toast.success('حرکت حذف شد.'); await load() }
    catch (e) { const err = e as { response?: { data?: { detail?: string; title?: string } }; message?: string }; toast.error(err.response?.data?.detail || err.response?.data?.title || err.message || 'حذف حرکت ناموفق بود.') }
    finally { setDeletingId(null) }
  }
  const showDetail = async (id: string) => { setDetailLoading(true); try { setSelected(await exerciseApi.get(id, 'fa')) } catch { toast.error('جزئیات حرکت دریافت نشد.') } finally { setDetailLoading(false) } }
  const updateForm = (key: keyof ExerciseInput, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const filteredCount = useMemo(() => rowCount.toLocaleString('fa-IR'), [rowCount])

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Dumbbell className="size-5" /></span><div><h2 className="font-bold">کتابخانه حرکات</h2><p className="mt-1 text-sm text-muted-foreground">{filteredCount} حرکت در فهرست سرور</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => void load()} className={`${buttonClass} border bg-background hover:bg-muted`} disabled={loading}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> تازه‌سازی</button><button onClick={openCreate} className={`${buttonClass} bg-primary text-primary-foreground hover:brightness-95`}><Plus className="size-4" /> حرکت جدید</button></div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
        <label className="relative sm:col-span-2 lg:col-span-1"><span className="sr-only">جست‌وجوی حرکت</span><Search className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /><input className={`${fieldClass} pr-9`} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="نام یا توضیحات حرکت" /></label>
        <label><span className="sr-only">گروه تمرینی</span><select className={fieldClass} value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}><option value="">همه دسته‌ها</option>{['Strength','Cardio','Mobility','Warmup','Other'].map(x => <option key={x} value={x}>{({Strength:'قدرتی',Cardio:'هوازی',Mobility:'تحرک',Warmup:'گرم‌کردن',Other:'سایر'} as Record<string,string>)[x]}</option>)}</select></label>
        <label><span className="sr-only">عضله یا ناحیه بدن</span><input className={fieldClass} value={bodyPart} onChange={e => { setBodyPart(e.target.value); setPage(1) }} placeholder="ناحیه بدن (متن)" /></label>
        <label><span className="sr-only">تجهیزات</span><input className={fieldClass} value={equipment} onChange={e => { setEquipment(e.target.value); setPage(1) }} placeholder="تجهیزات (متن)" /></label>
      </div>
    </section>

    {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center"><AlertCircle className="size-5 shrink-0 text-destructive" /><div className="min-w-0 flex-1"><p className="font-semibold">اتصال یا دریافت اطلاعات با خطا مواجه شد</p><p className="mt-1 break-words text-sm text-muted-foreground">{error}</p></div><button onClick={() => void load()} className={`${buttonClass} border bg-background`}>تلاش دوباره</button></div>}

    {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(x => <div key={x} className="h-48 animate-pulse rounded-2xl border bg-card" />)}</div> : items.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(item => {
      const cover = exerciseCoverUrl(item.cover)
      return <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
        <button onClick={() => void showDetail(item.id)} className="relative flex h-40 items-center justify-center overflow-hidden bg-muted/50 text-muted-foreground" aria-label={`نمایش جزئیات ${item.name}`}>
          {cover ? <img src={cover} alt={item.name} loading="lazy" className="h-full w-full object-contain p-3" /> : <Dumbbell className="size-10 opacity-40" />}
          <span className="absolute bottom-2 right-2 rounded-full border bg-card/90 px-2.5 py-1 text-[11px]">{item.exerciseType || item.category || 'حرکت تمرینی'}</span>
        </button>
        <div className="flex flex-1 flex-col p-4"><div className="flex items-start justify-between gap-3"><button onClick={() => void showDetail(item.id)} className="min-w-0 text-right font-bold leading-6 hover:text-primary">{item.name}</button><span className="shrink-0 rounded-lg bg-secondary px-2 py-1 text-xs text-secondary-foreground">{item.level || 'همه سطوح'}</span></div><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.description || 'برای مشاهده توضیحات و دستورالعمل اجرا، جزئیات حرکت را باز کنید.'}</p><div className="mt-3 flex flex-wrap gap-1.5">{[item.bodyPart,item.equipment,item.target].filter(Boolean).slice(0,3).map(tag => <span key={tag} className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>)}</div><div className="mt-4 flex items-center justify-between border-t pt-3"><button onClick={() => void showDetail(item.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">جزئیات <ArrowLeft className="size-3.5" /></button><div className="flex gap-1"><button title="ویرایش حرکت" aria-label="ویرایش حرکت" onClick={() => void openEdit(item.id)} disabled={detailLoading} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></button><button title="حذف حرکت" aria-label="حذف حرکت" onClick={() => void remove(item)} disabled={deletingId === item.id} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">{deletingId === item.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button></div></div></div>
      </article>
    })}</div> : !error ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-5 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Activity className="size-6 text-muted-foreground" /></span><h3 className="mt-4 font-bold">حرکتی پیدا نشد</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">فیلترها را تغییر دهید یا اولین حرکت را در کتابخانه ثبت کنید.</p><button onClick={openCreate} className={`${buttonClass} mt-4 bg-primary text-primary-foreground`}><Plus className="size-4" /> افزودن حرکت</button></div> : null}

    {!loading && pageCount > 1 && <div className="flex items-center justify-between rounded-xl border bg-card p-3"><span className="text-sm text-muted-foreground">صفحه {page.toLocaleString('fa-IR')} از {pageCount.toLocaleString('fa-IR')}</span><div className="flex gap-2"><button className={`${buttonClass} border bg-background`} disabled={page <= 1} onClick={() => setPage(p => Math.max(1,p-1))}><ChevronLeft className="size-4" /> قبلی</button><button className={`${buttonClass} border bg-background`} disabled={page >= pageCount} onClick={() => setPage(p => Math.min(pageCount,p+1))}>بعدی <ArrowLeft className="size-4" /></button></div></div>}

    {editorOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setEditorOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="exercise-editor-title" className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-card shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 p-4 backdrop-blur"><div><h2 id="exercise-editor-title" className="font-bold">{editingId ? 'ویرایش حرکت' : 'ثبت حرکت جدید'}</h2><p className="mt-1 text-xs text-muted-foreground">اطلاعات مستقیماً به API حرکات ارسال می‌شود.</p></div><button onClick={() => setEditorOpen(false)} disabled={saving} aria-label="بستن" className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button></div>
      <form onSubmit={submit} className="space-y-5 p-4 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className={labelClass}>نام حرکت *</span><input required className={fieldClass} value={form.name} onChange={e => updateForm('name',e.target.value)} /></label><label className="sm:col-span-2"><span className={labelClass}>توضیحات</span><textarea rows={2} className={fieldClass} value={val(form.description)} onChange={e => updateForm('description',e.target.value)} /></label>{([{key:'category',label:'دسته'},{key:'bodyPart',label:'ناحیه بدن'},{key:'equipment',label:'تجهیزات'},{key:'target',label:'عضله/هدف'},{key:'level',label:'سطح'},{key:'mechanic',label:'مکانیک'},{key:'force',label:'نوع نیرو'},{key:'exerciseType',label:'نوع حرکت'}] as const).map(({key,label}) => <label key={key}><span className={labelClass}>{label}</span><input className={fieldClass} value={val(form[key] as string)} onChange={e => updateForm(key,e.target.value)} /></label>)}<label><span className={labelClass}>زبان</span><select className={fieldClass} value={form.languageCode || 'fa'} onChange={e => updateForm('languageCode',e.target.value)}><option value="fa">فارسی (fa)</option><option value="en">English (en)</option><option value="de">Deutsch (de)</option><option value="ar">العربية (ar)</option></select></label></div>
      <div className="space-y-3 rounded-xl border p-4"><div><h3 className="font-semibold">عضلات مرتبط</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">شناسه عضله‌ها باید از دیتابیس خودتان باشد؛ برای هر شناسه یک خط بنویسید. پیش‌فرض نقش عضله، اصلی است.</p></div><textarea rows={3} className={fieldClass} placeholder={'GUID عضله، هر خط یک مورد\nمثال: 00000000-0000-0000-0000-000000000000'} value={form.muscles.map(x => `${x.muscleId}${x.role === 2 ? '|2' : '|1'}`).join('\n')} onChange={e => setForm(prev => ({ ...prev, muscles: e.target.value.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const [muscleId,role] = line.split('|'); return { muscleId: muscleId.trim(), role: (role?.trim() === '2' ? 2 : 1) as ExerciseMuscleRole } }).filter(x => x.muscleId) }))} /><p className="text-xs text-muted-foreground">قالب اختیاری نقش: GUID|1 برای اصلی و GUID|2 برای کمکی.</p></div>
      <div className="space-y-3 rounded-xl border p-4"><div><h3 className="font-semibold">دستورالعمل اجرا</h3><p className="mt-1 text-xs text-muted-foreground">هر خط یک مرحله؛ ترتیب خطوط حفظ می‌شود.</p></div><textarea rows={4} className={fieldClass} placeholder="۱. وضعیت شروع...\n۲. حرکت را کنترل‌شده اجرا کنید..." value={form.instructions.join('\n')} onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))} /></div>
      <div className="space-y-3 rounded-xl border p-4"><div><h3 className="font-semibold">رسانه‌های آپلودشده</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">ابتدا از ماژول Media فایل را آپلود کنید، سپس Asset ID و مقدار عددی enum مربوط به ExerciseMediaRole را وارد کنید. API آپلود در پیام شما ارائه نشده است، بنابراین این فرم فایل ساختگی آپلود نمی‌کند.</p></div><textarea rows={2} className={fieldClass} placeholder={'Asset GUID|RoleNumber|primary\nمثال: GUID|مقدار enum|primary'} value={form.media.map(x => `${x.assetId}|${x.role}${x.isPrimary ? '|primary' : ''}`).join('\n')} onChange={e => setForm(prev => ({ ...prev, media: e.target.value.split('\n').map((line,index) => line.trim()).filter(Boolean).map((line,index) => { const [assetId, roleText, primaryText] = line.split('|'); return { assetId: assetId.trim(), role: Number(roleText), order: index, isPrimary: primaryText?.trim() === 'primary' } }).filter(x => x.assetId && Number.isFinite(x.role)) }))} /></div>
      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className={`${buttonClass} border bg-background`}>انصراف</button><button type="submit" disabled={saving} className={`${buttonClass} bg-primary text-primary-foreground`}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{editingId ? 'ذخیره تغییرات' : 'ثبت حرکت'}</button></div></form></section></div>}

    {(selected || detailLoading) && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !detailLoading) setSelected(null) }}><section role="dialog" aria-modal="true" aria-labelledby="exercise-detail-title" className="max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card shadow-2xl">{detailLoading ? <div className="flex h-56 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" /></div> : selected && <><div className="flex items-center justify-between border-b p-4"><h2 id="exercise-detail-title" className="font-bold">جزئیات حرکت</h2><button onClick={() => setSelected(null)} aria-label="بستن" className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button></div><div className="space-y-5 p-4 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row"><div className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl bg-muted/50 sm:w-48">{exerciseCoverUrl(selected.media.find(x => x.isPrimary) ?? selected.media[0]) ? <img className="max-h-full max-w-full object-contain" alt={selected.name} src={exerciseCoverUrl(selected.media.find(x => x.isPrimary) ?? selected.media[0])} /> : <Dumbbell className="size-10 text-muted-foreground" />}</div><div><h3 className="text-lg font-bold">{selected.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.description || 'توضیحی ثبت نشده است.'}</p><div className="mt-3 flex flex-wrap gap-2">{[selected.category,selected.bodyPart,selected.equipment,selected.target,selected.level].filter(Boolean).map(x => <span key={x} className="rounded-lg border px-2 py-1 text-xs">{x}</span>)}</div></div></div>{selected.muscles.length > 0 && <div><h4 className="font-semibold">عضلات</h4><div className="mt-2 flex flex-wrap gap-2">{selected.muscles.map(m => <span key={`${m.muscleId}-${m.role}`} className="rounded-lg bg-secondary px-3 py-1.5 text-sm">{m.name} · {m.role === 1 ? 'اصلی' : 'کمکی'}</span>)}</div></div>}<div><h4 className="font-semibold">دستورالعمل اجرا</h4>{selected.instructions.length ? <ol className="mt-2 list-decimal space-y-2 pr-5 text-sm leading-6 text-muted-foreground">{[...selected.instructions].sort((a,b) => a.stepNumber-b.stepNumber).map(step => <li key={step.stepNumber}>{step.text}</li>)}</ol> : <p className="mt-2 text-sm text-muted-foreground">دستورالعملی ثبت نشده است.</p>}</div><div className="flex justify-end border-t pt-4"><button onClick={() => { setSelected(null); void openEdit(selected.id) }} className={`${buttonClass} bg-primary text-primary-foreground`}><Pencil className="size-4" /> ویرایش حرکت</button></div></div></>}</section></div>}
  </div>
}
