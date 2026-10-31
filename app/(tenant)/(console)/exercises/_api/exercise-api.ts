import {
  createData,
  deleteData,
  readData,
  updateData,
} from '@/core/http-service'

import type {
  ExerciseDetail,
  ExerciseInput,
  ExerciseListItem,
  ExerciseMedia,
  ExercisePage,
  ListExercisesFilter,
} from '../_model/exercise.types'

const route = 'exercise/exercise'

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
    readData<ExercisePage<ExerciseListItem>>(`${route}?${queryString(filter)}`),
  get: (id: string, languageCode?: string) =>
    readData<ExerciseDetail>(
      `${route}/${encodeURIComponent(id)}${languageCode ? `?${queryString({ languageCode })}` : ''}`,
    ),
  byIds: async (ids: string[], languageCode?: string) => {
    const query = languageCode
      ? `?languageCode=${encodeURIComponent(languageCode)}`
      : ''
    const url = `${route}/by-ids${query}`
    try {
      return await createData<string[], ExerciseListItem[]>(url, ids)
    } catch (error) {
      throw error
    }
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
