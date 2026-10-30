import { createData, readData } from '@/core/http-service'

const route = 'exercise/muscle'

export interface MuscleOption {
  id: string
  code: string
  name: string
  anatomicalName: string
}

/** Persian is the only authoring language for now. */
const LANGUAGE = 'fa'

export const muscleApi = {
  list: (search?: string) => {
    const query = new URLSearchParams({ languageCode: LANGUAGE })

    if (search && search.trim()) query.set('search', search.trim())

    return readData<MuscleOption[]>(`${route}?${query.toString()}`)
  },
  create: (name: string) =>
    createData<{ name: string; languageCode: string }, MuscleOption>(route, {
      name,
      languageCode: LANGUAGE,
    }),
}
