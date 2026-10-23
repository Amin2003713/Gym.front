import { z } from 'zod'

import { StationStatus, StationType } from '@/enums/station.enums'

const errorMessages = {
  name: 'نام ایستگاه الزامی می باشد.',
  code: 'کد ایستگاه الزامی می باشد.',
  latitude: 'عرض جغرافیایی الزامی می باشد.',
  longitude: 'طول جغرافیایی الزامی می باشد.',
  allowedDistance: 'فاصله مجاز تا ایستگاه الزامی می باشد.',
}
const baseSchema = z.object({
  name: z.string(errorMessages.name).min(1, { error: errorMessages.name }),
  code: z.string(errorMessages.code).min(1, { error: errorMessages.code }),
  location: z.object(
    {
      latitude: z.coerce
        .number(errorMessages.latitude)
        .min(1, { error: errorMessages.latitude }),
      longitude: z.coerce
        .number(errorMessages.longitude)
        .min(1, { error: errorMessages.longitude }),
      address: z.string().optional().nullable(),
    },
    { error: 'موقعیت جغرافیایی الزامی می باشد.' },
  ),
  allowedDistance: z.coerce
    .number(errorMessages.allowedDistance)
    .min(0, { error: 'حداقل فاصله مجاز صفر می باشد.' }),
  onWay: z.string().optional().nullable(),
  stationStatus: z.enum(StationStatus),
  stationType: z.enum(StationType),
})

export const addStationSchema = baseSchema
export const updateStationSchema = baseSchema.extend({
  id: z
    .string('شناسه ایستگاه نامعتبر است.')
    .min(1, { error: 'شناسه ایستگاه نامعتبر است.' }),
})
