export type ExerciseMuscleRole = 1 | 2
export type ExerciseMediaRole = number

export interface ExerciseMediaVariant {
  id: string
  variantName: string
  width?: number | null
  height?: number | null
  url?: string | null
  kind: number
  sizeBytes?: number | null
  contentType: string
}

export interface ExerciseAsset {
  id: string
  originalFileName: string
  contentType: string
  extension: string
  sizeBytes: number
  sha256?: string | null
  width?: number | null
  height?: number | null
  status: number
  visibility: number
  createdAt: string
  primary: boolean
  order: number
  variants: ExerciseMediaVariant[]
}

export interface ExerciseMedia {
  role: ExerciseMediaRole
  order: number
  isPrimary: boolean
  asset: ExerciseAsset
}

export interface ExerciseDetail {
  id: string
  sourceId: string
  sourceLanguageCode: string
  languageCode: string
  name: string
  description?: string | null
  category?: string | null
  bodyPart?: string | null
  equipment?: string | null
  target?: string | null
  level?: string | null
  mechanic?: string | null
  force?: string | null
  exerciseType?: string | null
  attribution?: string | null
  license?: string | null
  muscles: Array<{ muscleId: string; code: string; name: string; role: ExerciseMuscleRole }>
  instructions: Array<{ stepNumber: number; text: string }>
  media: ExerciseMedia[]
  /** True when the signed-in tenant authored the row (may edit / publish / delete it). */
  isOwned?: boolean
  /** Author asked for the exercise to appear in the shared library. */
  isPublished?: boolean
  /** Platform review done; published + verified rows are visible to every tenant. */
  isVerified?: boolean
  createdAtUtc: string
  updatedAtUtc: string
}

export interface ExerciseListItem {
  id: string
  name: string
  description?: string | null
  category?: string | null
  bodyPart?: string | null
  equipment?: string | null
  target?: string | null
  level?: string | null
  mechanic?: string | null
  force?: string | null
  exerciseType?: string | null
  /** Canonical tool group computed by the API (machine, cable, ...); null when unfilled. */
  equipmentGroup?: string | null
  cover?: ExerciseMedia | null
}

export interface ExerciseEquipmentOption {
  code: string
  label: string
  count: number
}

export interface ExerciseEquipmentOptions {
  equipment: ExerciseEquipmentOption[]
  /** Muscle-group (body part) values from the same data, ordered by how many use them. */
  bodyParts: ExerciseEquipmentOption[]
  /** Difficulty values, beginner → expert. */
  levels: ExerciseEquipmentOption[]
  /** Exercises with no equipment value at all, so they can be found and fixed. */
  missing: number
}

export interface ExerciseInput {
  name: string
  description?: string | null
  languageCode?: string | null
  category?: string | null
  bodyPart?: string | null
  equipment?: string | null
  target?: string | null
  level?: string | null
  mechanic?: string | null
  force?: string | null
  exerciseType?: string | null
  muscles: Array<{ muscleId: string; role: ExerciseMuscleRole }>
  instructions: string[]
  media: Array<{ assetId: string; role: number; order: number; isPrimary: boolean }>
  /** Only for create; existing rows toggle this through exerciseApi.publish. */
  publishToLibrary?: boolean
}

export type ListExercisesFilter = {
  pageNumber: number
  pageSize: number
  search?: string
  category?: string
  bodyPart?: string
  equipment?: string
  /** Comma-separated canonical tool groups; multi-select chips send their codes here. */
  equipments?: string
  target?: string
  level?: string
  mechanic?: string
  force?: string
  exerciseType?: string
  /** Single muscle id; kept for callers that select one muscle. */
  muscleId?: string
  /** Comma-separated muscle ids - the API filters through ExerciseMuscle in the database. */
  muscleIds?: string
  languageCode?: string
}

export interface ExercisePage<T> {
  results: T[]
  currentPage: number
  pageCount: number
  pageSize: number
  rowCount: number
}
