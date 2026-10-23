import { z } from 'zod'

import { addStationSchema, updateStationSchema } from './station.schema'

export type AddStationModel = z.infer<typeof addStationSchema>
export type UpdateStationModel = z.infer<typeof updateStationSchema>
