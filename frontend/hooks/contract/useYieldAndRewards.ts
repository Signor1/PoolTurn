import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { YieldManagerABI } from '@/abi/YieldManager';
import { POOLTURN_CONTRACT_ADDRESS, YIELDMANAGER_CONTRACT_ADDRESS } from '@/lib/config';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
    type BaseError,
} from "wagmi";

/**
 * Hook for harvesting yield for a circle
 */
export const useHarvestYield = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const harvestYield = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'harvestYield',
                args: [circleId],
            });
        } catch (error: any) {
            toast.error(error.message, { position: "top-right" });
        }
    }, [writeContract]);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash && isConfirming) {
            toast.loading("Harvesting yield...", {
                id: "harvest-yield",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Yield harvested successfully!", {
                id: "harvest-yield",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "harvest-yield",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { harvestYield, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Hook for claiming accumulated yield
 */
export const useClaimYield = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const claimYield = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'claimYield',
                args: [circleId],
            });
        } catch (error: any) {
            toast.error(error.message, { position: "top-right" });
        }
    }, [writeContract]);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash && isConfirming) {
            toast.loading("Claiming yield...", {
                id: "claim-yield",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Yield claimed successfully!", {
                id: "claim-yield",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "claim-yield",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { claimYield, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Hook for claiming creator reward
 */
export const useClaimCreatorReward = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const claimCreatorReward = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'claimCreatorReward',
                args: [circleId],
            });
        } catch (error: any) {
            toast.error(error.message, { position: "top-right" });
        }
    }, [writeContract]);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash && isConfirming) {
            toast.loading("Claiming creator reward...", {
                id: "claim-reward",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Creator reward claimed successfully!", {
                id: "claim-reward",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "claim-reward",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { claimCreatorReward, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Hook to get member's yield share
 */
export const useMemberYieldShare = (circleId: bigint | undefined, memberAddress: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getMemberYieldShare',
        args: circleId !== undefined && memberAddress ? [circleId, memberAddress] : undefined,
        query: {
            enabled: circleId !== undefined && memberAddress !== undefined,
        },
    });

    return {
        yieldShare: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to get creator reward pool balance
 */
export const useCreatorRewardPool = (circleId: bigint | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getCreatorRewardPool',
        args: circleId !== undefined ? [circleId] : undefined,
        query: {
            enabled: circleId !== undefined,
        },
    });

    return {
        rewardPool: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to check if member has claimed creator reward
 */
export const useHasClaimedReward = (circleId: bigint | undefined, memberAddress: `0x${string}` | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'hasClaimedCreatorReward',
        args: circleId !== undefined && memberAddress ? [circleId, memberAddress] : undefined,
        query: {
            enabled: circleId !== undefined && memberAddress !== undefined,
        },
    });

    return {
        hasClaimed: data as boolean | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to get pending yield for a circle
 */
export const useCirclePendingYield = (circleId: bigint | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getCirclePendingYield',
        args: circleId !== undefined ? [circleId] : undefined,
        query: {
            enabled: circleId !== undefined,
        },
    });

    return {
        pendingYield: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to get eligible reward members count
 */
export const useEligibleRewardMembers = (circleId: bigint | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getEligibleRewardMembers',
        args: circleId !== undefined ? [circleId] : undefined,
        query: {
            enabled: circleId !== undefined,
        },
    });

    return {
        eligibleCount: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to check if yield is enabled for a circle
 */
export const useIsYieldEnabled = (circleId: bigint | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'isYieldEnabled',
        args: circleId !== undefined ? [circleId] : undefined,
        query: {
            enabled: circleId !== undefined,
        },
    });

    return {
        isEnabled: data as boolean | undefined,
        isLoading,
        error,
        refetch,
    };
};

/**
 * Hook to get total value (principal + yield) for a circle
 */
export const useCircleTotalYieldValue = (circleId: bigint | undefined) => {
    const { data, isLoading, error, refetch } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getCircleTotalYieldValue',
        args: circleId !== undefined ? [circleId] : undefined,
        query: {
            enabled: circleId !== undefined,
        },
    });

    return {
        totalValue: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
};
