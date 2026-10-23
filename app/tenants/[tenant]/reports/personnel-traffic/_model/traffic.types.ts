import { z } from 'zod'

import { addTrafficSchema, updateTrafficSchema } from './traffic-schema'

export type AddTrafficModel = z.infer<typeof addTrafficSchema>
export type UpdateTrafficModel = z.infer<typeof updateTrafficSchema>
