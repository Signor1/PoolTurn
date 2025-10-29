/**
 * @deprecated This file is kept for backward compatibility.
 * Import hooks from '@/hooks/contract' instead.
 *
 * Example:
 * import { useCreateCircle, useJoinCircleFlow } from '@/hooks/contract';
 */

// Re-export all hooks from the new modular structure for backward compatibility
export {
    useCreateCircle,
    useCircleData,
    useMemberData,
    usePendingPayout,
    useContribute,
    useContributeFlow,
    useFinalizeRound,
    useJoinCircle,
    useJoinCircleFlow,
    useClaimPayout,
    useWithdrawCollateral,
} from './contract';
