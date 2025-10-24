"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBlockNumber } from "wagmi";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SUPPORTED_TOKENS } from "@/lib/config";
import { USDCABI } from "@/abi/USDCABI";
import { formatUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";

export function USDTMint() {
    const [mintAmount, setMintAmount] = useState("100");
    const { address } = useAccount();
    const queryClient = useQueryClient();
    const { data: blockNumber } = useBlockNumber({ watch: true });

    const { data: balance, queryKey } = useReadContract({
        address: SUPPORTED_TOKENS.USDT.address,
        abi: USDCABI,
        functionName: "balanceOf",
        args: [address || "0x0"],
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

    const { writeContract, data: hash, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
        hash,
    });

    const handleMint = async () => {
        if (!address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!mintAmount || parseFloat(mintAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            const amount = parseUnits(mintAmount, SUPPORTED_TOKENS.USDT.decimals);

            writeContract({
                address: SUPPORTED_TOKENS.USDT.address,
                abi: USDCABI,
                functionName: "mint",
                args: [address, amount],
            });
        } catch (error) {
            console.error("Mint error:", error);
            toast.error("Failed to mint USDC");
        }
    };

    // Handle success and error toasts properly with useEffect to prevent continuous triggering
    useEffect(() => {
        if (isSuccess && hash) {
            toast.success(`Successfully minted ${mintAmount} USDT!`, {
                id: `mint-success-${hash}`, // Unique ID based on transaction hash
                position: "top-right",
            });
        }
    }, [isSuccess, hash, mintAmount]);

    // Handle transaction errors
    useEffect(() => {
        if (txError && hash) {
            console.error('Mint transaction error:', txError);
            toast.error("Mint transaction failed", {
                id: `mint-error-${hash}`,
                position: "top-right",
            });
        }
    }, [txError, hash]);

    // Loading state is handled by button UI, no toast needed

    return (
        <Card className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    {/* Header Section */}
                    <div className="flex-1 text-center lg:text-left">
                        <CardTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            Mint USDT Tokens
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                            Mint test USDT tokens to participate in savings circles
                        </CardDescription>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            <p>Free test tokens for Base • No real value</p>
                        </div>
                    </div>

                    {/* Input and Button Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Label htmlFor="mint-amount" className="text-sm font-medium whitespace-nowrap">
                                Amount:
                            </Label>
                            <Input
                                id="mint-amount"
                                type="number"
                                placeholder="100"
                                value={mintAmount}
                                onChange={(e) => setMintAmount(e.target.value)}
                                className="w-24 text-center font-semibold"
                                min="1"
                                step="1"
                            />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">USDC</span>
                        </div>

                        <Button
                            onClick={handleMint}
                            disabled={isPending || isConfirming || !mintAmount}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                        >
                            {isPending || isConfirming ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>{isPending ? "Minting..." : "Confirming..."}</span>
                                </div>
                            ) : (
                                "Mint USDC"
                            )}
                        </Button>
                    </div>

                    {/* Balance Section */}
                    {address && balance && (
                        <div className="text-center lg:text-right">
                            <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="font-medium text-blue-800 dark:text-blue-200">
                                    Balance: {formatUnits(balance, SUPPORTED_TOKENS.USDT.decimals)} USDT
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}