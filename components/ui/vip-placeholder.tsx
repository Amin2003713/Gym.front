import { Crown } from 'lucide-react'
import React from 'react'

const VipPlaceholder = () => {
  return (
    <>
      <div className="animate-pulse rounded-full bg-yellow-400/40 p-4 dark:bg-yellow-400/10">
        <Crown className="size-8 text-yellow-600 md:size-10 dark:text-yellow-500" />
      </div>

      <h3 className="text-center text-base font-semibold text-yellow-600 sm:text-lg dark:text-yellow-500">
        این قابلیت در پلن فعلی شما در درسترس نیست !
      </h3>

      <p className="max-w-xs text-center text-sm leading-relaxed text-yellow-600 sm:max-w-md dark:text-yellow-500">
        برای بهره مند شدن از این قابلیت پلن حرفه ای را خریداری نمایید.
      </p>
    </>
  )
}

export default VipPlaceholder
