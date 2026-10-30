import Link from 'next/link'
import { LifeBuoy, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
export default function ContactPage() { return <div className="mx-auto max-w-3xl space-y-5" dir="rtl"><div><h1 className="text-2xl font-bold">ارتباط با ما</h1><p className="mt-1 text-sm text-muted-foreground">برای پیگیری سریع‌تر، درخواست خود را در مرکز پشتیبانی ثبت کنید.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5"/>پشتیبانی هم‌اوج</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-7 text-muted-foreground">موضوع، توضیحات و پاسخ‌های تیم پشتیبانی در یک گفتگو ثبت می‌شود و هر زمان می‌توانید وضعیت آن را پیگیری کنید.</p><Button asChild><Link href="/support"><MessageCircle className="ms-2 size-4"/>ثبت یا پیگیری درخواست</Link></Button></CardContent></Card></div> }
