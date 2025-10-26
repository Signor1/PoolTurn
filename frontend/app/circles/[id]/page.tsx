'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { PoolTurnSecureABI } from '@/abi/PoolTurnSecure';
import { POOLTURN_CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCircleData, useMemberData, usePendingPayout, useJoinCircleFlow, useContributeFlow, useClaimPayout, useFinalizeRound, useWithdrawCollateral } from '@/hooks/usePoolTurnContract';
import { useCircleInfo, useCircleDetails, useCircleMembers } from '@/hooks/useCircleQueries';
import { formatUnits } from 'viem';
import { ArrowLeft, Users, AlertCircle, Clock, CheckCircle, XCircle, Timer, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


export default function CircleDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { address } = useAccount();
    const circleId = BigInt(params.id as string);

    // Fetch circle data using new modular hooks
    const { circleInfo, isLoading: isLoadingInfo, error: infoError } = useCircleInfo(circleId);
    const { circleDetails, isLoading: isLoadingDetails, error: detailsError } = useCircleDetails(circleId);
    const { members, isLoading: isLoadingMembers, error: membersError } = useCircleMembers(circleId);

    // Legacy hooks for member data and payouts (keep for now)
    const { payoutOrder, insurancePool, isLoading: isLoadingLegacy, error: legacyError } = useCircleData(circleId);
    const { memberInfo, isLoading: isLoadingMember } = useMemberData(circleId, address || '0x0');
    const { pendingAmount, isLoading: isLoadingPayout } = usePendingPayout(circleId, address || '0x0');

    // Contract interaction hooks
    const { startJoinFlow, isPending: isJoining, currentStep } = useJoinCircleFlow(circleInfo?.tokenAddr as string || SUPPORTED_TOKENS.USDC.address);
    const {
        startContributeFlow,
        proceedToContribute,
        currentStep: contributeStep,
        isPending: isContributing,
        isApproveConfirmed
    } = useContributeFlow();
    const { claimPayout, isPending: isClaiming } = useClaimPayout();
    const { finalizeRound, isPending: isFinalizing } = useFinalizeRound();
    const { withdrawCollateral, isPending: isWithdrawing } = useWithdrawCollateral();

    // Timer and round state
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [roundExpired, setRoundExpired] = useState(false);
    const [previousState, setPreviousState] = useState<number | null>(null);

    const isLoading = isLoadingInfo || isLoadingDetails || isLoadingMembers || isLoadingMember || isLoadingPayout || isLoadingLegacy;
    const error = infoError || detailsError || membersError || legacyError;

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Open</Badge>;
            case 1: return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
            case 2: return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completed</Badge>;
            case 3: return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const formatTokenAmount = (amount: bigint, symbol: string = 'USDC') => {
        return `${formatUnits(amount, 6)} ${symbol}`;
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const formatPeriod = (seconds: number) => {
        const days = Math.floor(seconds / (24 * 60 * 60));
        if (days === 7) return "Weekly";
        if (days === 14) return "Bi-weekly";
        if (days === 30) return "Monthly";
        return `${days} days`;
    };

    const isMember = members?.includes(address || '0x0');

    // Fix: Using the structured CircleInfo object instead of array indices
    const canJoin = circleInfo?.state === 0 && !isMember && (members?.length || 0) < Number(circleInfo?.maxMembers || 0); // Open status and not full
    const canContribute = circleInfo?.state === 1 && isMember; // Active status and is member
    const hasPendingPayout = pendingAmount && pendingAmount > BigInt(0);
    const currentRound = Number(circleInfo?.currentRound || 0);
    const maxMembers = Number(circleInfo?.maxMembers || 0);
    const currentMembers = members?.length || 0;
    const progressPercentage = maxMembers > 0 ? (currentMembers / maxMembers) * 100 : 0;

    // Enhanced conditions for all actions
    const canWithdrawCollateral = (circleInfo?.state === 2 || circleInfo?.state === 3) && isMember; // Completed or Cancelled
    const canFinalizeRound = circleInfo?.state === 1 && roundExpired; // Active and round expired
    const isCircleCompleted = circleInfo?.state === 2;
    const isCircleCancelled = circleInfo?.state === 3;
    const isCircleActive = circleInfo?.state === 1;

    // Check if user contributed in current round (only for active circles)
    const { data: hasContributedThisRound } = useReadContract({
        address: POOLTURN_CONTRACT_ADDRESS,
        abi: PoolTurnSecureABI,
        functionName: 'getRoundDeposited',
        args: [circleId, BigInt(currentRound), address || '0x0'],
        query: {
            enabled: isCircleActive && !!address && currentRound > 0
        }
    });

    // Timer calculation for active circles
    useEffect(() => {
        if (!circleInfo || !isCircleActive) return;

        const calculateTimeRemaining = () => {
            const now = Math.floor(Date.now() / 1000);
            const roundStart = Number(circleInfo.roundStart);
            const periodDuration = Number(circleInfo.periodDuration);
            const roundEnd = roundStart + periodDuration;
            const remaining = roundEnd - now;

            setTimeRemaining(Math.max(0, remaining));
            setRoundExpired(remaining <= 0);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [circleInfo, isCircleActive]);

    // State transition notifications
    useEffect(() => {
        if (!circleInfo || previousState === null) {
            if (circleInfo) setPreviousState(circleInfo.state);
            return;
        }

        const currentState = circleInfo.state;

        // Circle became active
        if (previousState === 0 && currentState === 1) {
            toast.success('🎉 Circle is now active! Round 1 has started.', {
                position: 'top-right',
                duration: 5000
            });
        }

        // Circle completed
        if (previousState === 1 && currentState === 2) {
            toast.success('✅ Circle completed successfully! You can now withdraw your collateral.', {
                position: 'top-right',
                duration: 5000
            });
        }

        // Circle cancelled
        if (currentState === 3 && previousState !== 3) {
            toast.error('❌ Circle has been cancelled. You can withdraw your collateral.', {
                position: 'top-right',
                duration: 5000
            });
        }

        setPreviousState(currentState);
    }, [circleInfo, previousState]);

    // Round expiration notification
    useEffect(() => {
        if (roundExpired && isCircleActive && timeRemaining === 0) {
            toast.warning('⏰ Round has expired! It can now be finalized.', {
                position: 'top-right',
                duration: 5000
            });
        }
    }, [roundExpired, isCircleActive, timeRemaining]);

    // Auto-proceed to contribute after approval
    useEffect(() => {
        if (isApproveConfirmed && contributeStep === 'approving') {
            proceedToContribute(circleId);
        }
    }, [isApproveConfirmed, contributeStep, proceedToContribute, circleId]);

    // Format time remaining
    const formatTimeRemaining = (seconds: number) => {
        if (seconds <= 0) return "Round Expired";

        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = seconds % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    const handleJoinCircle = async () => {
        if (!circleInfo || !address) return;
        const contributionAmount = circleInfo.contributionAmount;
        const collateralFactor = circleInfo.collateralFactor;
        const insuranceFee = circleInfo.insuranceFee;
        const totalRequired = (contributionAmount * collateralFactor) + insuranceFee;

        await startJoinFlow(circleId, totalRequired, address);
    };

    const handleContribute = async () => {
        if (!circleInfo || !address) {
            toast.error("Please connect your wallet first", { position: "top-right" });
            return;
        }

        if (!isMember) {
            toast.info("You must be a member to contribute", { position: "top-right" });
            return;
        }

        if (!isCircleActive) {
            toast.info("Circle is not active yet", { position: "top-right" });
            return;
        }

        if (hasContributedThisRound) {
            toast.info("You have already contributed for this round", { position: "top-right" });
            return;
        }

        const contributionAmount = circleInfo.contributionAmount;
        await startContributeFlow(circleId, contributionAmount, address);
    };

    const handleClaimPayout = () => {
        if (!address) {
            toast.error("Please connect your wallet first", { position: "top-right" });
            return;
        }

        if (!hasPendingPayout) {
            toast.info("No pending payout available", { position: "top-right" });
            return;
        }

        claimPayout(circleId);
    };

    const handleFinalizeRound = () => {
        if (!address) {
            toast.error("Please connect your wallet first", { position: "top-right" });
            return;
        }

        if (!isCircleActive) {
            toast.info("Circle is not active", { position: "top-right" });
            return;
        }

        if (!roundExpired) {
            toast.info("Round has not expired yet", { position: "top-right" });
            return;
        }

        finalizeRound(circleId);
    };

    const handleWithdrawCollateral = () => {
        if (!address) {
            toast.error("Please connect your wallet first", { position: "top-right" });
            return;
        }

        if (!isMember) {
            toast.info("You must be a member to withdraw collateral", { position: "top-right" });
            return;
        }

        if (!canWithdrawCollateral) {
            toast.info("Collateral withdrawal not available yet", { position: "top-right" });
            return;
        }

        withdrawCollateral(circleId);
    };

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Circle</h2>
                        <p className="text-slate-400 mb-6">Unable to load circle details. Please try again.</p>
                        <Button onClick={() => router.back()} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-32" />
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Circles
                    </Button>
                </div>

                {/* Circle Overview */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white text-xl">
                                    {circleDetails?.name || `Circle #${circleId}`}
                                </CardTitle>
                                {circleInfo && getStatusBadge(circleInfo.state)}
                            </div>
                            <CardDescription className="text-slate-400">
                                {circleDetails?.description || 'No description available'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Contribution Amount</p>
                                    <p className="text-white font-semibold">
                                        {circleInfo ? formatTokenAmount(circleInfo.contributionAmount) : 'Loading...'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Period Duration</p>
                                    <p className="text-white font-semibold">
                                        {circleInfo ? formatPeriod(Number(circleInfo.periodDuration)) : 'Loading...'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Collateral Factor</p>
                                    <p className="text-white font-semibold">
                                        {circleInfo ? `${Number(circleInfo.collateralFactor)}%` : 'Loading...'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Insurance Fee</p>
                                    <p className="text-white font-semibold">
                                        {circleInfo ? formatTokenAmount(circleInfo.insuranceFee) : 'Loading...'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Members ({currentMembers}/{maxMembers})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Circle Progress</span>
                                    <span className="text-white">{progressPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Current Round</p>
                                    <p className="text-white font-semibold">{currentRound}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Insurance Pool</p>
                                    <p className="text-white font-semibold">
                                        {insurancePool ? formatTokenAmount(insurancePool) : 'Loading...'}
                                    </p>
                                </div>
                            </div>

                            {isMember && memberInfo && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-slate-400 text-sm mb-2">Your Status</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400">Contributed This Round:</span>
                                            <span className="text-green-400 ml-1">
                                                {isCircleActive
                                                    ? (hasContributedThisRound ? '✓' : '✗')
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Received Payout:</span>
                                            <span className="text-blue-400 ml-1">
                                                {(() => {
                                                    if (!payoutOrder || !address) return '✗';
                                                    // Check if user was a winner in any previous round
                                                    const userIndex = payoutOrder.findIndex(addr => addr === address);
                                                    if (userIndex === -1) return '✗';
                                                    // User has received payout if their round (userIndex + 1) is less than current round
                                                    const userRound = userIndex + 1;
                                                    return userRound < currentRound ? '✓' : '✗';
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Round Status - Only show for active circles */}
                {isCircleActive && (
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Timer className="h-5 w-5" />
                                Round {currentRound} Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Timer */}
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${roundExpired ? 'text-red-400' : 'text-green-400'}`}>
                                        {formatTimeRemaining(timeRemaining)}
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {roundExpired ? 'Ready to finalize' : 'Time remaining'}
                                    </p>
                                </div>

                                {/* Contribution Status */}
                                <div className="text-center">
                                    <div className="text-xl font-bold text-white">
                                        {hasContributedThisRound ? (
                                            <span className="text-green-400 flex items-center justify-center gap-1">
                                                <CheckCircle className="h-5 w-5" />
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="text-yellow-400 flex items-center justify-center gap-1">
                                                <Clock className="h-5 w-5" />
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm">Your contribution</p>
                                </div>

                                {/* Current Winner */}
                                <div className="text-center">
                                    <div className="text-lg font-bold text-purple-400 flex items-center justify-center gap-1">
                                        <Award className="h-5 w-5" />
                                        Winner
                                    </div>
                                    <p className="text-slate-400 text-sm font-mono">
                                        {payoutOrder && payoutOrder[currentRound - 1]
                                            ? `${payoutOrder[currentRound - 1].slice(0, 6)}...${payoutOrder[currentRound - 1].slice(-4)}`
                                            : 'Loading...'
                                        }
                                    </p>
                                    {payoutOrder && payoutOrder[currentRound - 1] === address && (
                                        <Badge className="bg-purple-500/20 text-purple-400 text-xs mt-1">You!</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Round Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Round Progress</span>
                                    <span className="text-white">{Math.max(0, 100 - (timeRemaining / Number(circleInfo?.periodDuration || 1)) * 100).toFixed(1)}%</span>
                                </div>
                                <Progress
                                    value={Math.max(0, 100 - (timeRemaining / Number(circleInfo?.periodDuration || 1)) * 100)}
                                    className="h-2"
                                />
                            </div>

                            {/* Urgent Actions */}
                            {roundExpired && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        Round has expired! Anyone can finalize to process defaults and advance to next round.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Circle Completion Status */}
                {(isCircleCompleted || isCircleCancelled) && (
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                {isCircleCompleted ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                        Circle Completed
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-400" />
                                        Circle Cancelled
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <p className="text-slate-400">
                                    {isCircleCompleted
                                        ? "All rounds have been completed successfully! You can now withdraw your collateral."
                                        : "This circle has been cancelled. You can withdraw your collateral."
                                    }
                                </p>

                                {canWithdrawCollateral && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                            <TrendingUp className="h-4 w-4" />
                                            Your collateral is ready for withdrawal
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Available Actions</CardTitle>
                        <CardDescription className="text-slate-400">
                            All possible actions for this circle. Unavailable actions will show informative messages when clicked.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Join Circle */}
                            <Button
                                onClick={handleJoinCircle}
                                disabled={isJoining || canJoin === false}
                                className={`${canJoin
                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    : "bg-slate-600 text-slate-300 cursor-not-allowed"
                                }`}
                                variant={canJoin ? "default" : "secondary"}
                            >
                                {isJoining ? (
                                    currentStep === 'approving' ? 'Approving...' :
                                    currentStep === 'joining' ? 'Joining...' : 'Processing...'
                                ) : 'Join Circle'}
                            </Button>

                            {/* Contribute */}
                            <Button
                                onClick={handleContribute}
                                disabled={isContributing || (canContribute === false && hasContributedThisRound)}
                                variant={canContribute && !hasContributedThisRound ? "outline" : "secondary"}
                                className={`${canContribute && !hasContributedThisRound
                                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                                    : "bg-slate-600 text-slate-300"
                                }`}
                            >
                                {isContributing ? (
                                    contributeStep === 'approving' ? 'Approving...' :
                                    contributeStep === 'contributing' ? 'Contributing...' : 'Processing...'
                                ) : 'Contribute'}
                            </Button>

                            {/* Claim Payout */}
                            <Button
                                onClick={handleClaimPayout}
                                disabled={isClaiming || !hasPendingPayout}
                                variant={hasPendingPayout ? "default" : "secondary"}
                                className={`${hasPendingPayout
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    : "bg-slate-600 text-slate-300"
                                }`}
                            >
                                {isClaiming ? 'Claiming...' :
                                 hasPendingPayout ? `Claim ${formatTokenAmount(pendingAmount || BigInt(0))}` : 'Claim Payout'}
                            </Button>

                            {/* Finalize Round */}
                            <Button
                                onClick={handleFinalizeRound}
                                disabled={isFinalizing || !canFinalizeRound}
                                variant={canFinalizeRound ? "default" : "secondary"}
                                className={`${canFinalizeRound
                                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                                    : "bg-slate-600 text-slate-300"
                                }`}
                            >
                                {isFinalizing ? 'Finalizing...' : 'Finalize Round'}
                            </Button>

                            {/* Withdraw Collateral */}
                            <Button
                                onClick={handleWithdrawCollateral}
                                disabled={isWithdrawing || !canWithdrawCollateral}
                                variant={canWithdrawCollateral ? "default" : "secondary"}
                                className={`${canWithdrawCollateral
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                    : "bg-slate-600 text-slate-300"
                                }`}
                            >
                                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Collateral'}
                            </Button>

                            {/* View Details - Always available for navigation */}
                            <Button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Scroll to Top
                            </Button>
                        </div>

                        {/* Status Indicators */}
                        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                            <h4 className="text-sm font-medium text-white mb-2">Action Status:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${canJoin ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className="text-slate-400">Join: {canJoin ? 'Available' : 'Not available'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${canContribute && !hasContributedThisRound ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className="text-slate-400">Contribute: {canContribute && !hasContributedThisRound ? 'Available' : 'Not available'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${hasPendingPayout ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className="text-slate-400">Claim: {hasPendingPayout ? 'Available' : 'Not available'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${canFinalizeRound ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className="text-slate-400">Finalize: {canFinalizeRound ? 'Available' : 'Not available'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${canWithdrawCollateral ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className="text-slate-400">Withdraw: {canWithdrawCollateral ? 'Available' : 'Not available'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Member List */}
                {members && members.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center justify-between">
                                Circle Members
                                {isCircleActive && (
                                    <Badge variant="outline" className="text-xs">
                                        Round {currentRound}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {members.map((member, index) => {
                                    const isCurrentWinner = isCircleActive && payoutOrder && payoutOrder[currentRound - 1] === member;
                                    const isUpcoming = isCircleActive && payoutOrder &&
                                        payoutOrder.findIndex(addr => addr === member) > (currentRound - 1);
                                    const hasReceivedPayout = !isCircleActive || (payoutOrder &&
                                        payoutOrder.findIndex(addr => addr === member) < (currentRound - 1));

                                    return (
                                        <div
                                            key={member}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                                isCurrentWinner
                                                    ? 'bg-purple-500/20 border border-purple-500/30'
                                                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                                    isCurrentWinner
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                                        : 'bg-gradient-to-r from-slate-600 to-slate-500'
                                                }`}>
                                                    {payoutOrder ? payoutOrder.findIndex(addr => addr === member) + 1 : index + 1}
                                                </div>
                                                <div>
                                                    <span className="text-white font-mono text-sm">
                                                        {formatAddress(member)}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {member === address && (
                                                            <Badge variant="outline" className="text-xs">You</Badge>
                                                        )}
                                                        {isCurrentWinner && (
                                                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">Current Winner</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {isCircleActive ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        {isCurrentWinner && (
                                                            <span className="text-purple-400 text-sm font-medium flex items-center gap-1">
                                                                <Award className="h-3 w-3" />
                                                                Receiving payout
                                                            </span>
                                                        )}
                                                        {hasReceivedPayout && !isCurrentWinner && (
                                                            <span className="text-green-400 text-sm flex items-center gap-1">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Received
                                                            </span>
                                                        )}
                                                        {isUpcoming && (
                                                            <span className="text-slate-400 text-sm">
                                                                Round {payoutOrder.findIndex(addr => addr === member) + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">
                                                        Position {index + 1}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}