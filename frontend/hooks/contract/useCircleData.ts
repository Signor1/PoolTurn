import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS } from '@/lib/config';
import { useEffect } from 'react';
import { useReadContract, useBlockNumber } from "wagmi";
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for reading comprehensive circle data
 * Fetches circle info, members, payout order, and insurance pool
 * Auto-refreshes on new blocks
 */
export const useCircleData = (circleId: bigint) => {
    const queryClient = useQueryClient();
    const { data: blockNumber } = useBlockNumber({ watch: true });

    const { data: circleInfo, isLoading: isLoadingInfo, error: infoError, queryKey: infoQueryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getCircleInfo',
        args: [circleId],
        query: {
            refetchInterval: 5000,
        }
    });

    const { data: members, isLoading: isLoadingMembers, error: membersError, queryKey: membersQueryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getMembers',
        args: [circleId],
        query: {
            refetchInterval: 5000,
        }
    });

    const { data: payoutOrder, isLoading: isLoadingOrder, error: orderError, queryKey: orderQueryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getPayoutOrder',
        args: [circleId],
        query: {
            refetchInterval: 5000,
        }
    });

    const { data: insurancePool, isLoading: isLoadingInsurance, error: insuranceError, queryKey: insuranceQueryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getInsurancePool',
        args: [circleId],
        query: {
            refetchInterval: 5000,
        }
    });

    // Watch for new blocks and invalidate all queries
    useEffect(() => {
        if (blockNumber) {
            queryClient.invalidateQueries({ queryKey: infoQueryKey });
            queryClient.invalidateQueries({ queryKey: membersQueryKey });
            queryClient.invalidateQueries({ queryKey: orderQueryKey });
            queryClient.invalidateQueries({ queryKey: insuranceQueryKey });
        }
    }, [blockNumber, queryClient, infoQueryKey, membersQueryKey, orderQueryKey, insuranceQueryKey]);

    return {
        circleInfo,
        members,
        payoutOrder,
        insurancePool,
        isLoading: isLoadingInfo || isLoadingMembers || isLoadingOrder || isLoadingInsurance,
        error: infoError || membersError || orderError || insuranceError,
    };
};

/**
 * Hook for reading member-specific data
 * Fetches member info for a specific address in a circle
 */
export const useMemberData = (circleId: bigint, memberAddress: `0x${string}`) => {
    const queryClient = useQueryClient();
    const { data: blockNumber } = useBlockNumber({ watch: true });

    const { data: memberInfo, isLoading, error, queryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getMemberInfo',
        args: [circleId, memberAddress],
        query: {
            refetchInterval: 5000,
        }
    });

    // Watch for new blocks and invalidate queries
    useEffect(() => {
        if (blockNumber) {
            queryClient.invalidateQueries({ queryKey });
        }
    }, [blockNumber, queryClient, queryKey]);

    return {
        memberInfo,
        isLoading,
        error,
    };
};

/**
 * Hook for reading user's pending payouts
 * Returns the amount available to claim for a specific user
 */
export const usePendingPayout = (circleId: bigint, userAddress: `0x${string}`) => {
    const queryClient = useQueryClient();
    const { data: blockNumber } = useBlockNumber({ watch: true });

    const { data: pendingAmount, isLoading, error, queryKey } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'pendingPayouts',
        args: [circleId, userAddress],
        query: {
            refetchInterval: 5000,
        }
    });

    // Watch for new blocks and invalidate queries
    useEffect(() => {
        if (blockNumber) {
            queryClient.invalidateQueries({ queryKey });
        }
    }, [blockNumber, queryClient, queryKey]);

    return {
        pendingAmount,
        isLoading,
        error,
    };
};
