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
 * Hook for claiming payouts
 * Allows winners to claim their round payout
 */
export const useClaimPayout = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const claimPayout = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'claimPayout',
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
            toast.loading("Claiming payout...", {
                id: "claim-payout",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Payout claimed successfully!", {
                id: "claim-payout",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "claim-payout",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { claimPayout, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Hook for withdrawing collateral
 * Allows members to withdraw their collateral after circle completion
 */
export const useWithdrawCollateral = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const withdrawCollateral = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'withdrawCollateral',
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
            toast.loading("Withdrawing collateral...", {
                id: "withdraw-collateral",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Collateral withdrawn successfully!", {
                id: "withdraw-collateral",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "withdraw-collateral",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { withdrawCollateral, isPending, isConfirming, isConfirmed, hash };
};
