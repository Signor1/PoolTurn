"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TrendingUp, Gift, Info } from "lucide-react"

interface YieldRewardsSectionProps {
    enableYield: boolean
    creatorRewardAmount: string
    tokenSymbol: string
    onEnableYieldChange: (enabled: boolean) => void
    onRewardAmountChange: (amount: string) => void
}

export function YieldRewardsSection({
    enableYield,
    creatorRewardAmount,
    tokenSymbol,
    onEnableYieldChange,
    onRewardAmountChange,
}: YieldRewardsSectionProps) {
    return (
        <Card className="glass-morphism border-secondary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    Yield & Rewards (Optional)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Yield Generation Toggle */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/30 border border-primary/10">
                        <Checkbox
                            id="enableYield"
                            checked={enableYield}
                            onCheckedChange={onEnableYieldChange}
                            className="border-2"
                        />
                        <div className="flex-1 space-y-1">
                            <Label
                                htmlFor="enableYield"
                                className="text-foreground font-medium cursor-pointer flex items-center gap-2"
                            >
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Enable Yield Generation
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Insurance pool funds earn yield via Aave V3. Members receive 70% of yields,
                                protocol keeps 30%. Only available for USDC circles.
                            </p>
                        </div>
                    </div>

                    {enableYield && (
                        <div className="ml-8 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-300 space-y-1">
                                    <p className="font-medium">How Yield Works:</p>
                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                        <li>Insurance pool deposited to Aave when circle activates</li>
                                        <li>Anyone can harvest yield at any time</li>
                                        <li>Members claim their share proportionally</li>
                                        <li>Yield generation is fully automated</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="my-4" />

                {/* Creator Reward Pool */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-secondary" />
                        <Label htmlFor="creatorRewardAmount" className="text-foreground font-medium">
                            Creator Reward Pool (Optional)
                        </Label>
                    </div>
                    <Input
                        id="creatorRewardAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={creatorRewardAmount}
                        onChange={(e) => onRewardAmountChange(e.target.value)}
                        className="bg-background/50 border-secondary/30 focus:border-secondary"
                    />
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                            Deposit bonus {tokenSymbol} that will be split equally among members with
                            perfect payment history (zero defaults) after circle completion.
                        </span>
                    </p>

                    {parseFloat(creatorRewardAmount || "0") > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-start gap-2">
                                <Gift className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-green-300">
                                    <p className="font-medium mb-1">Reward Details:</p>
                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                        <li>
                                            You will deposit <span className="font-bold">{creatorRewardAmount} {tokenSymbol}</span> as bonus rewards
                                        </li>
                                        <li>Only members with zero defaults are eligible</li>
                                        <li>Rewards split equally among eligible members</li>
                                        <li>Claimable after circle completion</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-px bg-border ${className}`} />
}
