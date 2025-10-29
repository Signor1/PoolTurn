import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '@/lib/config';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    useReadContract,
    useBlockNumber,
    type BaseError,
} from "wagmi";
import { useQueryClient } from '@tanstack/react-query';
import { USDCABI } from '@/abi/USDCABI';

// Hook for creating circles
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

// Enhanced contribute hook with approval flow
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
            // Auto-proceed to contribute step - we'll need the circle info
            // This will be handled by the component calling this hook
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

// Keep the old contribute hook for backward compatibility, but mark as deprecated
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

// Hook for reading member data
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

// Hook for reading user's pending payouts
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

// Hook for finalizing expired rounds
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

// Enhanced hook for joining circles with approval flow
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

// Enhanced hook for the complete join circle flow with improved error handling
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
    }, [writeApprove, writeJoin, refetchAllowance, resetFlow]);

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