import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from '@/components/icons'

const icons = {
  members: Users,
  plans: ClipboardList,
  checklist: CheckCircle2,
  payments: CreditCard,
  message: MessageCircle,
  reports: BarChart3,
  security: ShieldCheck,
  clock: Clock,
  goal: Trophy,
  sparkles: Sparkles,
} as const

export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkles

  return <Icon className={className} aria-hidden="true" />
}
