import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS } from '@/lib/config';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
    type BaseError,
} from "wagmi";

/**
 * Basic hook for joining circles
 * Use useJoinCircleFlow for new implementations with automatic approval handling
 */
export const useJoinCircle = () => {
    const { data: hash, error, writeContract, isPending } = useWriteContract();

    const joinCircle = useCallback(async (circleId: bigint) => {
        try {
            writeContract({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'joinCircle',
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
            toast.loading("Joining circle...", {
                id: "join-circle",
                position: "top-right",
            });
        }

        if (isConfirmed && hash) {
            toast.success("Successfully joined circle!", {
                id: "join-circle",
                position: "top-right",
            });
        }

        if (error) {
            toast.error((error as BaseError).shortMessage || error.message, {
                id: "join-circle",
                position: "top-right",
            });
        }
    }, [isConfirmed, error, isConfirming, hash]);

    return { joinCircle, isPending, isConfirming, isConfirmed, hash };
};

/**
 * Enhanced hook for the complete join circle flow
 * Automatically handles:
 * - Checking token allowance
 * - Requesting approval if needed
 * - Joining the circle after approval
 * - Comprehensive error handling and user feedback
 */
export const useJoinCircleFlow = (token_address: string) => {
    const [currentStep, setCurrentStep] = useState<'idle' | 'checking-allowance' | 'approving' | 'joining' | 'completed' | 'error'>('idle');
    const [currentCircleId, setCurrentCircleId] = useState<bigint | null>(null);
    const [totalRequired, setTotalRequired] = useState<bigint>(BigInt(0));

    const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, reset: resetApprove } = useWriteContract();
    const { writeContract: writeJoin, data: joinHash, isPending: isJoinPending, reset: resetJoin } = useWriteContract();

    const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed, error: approveError } =
        useWaitForTransactionReceipt({ hash: approveHash });

    const { isLoading: isJoinConfirming, isSuccess: isJoinConfirmed, error: joinError, data: joinReceipt } =
        useWaitForTransactionReceipt({ hash: joinHash });

    // Function to check allowance for a specific user using read contract
    const [userToCheck, setUserToCheck] = useState<`0x${string}` | null>(null);

    const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
        address: token_address as `0x${string}`,
        abi: [
            {
                type: "function",
                name: "allowance",
                inputs: [
                    { name: "owner", type: "address", internalType: "address" },
                    { name: "spender", type: "address", internalType: "address" },
                ],
                outputs: [{ name: "allowance", type: "uint256", internalType: "uint256" }],
                stateMutability: "view",
            },
        ] as const,
        functionName: 'allowance',
        args: userToCheck ? [userToCheck, POOLTURN_CONTRACT_ADDRESS] : ['0x0000000000000000000000000000000000000000', POOLTURN_CONTRACT_ADDRESS],
        query: { enabled: !!userToCheck }
    });

    const resetFlow = useCallback(() => {
        setCurrentStep('idle');
        setCurrentCircleId(null);
        setTotalRequired(BigInt(0));
        setUserToCheck(null);
        resetApprove();
        resetJoin();

        // Clean up all join flow toasts
        toast.dismiss("join-flow-checking");
        toast.dismiss("join-flow-joining");
        toast.dismiss("join-flow-approving");
        toast.dismiss("join-flow-joining-after-approval");
        toast.dismiss("join-flow-success");
        toast.dismiss("join-flow-error");
    }, [resetApprove, resetJoin]);

    const startJoinFlow = useCallback(async (circleId: bigint, requiredAmount: bigint, userAddress: `0x${string}`) => {
        try {
            setCurrentStep('checking-allowance');
            setCurrentCircleId(circleId);
            setTotalRequired(requiredAmount);

            toast.loading("Checking allowance...", {
                id: "join-flow-checking",
                position: "top-right",
            });

            // Set user to check allowance for and refetch
            setUserToCheck(userAddress);
            const allowanceData = await refetchAllowance();
            const currentAllowanceAmount = allowanceData.data as bigint || BigInt(0);

            if (currentAllowanceAmount >= requiredAmount) {
                // Sufficient allowance, proceed directly to join
                setCurrentStep('joining');
                toast.loading("Joining circle...", {
                    id: "join-flow-joining",
                    position: "top-right",
                });

                writeJoin({
                    address: POOLTURN_CONTRACT_ADDRESS,
                    abi: PoolTurnSecureABI,
                    functionName: 'joinCircle',
                    args: [circleId],
                });
            } else {
                // Need to approve first
                setCurrentStep('approving');
                toast.loading("Approving USDC spending...", {
                    id: "join-flow-approving",
                    position: "top-right",
                });

                writeApprove({
                    address: token_address as `0x${string}`,
                    abi: [
                        {
                            type: "function",
                            name: "approve",
                            inputs: [
                                { name: "spender", type: "address", internalType: "address" },
                                { name: "value", type: "uint256", internalType: "uint256" },
                            ],
                            outputs: [{ name: "success", type: "bool", internalType: "bool" }],
                            stateMutability: "nonpayable",
                        },
                    ] as const,
                    functionName: 'approve',
                    args: [POOLTURN_CONTRACT_ADDRESS, requiredAmount],
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start join process", {
                id: "join-flow-error",
                position: "top-right"
            });
            setCurrentStep('error');
            setTimeout(resetFlow, 3000);
        }
    }, [writeApprove, writeJoin, refetchAllowance, resetFlow, token_address]);

    // Handle approval confirmation
    useEffect(() => {
        if (isApproveConfirmed && currentStep === 'approving' && currentCircleId) {
            setCurrentStep('joining');
            toast.loading("Approval confirmed! Joining circle...", {
                id: "join-flow-joining-after-approval",
                position: "top-right",
            });

            // Step 2: Join circle
            writeJoin({
                address: POOLTURN_CONTRACT_ADDRESS,
                abi: PoolTurnSecureABI,
                functionName: 'joinCircle',
                args: [currentCircleId],
            });
        }
    }, [isApproveConfirmed, currentStep, currentCircleId, writeJoin]);

    // Handle join confirmation
    useEffect(() => {
        if (isJoinConfirmed && currentStep === 'joining') {
            setCurrentStep('completed');
            // Clear any existing loading toasts first
            toast.dismiss("join-flow-checking");
            toast.dismiss("join-flow-joining");
            toast.dismiss("join-flow-approving");
            toast.dismiss("join-flow-joining-after-approval");

            toast.success("Successfully joined circle!", {
                id: "join-flow-success",
                position: "top-right",
            });
            // Reset after a brief delay
            setTimeout(resetFlow, 2000);
        }
    }, [isJoinConfirmed, currentStep, resetFlow]);

    // Handle approval errors
    useEffect(() => {
        if (approveError && currentStep === 'approving') {
            const errorMessage = (approveError as BaseError).shortMessage ||
                (approveError as BaseError).message ||
                "Transaction failed";

            // Clear any existing loading toasts first
            toast.dismiss("join-flow-checking");
            toast.dismiss("join-flow-approving");

            toast.error(`Approval failed: ${errorMessage}`, {
                id: "join-flow-error",
                position: "top-right",
            });
            setCurrentStep('error');
            setTimeout(resetFlow, 3000);
        }
    }, [approveError, currentStep, resetFlow]);

    // Handle join errors and failed transactions
    useEffect(() => {
        if (joinError && currentStep === 'joining') {
            const errorMessage = (joinError as BaseError).shortMessage ||
                (joinError as BaseError).message ||
                "Transaction failed";

            // Clear any existing loading toasts first
            toast.dismiss("join-flow-checking");
            toast.dismiss("join-flow-joining");
            toast.dismiss("join-flow-joining-after-approval");

            toast.error(`Join failed: ${errorMessage}`, {
                id: "join-flow-error",
                position: "top-right",
            });
            setCurrentStep('error');
            setTimeout(resetFlow, 3000);
        }
    }, [joinError, currentStep, resetFlow]);

    // Handle failed transaction receipts (status = 0)
    useEffect(() => {
        if (joinReceipt && joinReceipt.status === 'reverted' && currentStep === 'joining') {
            // Clear any existing loading toasts first
            toast.dismiss("join-flow-checking");
            toast.dismiss("join-flow-joining");
            toast.dismiss("join-flow-joining-after-approval");

            toast.error('Join transaction failed - transaction was reverted', {
                id: "join-flow-error",
                position: "top-right",
            });
            setCurrentStep('error');
            setTimeout(resetFlow, 3000);
        }
    }, [joinReceipt, currentStep, resetFlow]);

    const isPending = !['idle', 'completed', 'error'].includes(currentStep);
    const isApproving = currentStep === 'approving' || (currentStep === 'checking-allowance');
    const isJoining = currentStep === 'joining';

    return {
        startJoinFlow,
        resetFlow,
        currentStep,
        currentCircleId,
        isPending,
        isApproving,
        isJoining,
        isCompleted: currentStep === 'completed',
        isError: currentStep === 'error'
    };
};
