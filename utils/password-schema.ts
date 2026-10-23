import * as z from 'zod'

export const passwordSchema = z
  .string()
  .min(9, { error: 'رمز عبور حداقل باید 9 کاراکتر باشد.' })
// export const passwordSchema = z
//   .string({ message: 'این فیلد اجباری است !' })
//   .min(8, { message: 'رمزعبور باید حداقل ۸ کاراکتر باشد.' })
//   .refine((val) => /[0-9]/.test(val), {
//     message: 'رمزعبور باید حداقل یک عدد داشته باشد.',
//   })
//   .refine((val) => /[a-z]/.test(val), {
//     message: 'رمزعبور باید حداقل یک حرف کوچک داشته باشد.',
//   })
//   .refine((val) => /[A-Z]/.test(val), {
//     message: 'رمزعبور باید حداقل یک حرف بزرگ داشته باشد.',
//   })
//   .refine((val) => /[\W_]/.test(val), {
//     message:
//       'رمزعبور باید حداقل یک کاراکتر خاص (مثل @, #, $, % و ...) داشته باشد.',
//   })
