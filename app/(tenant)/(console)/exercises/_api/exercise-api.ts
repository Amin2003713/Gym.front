import {
  createData,
  deleteData,
  readData,
  updateData,
} from '@/core/http-service'

import type {
  ExerciseDetail,
  ExerciseEquipmentOptions,
  ExerciseInput,
  ExerciseListItem,
  ExerciseMedia,
  ExercisePage,
  ListExercisesFilter,
} from '../_model/exercise.types'

const route = 'exercise'

/**
 * Content language for every exercise read in the app (Persian). The API serves the English
 * translation for any row where the Persian translation is missing, then the source language.
 */
export const EXERCISE_LANGUAGE = 'fa'

/** Resolved list cards are reused for a minute so switching screens does not re-download them. */
const BY_IDS_TTL_MS = 60_000
const byIdsCache = new Map<string, { at: number; item: ExerciseListItem }>()
const byIdsKey = (language: string, id: string) => `${language}:${id}`

const queryString = (values: Record<string, unknown>) => {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      query.set(key, String(value))
  })
  return query.toString()
}

export const exerciseApi = {
  list: (filter: ListExercisesFilter) =>
    readData<ExercisePage<ExerciseListItem>>(
      `${route}?${queryString({
        ...filter,
        languageCode: filter.languageCode ?? EXERCISE_LANGUAGE,
      })}`,
    ),
  /** Equipment chips with counts, grouped from the values the catalog actually stores. */
  equipmentOptions: () =>
    readData<ExerciseEquipmentOptions>(`${route}/equipment-options`),
  get: (id: string, languageCode = EXERCISE_LANGUAGE) =>
    readData<ExerciseDetail>(
      `${route}/${encodeURIComponent(id)}?${queryString({ languageCode })}`,
    ),
  byIds: async (ids: string[], languageCode = EXERCISE_LANGUAGE) => {
    const now = Date.now()
    const cached = ids.map((id) => byIdsCache.get(byIdsKey(languageCode, id)))
    if (
      cached.length > 0 &&
      cached.every((entry) => entry && now - entry.at < BY_IDS_TTL_MS)
    ) {
      return cached.map((entry) => entry!.item)
    }

    const items = await createData<string[], ExerciseListItem[]>(
      `${route}/by-ids?languageCode=${encodeURIComponent(languageCode)}`,
      ids,
    )
    for (const item of items ?? [])
      byIdsCache.set(byIdsKey(languageCode, item.id), { at: now, item })
    return items
  },
  create: (input: ExerciseInput) =>
    createData<ExerciseInput, ExerciseDetail>(route, input),
  update: (id: string, input: ExerciseInput) =>
    updateData<ExerciseInput & { id: string }, void>(route, { id, ...input }),
  delete: (id: string) => deleteData<{ id: string }>(route, undefined, { id }),
  /** Shares (or withdraws) the exercise in the library; a re-publish needs a new platform review. */
  publish: (id: string, published: boolean) =>
    createData<null, void>(
      `${route}/publish?id=${encodeURIComponent(id)}&published=${published}`,
      null,
    ),
}

/** URL of the small thumbnail variant — used for card covers to keep list responses light. */
export function exerciseThumbUrl(
  media?: ExerciseMedia | null,
): string | undefined {
  if (!media?.asset?.variants?.length) return undefined
  const variants = media.asset.variants
  const thumb = variants.find((x) => /thumb/i.test(x.variantName) && x.url)
  return (thumb?.url ?? exerciseCoverUrl(media)) || undefined
}

/** URL of the preview variant of an exercise media entry (larger box). */
export function exerciseCoverUrl(
  media?: ExerciseMedia | null,
): string | undefined {
  if (!media?.asset?.variants?.length) return undefined
  const variants = media.asset.variants
  return (
    variants.find((x) => /preview/i.test(x.variantName) && x.url)?.url ??
    variants.find((x) => x.url)?.url ??
    undefined
  )
}
