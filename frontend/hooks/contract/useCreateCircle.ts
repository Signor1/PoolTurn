import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS } from '@/lib/config';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    type BaseError,
} from "wagmi";

/**
 * Hook for creating new circles
 * Handles the complete circle creation flow with transaction status feedback
 */
export const useCreateCircle = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const createCircle = useCallback(async (params: {
        name: string;
        description: string;
        token: `0x${string}`;
        contributionAmount: bigint;
        periodDuration: bigint;
        maxMembers: bigint;
        collateralFactor: bigint;
        insuranceFee: bigint;
        initialPayoutOrder: `0x${string}`[];
        enableYield?: boolean;
        creatorRewardAmount?: bigint;
    }) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'createCircle',
                args: [
                    params.name,
                    params.description,
                    params.token,
                    params.contributionAmount,
                    params.periodDuration,
                    params.maxMembers,
                    params.collateralFactor,
                    params.insuranceFee,
                    params.initialPayoutOrder,
                    params.enableYield ?? false,
                    params.creatorRewardAmount ?? BigInt(0),
                ],
            });
        } catch (error: any) {
            toast.error(error.message, { position: "top-right" });
        }
    }, [writeContract]);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (hash && isConfirming) {
            toast.loading("Creating circle...", {
                id: "create-circle",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Circle created successfully!", {
                id: "create-circle",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "create-circle",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { createCircle, isPending, isConfirming, isConfirmed, hash };
};
