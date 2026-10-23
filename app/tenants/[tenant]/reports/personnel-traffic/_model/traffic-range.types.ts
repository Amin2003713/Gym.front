import { z } from 'zod'

import { trafficRangeSchema } from './traffic-range.schema'

export type TrafficRangeType = z.infer<typeof trafficRangeSchema>
