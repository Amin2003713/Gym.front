import * as z from 'zod'

import { signinSchema } from './signin-schema'

export type SigninUserModel = z.infer<typeof signinSchema>
