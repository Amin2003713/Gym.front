export const MUSCLES = [
    'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
    'biceps', 'triceps', 'forearm',
    'abs', 'obliques', 'lower-back',
    'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
    'calves', 'tibialis',
] as const

export type MuscleSlug = (typeof MUSCLES)[number]

/** Persian labels for the body-map picker (the map itself keeps the anatomical slugs). */
export const MUSCLE_FA: Record<string, string> = {
    trapezius: 'ذوزنقه‌ای',
    deltoids: 'سرشانه',
    chest: 'سینه',
    'upper-back': 'پشت بالایی',
    serratus: 'دندانه‌ای',
    biceps: 'دوسر بازو',
    triceps: 'سه‌سر بازو',
    forearm: 'ساعد',
    abs: 'شکم',
    obliques: 'پهلوها',
    'lower-back': 'کمر',
    gluteal: 'سرینی',
    quadriceps: 'چهارسر ران',
    hamstring: 'همسترینگ',
    adductors: 'نزدیک‌کننده ران',
    'hip-flexors': 'خم‌کننده ران',
    calves: 'ساق',
    tibialis: 'درشت‌نی',
}

/**
 * Alternative server muscle codes/names for each body-map slug. The catalog stores canonical
 * labels ("pectorals", "glutes", "latissimus dorsi"), while the map and plan validators use
 * slugs ("chest", "gluteal", "upper-back"). Matching is done on the normalized text.
 */
export const MUSCLE_MATCH_ALIASES: Record<string, string[]> = {
    trapezius: ['trapezius', 'traps', 'upper trapezius'],
    deltoids: ['deltoids', 'delts', 'shoulders'],
    chest: ['chest', 'pectorals', 'pecs', 'pectoralis major'],
    'upper-back': ['upper back', 'latissimus dorsi', 'lats', 'rhomboids', 'middle back'],
    serratus: ['serratus', 'serratus anterior'],
    biceps: ['biceps', 'biceps brachii'],
    triceps: ['triceps', 'triceps brachii'],
    forearm: ['forearm', 'forearms', 'brachioradialis'],
    abs: ['abs', 'abdominals', 'core', 'rectus abdominis'],
    obliques: ['obliques', 'oblique', 'external obliques'],
    'lower-back': ['lower back', 'erector spinae', 'lumbar', 'spine'],
    gluteal: ['gluteal', 'glutes', 'gluteus maximus'],
    quadriceps: ['quadriceps', 'quads'],
    hamstring: ['hamstring', 'hamstrings'],
    adductors: ['adductors', 'adductor', 'groin', 'inner thighs'],
    'hip-flexors': ['hip flexors', 'hip flexor', 'iliopsoas'],
    calves: ['calves', 'calf', 'gastrocnemius', 'soleus'],
    tibialis: ['tibialis', 'tibialis anterior', 'shins'],
}

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