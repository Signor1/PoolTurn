/**
 * Barrel file for all contract interaction hooks
 *
 * This module provides a clean, organized API for interacting with the PoolTurn smart contracts.
 * Hooks are grouped by functionality:
 *
 * - Circle Creation: useCreateCircle
 * - Data Reading: useCircleData, useMemberData, usePendingPayout
 * - Contributions: useContribute, useContributeFlow, useFinalizeRound
 * - Joining: useJoinCircle, useJoinCircleFlow
 * - Payouts: useClaimPayout, useWithdrawCollateral
 */

// Circle creation
export { useCreateCircle } from './useCreateCircle';

// Data reading hooks
export { useCircleData, useMemberData, usePendingPayout } from './useCircleData';

// Contribution hooks
export { useContribute, useContributeFlow, useFinalizeRound } from './useContribution';

// Join circle hooks
export { useJoinCircle, useJoinCircleFlow } from './useJoinCircle';

// Payout hooks
export { useClaimPayout, useWithdrawCollateral } from './usePayout';
