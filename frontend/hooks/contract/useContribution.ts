import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '@/lib/config';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
    type BaseError,
} from "wagmi";
import { USDCABI } from '@/abi/USDCABI';

/**
 * Enhanced contribute hook with approval flow
 * Automatically checks allowance and handles approval if needed before contributing
 */
export const useContributeFlow = () => {
    const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'contributing'>('idle');
    const [userToCheck, setUserToCheck] = useState<`0x${string}` | null>(null);

    const { data: hash, writeContract, isPending, reset } = useWriteContract();

    // Get allowance for the user
    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        address: SUPPORTED_TOKENS.USDC.address,
        abi: USDCABI,
        functionName: 'allowance',
        args: [userToCheck || '0x0', POOLTURN_CONTRACT_ADDRESS],
        query: {
            enabled: !!userToCheck
        }
    });

    // Approval transaction
    const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending } = useWriteContract();

    // Contribute transaction
    const { data: contributeHash, writeContract: writeContribute, isPending: isContributePending } = useWriteContract();

    const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isLoading: isContributeConfirming, isSuccess: isContributeConfirmed } = useWaitForTransactionReceipt({ hash: contributeHash });

    const startContributeFlow = useCallback(async (circleId: bigint, contributionAmount: bigint, userAddress: `0x${string}`) => {
        setUserToCheck(userAddress);
        const allowanceData = await refetchAllowance();
        const currentAllowanceAmount = allowanceData.data as bigint || BigInt(0);

        if (currentAllowanceAmount >= contributionAmount) {
            // Skip approval, go directly to contribute
            setCurrentStep('contributing');
            writeContribute({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'contribute',
                args: [circleId],
            });
        } else {
            // Need to approve first
            setCurrentStep('approving');
            writeApprove({
                address: SUPPORTED_TOKENS.USDC.address,
                abi: USDCABI,
                functionName: 'approve',
                args: [POOLTURN_CONTRACT_ADDRESS, contributionAmount],
            });
        }
    }, [writeApprove, writeContribute, refetchAllowance]);

    const resetFlow = useCallback(() => {
        setCurrentStep('idle');
        setUserToCheck(null);
        reset();
    }, [reset]);

    // Handle approval confirmation
    useEffect(() => {
        if (isApproveConfirmed && approveHash && currentStep === 'approving') {
            toast.success("Approval successful! Now contributing...", {
                id: `contribute-approve-${approveHash}`,
                position: "top-right",
            });
        }
    }, [isApproveConfirmed, approveHash, currentStep]);

    // Handle contribute confirmation
    useEffect(() => {
        if (isContributeConfirmed && contributeHash) {
            toast.success("Contribution successful!", {
                id: `contribute-success-${contributeHash}`,
                position: "top-right",
            });
            resetFlow();
        }
    }, [isContributeConfirmed, contributeHash, resetFlow]);

    const proceedToContribute = useCallback((circleId: bigint) => {
        if (currentStep === 'approving' && isApproveConfirmed) {
            setCurrentStep('contributing');
            writeContribute({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'contribute',
                args: [circleId],
            });
        }
    }, [currentStep, isApproveConfirmed, writeContribute]);

    return {
        startContributeFlow,
        proceedToContribute,
        resetFlow,
        currentStep,
        isPending: isApprovePending || isContributePending,
        isApproveConfirming,
        isContributeConfirming,
        isApproveConfirmed,
        isContributeConfirmed,
        approveHash,
        contributeHash
    };
};

/**
 * Basic contribute hook for backward compatibility
 * Use useContributeFlow for new implementations
 * @deprecated Use useContributeFlow instead
 */
export const useContribute = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const contribute = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'contribute',
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
            toast.loading("Processing contribution...", {
                id: "contribute",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Contribution successful!", {
                id: "contribute",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "contribute",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { contribute, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Hook for finalizing expired rounds
 * Allows any user to finalize a round that has expired
 */
export const useFinalizeRound = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const finalizeRound = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'finalizeRoundIfExpired',
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
            toast.loading("Finalizing round...", {
                id: "finalize-round",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Round finalized successfully!", {
                id: "finalize-round",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "finalize-round",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { finalizeRound, isPending, isConfirming, isConfirmed, hash };
};
