import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

/** this way can change react-query default errors type to Problem in global **/
// declare module '@tanstack/react-query' {
//   interface Register {
//     defaultError: Problem
//   }
// }

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      /** show error notifications **/
    },
  }),

  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      /** show error notifications **/
    },
  }),

  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      throwOnError: false,
      retry: false,
    },
  },
})
