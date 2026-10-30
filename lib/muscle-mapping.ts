import { MUSCLES } from '@/lib/muscles'

const ALIASES: Record<string, string> = {
  trapezius: 'trapezius', traps: 'trapezius', deltoid: 'deltoids', deltoids: 'deltoids', shoulders: 'deltoids',
  chest: 'chest', pectoral: 'chest', pectorals: 'chest', pecs: 'chest',
  'upper back': 'upper-back', 'upper-back': 'upper-back', back: 'upper-back', latissimus: 'upper-back', lats: 'upper-back',
  serratus: 'serratus', biceps: 'biceps', triceps: 'triceps', forearm: 'forearm', forearms: 'forearm',
  abs: 'abs', abdominal: 'abs', abdominals: 'abs', core: 'abs', oblique: 'obliques', obliques: 'obliques',
  'lower back': 'lower-back', 'lower-back': 'lower-back', erector: 'lower-back', glute: 'gluteal', glutes: 'gluteal',
  quadriceps: 'quadriceps', quads: 'quadriceps', hamstring: 'hamstring', hamstrings: 'hamstring',
  adductor: 'adductors', adductors: 'adductors', 'hip flexor': 'hip-flexors', 'hip-flexors': 'hip-flexors',
  calves: 'calves', calf: 'calves', gastrocnemius: 'calves', tibialis: 'tibialis',
}

export function muscleSlugs(...values: Array<string | null | undefined>): string[] {
  const result = new Set<string>()
  for (const value of values) {
    if (!value) continue
    const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
    for (const [alias, slug] of Object.entries(ALIASES)) {
      if (normalized === alias || normalized.includes(alias)) result.add(slug)
    }
  }
  return [...result].filter(slug => MUSCLES.includes(slug as (typeof MUSCLES)[number]))
}

export function muscleSlug(value?: string | null): string | null {
  return muscleSlugs(value)[0] ?? null
}

export function muscleLoad(items: Array<{ bodyPart?: string | null; target?: string | null }>) {
  const load: Record<string, number> = {}
  for (const item of items) {
    for (const slug of muscleSlugs(item.target, item.bodyPart)) load[slug] = (load[slug] ?? 0) + 1
  }
  return load
}
