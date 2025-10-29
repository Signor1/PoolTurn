/**
 * Caching configuration for React Query
 * Optimizes data fetching and reduces RPC calls
 */

export const cacheConfig = {
  // Cache times in milliseconds
  staleTime: {
    circles: 30 * 1000, // 30 seconds - circles don't change often
    circleDetails: 10 * 1000, // 10 seconds - more dynamic data
    memberData: 10 * 1000, // 10 seconds
    balances: 5 * 1000, // 5 seconds - more frequent updates
    pendingPayouts: 5 * 1000, // 5 seconds
  },

  cacheTime: {
    default: 5 * 60 * 1000, // 5 minutes - keep in cache even if unused
    long: 30 * 60 * 1000, // 30 minutes for stable data
  },

  refetch: {
    onWindowFocus: false, // Disable for blockchain data (doesn't change on focus)
    onReconnect: true, // Refetch when wallet reconnects
    onMount: true, // Fetch on component mount
  },

  retry: {
    attempts: 3, // Retry failed requests 3 times
    delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  },
};

/**
 * Query keys for React Query
 * Organized for easy cache invalidation
 */
export const queryKeys = {
  // Circle queries
  circles: {
    all: ['circles'] as const,
    lists: () => [...queryKeys.circles.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.circles.lists(), filters] as const,
    details: () => [...queryKeys.circles.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.circles.details(), id] as const,
  },

  // Member queries
  members: {
    all: ['members'] as const,
    circle: (circleId: number) => [...queryKeys.members.all, circleId] as const,
    member: (circleId: number, address: string) =>
      [...queryKeys.members.circle(circleId), address] as const,
  },

  // User queries
  user: {
    all: ['user'] as const,
    circles: (address: string) => [...queryKeys.user.all, address, 'circles'] as const,
    balance: (address: string, token: string) =>
      [...queryKeys.user.all, address, 'balance', token] as const,
    allowance: (address: string, token: string, spender: string) =>
      [...queryKeys.user.all, address, 'allowance', token, spender] as const,
  },

  // Payout queries
  payouts: {
    all: ['payouts'] as const,
    pending: (circleId: number, address: string) =>
      [...queryKeys.payouts.all, 'pending', circleId, address] as const,
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate after user actions
  afterJoin: (queryClient: any, circleId: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.members.circle(circleId) });
  },

  afterContribute: (queryClient: any, circleId: number, userAddress: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.circles.detail(circleId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.members.member(circleId, userAddress) });
  },

  afterClaim: (queryClient: any, circleId: number, userAddress: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payouts.pending(circleId, userAddress) });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.balance(userAddress, 'USDC') });
  },

  afterCircleCreate: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.circles.lists() });
  },
};

/**
 * Prefetch configuration
 */
export const prefetchConfig = {
  // Prefetch circle details on hover
  circleDetails: {
    enabled: true,
    delay: 300, // ms to wait before prefetching
  },

  // Prefetch next page of circles
  pagination: {
    enabled: true,
    pages: 1, // Number of pages ahead to prefetch
  },
};

/**
 * Optimistic update helpers
 */
export function optimisticUpdate<T>(
  queryClient: any,
  queryKey: any[],
  updater: (old: T | undefined) => T
) {
  // Cancel any outgoing refetches
  queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistically update to the new value
  queryClient.setQueryData<T>(queryKey, updater);

  // Return a context object with the snapshotted value
  return { previousData };
}

/**
 * Batch update helper
 */
export function batchInvalidate(queryClient: any, queryKeys: any[][]) {
  queryClient.invalidateQueries({
    predicate: (query: any) =>
      queryKeys.some((key) =>
        key.every((part, index) => query.queryKey[index] === part)
      ),
  });
}
