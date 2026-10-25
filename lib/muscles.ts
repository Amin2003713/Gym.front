export const MUSCLES = [
    'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
    'biceps', 'triceps', 'forearm',
    'abs', 'obliques', 'lower-back',
    'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
    'calves', 'tibialis',
] as const

export type MuscleSlug = (typeof MUSCLES)[number]

// Drawn as the silhouette, never shaded.
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles'] as const

// Keys for t(); Persian labels live in lib/i18n.ts.
export const MUSCLE_NAME: Record<string, string> = {
    trapezius: 'Traps', deltoids: 'Shoulders', chest: 'Chest', 'upper-back': 'Upper back',
    serratus: 'Serratus', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms',
    abs: 'Abs', obliques: 'Obliques', 'lower-back': 'Lower back', gluteal: 'Glutes',
    quadriceps: 'Quads', hamstring: 'Hamstrings', adductors: 'Adductors',
    'hip-flexors': 'Hip flexors', calves: 'Calves', tibialis: 'Shins',
}

export type Threshold = { at: number; level: number; exclusive?: boolean }

/**
 * Shade buckets 0–4 per muscle.
 * No thresholds: relative to the hardest-worked muscle. With thresholds: absolute bands,
 * last matching rule wins; `exclusive` means strictly greater than `at`.
 */
export function levelsOf(load: Record<string, number>, thresholds?: Threshold[]): Record<string, number> {
    const lv: Record<string, number> = {}
    if (thresholds) {
        for (const m of MUSCLES) {
            const value = Number(load[m] || 0)
            let level = 0
            for (const rule of thresholds) {
                if (rule.exclusive ? value > rule.at : value >= rule.at) level = Math.max(0, Math.min(4, rule.level))
            }
            lv[m] = level
        }
        return lv
    }
    const max = Math.max(0, ...MUSCLES.map(m => load[m] || 0))
    for (const m of MUSCLES) {
        const v = load[m] || 0
        lv[m] = !v || max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / max) * 4)))
    }
    return lv
}

/** Muscles sorted hardest-worked first; untrained ones last, in body order. */
export function rankOf(load: Record<string, number>) {
    const worked = MUSCLES.filter(m => (load[m] || 0) > 0)
        .sort((a, b) => load[b] - load[a] || MUSCLES.indexOf(a) - MUSCLES.indexOf(b))
    const missed = MUSCLES.filter(m => !(load[m] > 0))
    return {worked, missed}
}