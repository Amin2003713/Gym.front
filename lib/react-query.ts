import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

/** this way can change react-query default errors type to Problem in global **/
// declare module '@tanstack/react-query' {
//   interface Register {
//     defaultError: Problem
//   }
// }

/**
 * Shared defaults. A request that landed less than a minute ago is reused as-is, so moving between
 * Home → Plan → Home does not hammer the API (the old config had no `staleTime`, which means every
 * mount refetched). `dedupe` is on by default in React Query, so two components asking for the same
 * key in the same tick produce one network call.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => {
      /** show error notifications **/
    },
  }),

  mutationCache: new MutationCache({
    onError: () => {
      /** show error notifications **/
    },
  }),

  defaultOptions: {
    queries: {
      // Five minutes of freshness: moving between screens on a weak link should reuse data
      // instead of firing a request per mount.
      staleTime: 5 * 60 * 1000,
      // Keep screens instant when navigating back within the session.
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      // A reconnect is a real state change (e.g. phone regained signal) — refresh then.
      refetchOnReconnect: true,
      throwOnError: false,
      // Two retries with a short backoff; more on a flaky mobile link just multiplies load.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000),
      // Avoids re-rendering lists when the payload is structurally identical.
      structuralSharing: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
