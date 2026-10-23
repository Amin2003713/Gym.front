import { createData, deleteData, readData, updateData } from '@/core/http-service'

export type ExerciseMuscleRole = 1 | 2
export type ExerciseMediaRole = number
export interface ExerciseMediaVariantDto { id: string; variantName: string; width?: number | null; height?: number | null; url?: string | null; kind: number; sizeBytes?: number | null; contentType: string }
export interface ExerciseAssetDto { id: string; originalFileName: string; contentType: string; extension: string; sizeBytes: number; sha256?: string | null; width?: number | null; height?: number | null; status: number; visibility: number; createdAt: string; primary: boolean; order: number; variants: ExerciseMediaVariantDto[] }
export interface ExerciseMediaDto { role: ExerciseMediaRole; order: number; isPrimary: boolean; asset: ExerciseAssetDto }
export interface ExerciseDto {
  id: string; sourceId: string; sourceLanguageCode: string; languageCode: string; name: string; description?: string | null
  category?: string | null; bodyPart?: string | null; equipment?: string | null; target?: string | null; level?: string | null
  mechanic?: string | null; force?: string | null; exerciseType?: string | null; attribution?: string | null; license?: string | null
  muscles: Array<{ muscleId: string; code: string; name: string; role: ExerciseMuscleRole }>
  instructions: Array<{ stepNumber: number; text: string }>; media: ExerciseMediaDto[]; createdAtUtc: string; updatedAtUtc: string
}
export interface ExerciseListItemDto {
  id: string; name: string; description?: string | null; category?: string | null; bodyPart?: string | null; equipment?: string | null
  target?: string | null; level?: string | null; mechanic?: string | null; force?: string | null; exerciseType?: string | null
  cover?: ExerciseMediaDto | null
}
export interface ExerciseInput {
  name: string; description?: string | null; languageCode?: string | null; category?: string | null; bodyPart?: string | null
  equipment?: string | null; target?: string | null; level?: string | null; mechanic?: string | null; force?: string | null
  exerciseType?: string | null; muscles: Array<{ muscleId: string; role: ExerciseMuscleRole }>; instructions: string[]
  media: Array<{ assetId: string; role: number; order: number; isPrimary: boolean }>
}
export interface ExercisePageDto<T> { results: T[]; currentPage: number; pageCount: number; pageSize: number; rowCount: number }
const route = 'exercise/exercise'
const queryString = (values: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
  return query.toString()
}
export const exerciseApi = {
  list: (filter: { pageNumber: number; pageSize: number; search?: string; category?: string; bodyPart?: string; equipment?: string; target?: string; level?: string; mechanic?: string; force?: string; exerciseType?: string; muscleId?: string; languageCode?: string }) =>
    readData<ExercisePageDto<ExerciseListItemDto>>(`${route}?${queryString(filter)}`),
  get: (id: string, languageCode?: string) => readData<ExerciseDto>(`${route}/${encodeURIComponent(id)}${languageCode ? `?${queryString({ languageCode })}` : ''}`),
  byIds: (ids: string[], languageCode?: string) => createData<{ ids: string[]; languageCode?: string }, ExerciseListItemDto[]>(`${route}/by-ids`, { ids, languageCode }),
  create: (input: ExerciseInput) => createData<ExerciseInput, ExerciseDto>(route, input),
  update: (id: string, input: ExerciseInput) => updateData<ExerciseInput & { id: string }, void>(route, { id, ...input }),
  delete: (id: string) => deleteData<{ id: string }>(route, undefined, { id }),
}
export function exerciseCoverUrl(media?: ExerciseMediaDto | null) {
  if (!media?.asset?.variants?.length) return undefined
  const variants = media.asset.variants
  return variants.find(x => /preview|thumbnail/i.test(x.variantName) && x.url)?.url ?? variants.find(x => x.url)?.url
}
