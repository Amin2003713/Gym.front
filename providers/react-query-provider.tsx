'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

import { queryClient } from '@/lib/react-query'

/** Dev-only and code-split: `process.env.NODE_ENV` is inlined, so production drops it entirely. */
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() =>
        import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
      )
    : () => null

export const ReactQueryProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
