import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { SignupSchema, ThirdFormSchema } from './signup-schema'

export type SignupValues = z.infer<typeof SignupSchema>
export type VerificationValues = z.infer<typeof ThirdFormSchema>

export interface StepFormProps {
  form: ReturnType<typeof useForm<SignupValues>>
}
