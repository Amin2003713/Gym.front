import { ShieldCheck, Users, TrendingUp } from 'lucide-react'
import { HamOwjBrand, HamOwjMark } from '@/components/branding/hamowj-mark'

import { ModeToggle } from '@/components/mode-toggle'
import { Card, CardContent } from '@/components/ui/card'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main dir="rtl" className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground transition-colors sm:px-6 lg:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,154,60,0.16),transparent_38%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.025)_45%,rgba(255,255,255,0.025)_46%,transparent_46%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#f6f3ed] via-[#fb9a3c] to-[#a96d20]" />
      <div className="relative z-10 w-full max-w-6xl">
        <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/20">
          <CardContent className="grid p-0 md:grid-cols-[1fr_0.9fr]">
            <section className="min-w-0 bg-background text-foreground transition-colors">{children}</section>
            <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden p-10 md:flex lg:p-14">
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(150deg,rgba(251,154,60,0.15),transparent_45%),repeating-linear-gradient(135deg,transparent,transparent_22px,rgba(255,255,255,0.018)_23px,rgba(255,255,255,0.018)_24px)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#fb9a3c]/30 bg-[#fb9a3c]/10 px-3 py-1.5 text-xs font-bold text-[#fb9a3c]"><ShieldCheck className="size-4" /> مدیریت حرفه‌ای باشگاه</span>
                <h1 className="mt-8 text-4xl font-black leading-[1.35] tracking-tight lg:text-5xl">هم‌مسیرِ پیشرفت.<br /><span className="text-[#fb9a3c]">قوی‌تر، منسجم‌تر، رو به اوج.</span></h1>
                <p className="mt-5 max-w-sm text-sm leading-8 text-[#d6d0c7]">از مدیریت گروه و شعبه‌ها تا همراهی مربی‌ها و اعضا؛ همه در یک تجربه یکپارچه و قابل اعتماد.</p>
              </div>
              <div className="relative grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><TrendingUp className="mb-3 size-5 text-[#fb9a3c]" /><p className="font-bold">تمرکز روی پیشرفت</p><p className="mt-1 text-xs leading-6 text-[#a9b1af]">برنامه و رکورد در یک مسیر</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><Users className="mb-3 size-5 text-[#fb9a3c]" /><p className="font-bold">کنترل یکپارچه</p><p className="mt-1 text-xs leading-6 text-[#a9b1af]">از یک شعبه تا یک گروه</p></div>
                <p className="col-span-2 mt-2 text-xs text-[#788584]">هم‌اوج — هم‌مسیرِ پیشرفت.</p>
              </div>
              <HamOwjMark title="" aria-hidden className="absolute bottom-8 left-8 h-28 w-36 opacity-[0.045]" />
            </aside>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">با ورود یا ثبت‌نام، قوانین و مقررات سامانه مدیریت گروه‌های ورزشی را می‌پذیرید.</p>
      </div>
    </main>
  )
}
