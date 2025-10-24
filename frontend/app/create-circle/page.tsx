// frontend/app/create-circle/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Users, Clock, Shield, Info, DollarSign, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { SUPPORTED_TOKENS, PERIOD_PRESETS, CIRCLE_LIMITS, DEFAULT_CIRCLE_VALUES } from "@/lib/config"
import { useCreateCircle } from "@/hooks/usePoolTurnContract"
import { useAccount } from "wagmi"
import { parseUnits } from "viem"

export default function CreateCirclePage() {
    const { isConnected } = useAccount()
    const { createCircle, isPending, isConfirmed } = useCreateCircle()
    const router = useRouter()

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        token: DEFAULT_CIRCLE_VALUES.token,
        contributionAmount: DEFAULT_CIRCLE_VALUES.contributionAmount,
        periodDuration: DEFAULT_CIRCLE_VALUES.periodDuration.toString(),
        maxMembers: DEFAULT_CIRCLE_VALUES.maxMembers.toString(),
        collateralFactor: DEFAULT_CIRCLE_VALUES.collateralFactor.toString(),
        insuranceFee: DEFAULT_CIRCLE_VALUES.insuranceFee,
    })

    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const selectedToken = Object.values(SUPPORTED_TOKENS).find(
        token => token.address === formData.token
    ) || SUPPORTED_TOKENS.USDC

    // Calculate totals
    const contributionAmount = parseFloat(formData.contributionAmount) || 0
    const collateralRequired = contributionAmount * parseFloat(formData.collateralFactor)
    const insuranceFee = parseFloat(formData.insuranceFee) || 0
    const totalRequired = collateralRequired + insuranceFee

    const canCreate =
        formData.name.trim() &&
        formData.description.trim() &&
        contributionAmount > 0 &&
        parseInt(formData.maxMembers) >= CIRCLE_LIMITS.MIN_MEMBERS &&
        parseInt(formData.maxMembers) <= CIRCLE_LIMITS.MAX_MEMBERS &&
        agreedToTerms &&
        isConnected

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canCreate) return

        try {
            await createCircle({
                name: formData.name,
                description: formData.description,
                token: formData.token as `0x${string}`,
                contributionAmount: parseUnits(formData.contributionAmount, selectedToken.decimals),
                periodDuration: BigInt(formData.periodDuration),
                maxMembers: BigInt(formData.maxMembers),
                collateralFactor: BigInt(formData.collateralFactor),
                insuranceFee: parseUnits(formData.insuranceFee, selectedToken.decimals),
                initialPayoutOrder: [], // Empty array for now - can be set later
            })
        } catch (error) {
            console.error("Failed to create circle:", error)
        }
    }

    // Navigate to My Circles after successful creation
    useEffect(() => {
        if (isConfirmed) {
            router.push('/my-circles')
        }
    }, [isConfirmed, router])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 mt-16">
                <div className="max-w-6xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent mb-4">
                            Create Savings Circle
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Start a new community savings circle with collateral protection and transparent payout rotation.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Configuration Panel */}
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <Card className="glass-morphism border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Info className="w-5 h-5 text-primary" />
                                            Circle Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="name" className="text-foreground font-medium">
                                                Circle Name *
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g., Monthly Savers Group"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange("name", e.target.value)}
                                                className="glass-morphism border-primary/20 focus:border-primary mt-2"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="text-foreground font-medium">
                                                Description *
                                            </Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe the purpose and goals of your savings circle..."
                                                value={formData.description}
                                                onChange={(e) => handleInputChange("description", e.target.value)}
                                                className="glass-morphism border-primary/20 focus:border-primary mt-2"
                                                rows={3}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Settings */}
                                <Card className="glass-morphism border-secondary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-secondary" />
                                            Financial Configuration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="text-foreground font-medium">Payment Token</Label>
                                            <Select
                                                value={formData.token}
                                                onValueChange={(value) => handleInputChange("token", value)}
                                            >
                                                <SelectTrigger className="glass-morphism border-primary/20 focus:border-primary mt-2">
                                                    <SelectValue placeholder="Select token" />
                                                </SelectTrigger>
                                                <SelectContent className="glass-morphism border-primary/20">
                                                    {Object.values(SUPPORTED_TOKENS).map((token) => (
                                                        <SelectItem key={token.address} value={token.address}>
                                                            {token.symbol} - {token.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="contribution" className="text-foreground font-medium">
                                                    Contribution Amount ({selectedToken.symbol}) *
                                                </Label>
                                                <Input
                                                    id="contribution"
                                                    type="number"
                                                    placeholder="100"
                                                    value={formData.contributionAmount}
                                                    onChange={(e) => handleInputChange("contributionAmount", e.target.value)}
                                                    className="glass-morphism border-primary/20 focus:border-primary mt-2"
                                                    min={CIRCLE_LIMITS.MIN_CONTRIBUTION}
                                                    max={CIRCLE_LIMITS.MAX_CONTRIBUTION}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="insurance" className="text-foreground font-medium">
                                                    Insurance Fee ({selectedToken.symbol})
                                                </Label>
                                                <Input
                                                    id="insurance"
                                                    type="number"
                                                    placeholder="5"
                                                    value={formData.insuranceFee}
                                                    onChange={(e) => handleInputChange("insuranceFee", e.target.value)}
                                                    className="glass-morphism border-primary/20 focus:border-primary mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="collateral" className="text-foreground font-medium">
                                                Collateral Factor (x{formData.collateralFactor})
                                            </Label>
                                            <Select
                                                value={formData.collateralFactor}
                                                onValueChange={(value) => handleInputChange("collateralFactor", value)}
                                            >
                                                <SelectTrigger className="glass-morphism border-primary/20 focus:border-primary mt-2">
                                                    <SelectValue placeholder="Select collateral factor" />
                                                </SelectTrigger>
                                                <SelectContent className="glass-morphism border-primary/20">
                                                    {Array.from({ length: CIRCLE_LIMITS.MAX_COLLATERAL_FACTOR }, (_, i) => i + 1).map((factor) => (
                                                        <SelectItem key={factor} value={factor.toString()}>
                                                            {factor}x - {factor * contributionAmount} {selectedToken.symbol} required
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Circle Settings */}
                                <Card className="glass-morphism border-accent/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-accent" />
                                            Circle Configuration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="members" className="text-foreground font-medium">
                                                    Max Members *
                                                </Label>
                                                <Input
                                                    id="members"
                                                    type="number"
                                                    placeholder="10"
                                                    value={formData.maxMembers}
                                                    onChange={(e) => handleInputChange("maxMembers", e.target.value)}
                                                    className="glass-morphism border-primary/20 focus:border-primary mt-2"
                                                    min={CIRCLE_LIMITS.MIN_MEMBERS}
                                                    max={CIRCLE_LIMITS.MAX_MEMBERS}
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-foreground font-medium">Period Duration</Label>
                                                <Select
                                                    value={formData.periodDuration}
                                                    onValueChange={(value) => handleInputChange("periodDuration", value)}
                                                >
                                                    <SelectTrigger className="glass-morphism border-primary/20 focus:border-primary mt-2">
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                    <SelectContent className="glass-morphism border-primary/20">
                                                        <SelectItem value={PERIOD_PRESETS.WEEKLY.toString()}>1 Week</SelectItem>
                                                        <SelectItem value={PERIOD_PRESETS.BIWEEKLY.toString()}>2 Weeks</SelectItem>
                                                        <SelectItem value={PERIOD_PRESETS.MONTHLY.toString()}>1 Month</SelectItem>
                                                        <SelectItem value={PERIOD_PRESETS.QUARTERLY.toString()}>3 Months</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Preview Panel */}
                            <div className="space-y-6">
                                {/* Circle Preview */}
                                <Card className="glass-morphism border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-primary" />
                                            Circle Preview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {formData.name ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-foreground">{formData.name}</h3>
                                                    <p className="text-muted-foreground">{formData.description || "No description provided"}</p>
                                                </div>

                                                <Separator className="bg-primary/20" />

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Contribution</span>
                                                        <p className="text-foreground font-medium">{contributionAmount} {selectedToken.symbol}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Max Members</span>
                                                        <p className="text-foreground font-medium">{formData.maxMembers}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Period</span>
                                                        <p className="text-foreground font-medium">
                                                            {formData.periodDuration === PERIOD_PRESETS.WEEKLY.toString() ? "Weekly" :
                                                                formData.periodDuration === PERIOD_PRESETS.BIWEEKLY.toString() ? "Bi-weekly" :
                                                                    formData.periodDuration === PERIOD_PRESETS.MONTHLY.toString() ? "Monthly" :
                                                                        formData.periodDuration === PERIOD_PRESETS.QUARTERLY.toString() ? "Quarterly" : "Custom"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Collateral</span>
                                                        <p className="text-foreground font-medium">{collateralRequired} {selectedToken.symbol}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">Fill in circle details to see preview</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Financial Summary */}
                                <Card className="glass-morphism border-secondary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-secondary" />
                                            Financial Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-foreground font-medium">Total Pool Value</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {contributionAmount * parseInt(formData.maxMembers || "0")} {selectedToken.symbol}
                                                    {" "}(per round)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-foreground font-medium">Your Required Deposit</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {totalRequired} {selectedToken.symbol} (collateral + insurance)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-foreground font-medium">Monthly Commitment</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {contributionAmount} {selectedToken.symbol} per period
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* How It Works */}
                                <Card className="glass-morphism border-accent/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Info className="w-5 h-5 text-accent" />
                                            How ROSCA Works
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</div>
                                            <div>
                                                <p className="text-foreground font-medium">Members Join & Lock Collateral</p>
                                                <p className="text-muted-foreground text-sm">Each member locks collateral to ensure commitment</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</div>
                                            <div>
                                                <p className="text-foreground font-medium">Regular Contributions</p>
                                                <p className="text-muted-foreground text-sm">Members contribute monthly to the shared pool</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</div>
                                            <div>
                                                <p className="text-foreground font-medium">Rotating Payouts</p>
                                                <p className="text-muted-foreground text-sm">Each round, one member receives the full pool</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</div>
                                            <div>
                                                <p className="text-foreground font-medium">Collateral Protection</p>
                                                <p className="text-muted-foreground text-sm">Defaults are covered by slashing collateral</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Terms and Create */}
                                <Card className="glass-morphism border-primary/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-2 mb-4">
                                            <Checkbox
                                                id="terms"
                                                checked={agreedToTerms}
                                                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                                            />
                                            <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                                                I understand the ROSCA mechanics and agree to the collateral requirements. I acknowledge that
                                                missed payments may result in collateral slashing and reputation penalties.
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 neon-glow"
                                            disabled={!canCreate || isPending}
                                        >
                                            {isPending ? (
                                                <>
                                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                    Creating Circle...
                                                </>
                                            ) : (
                                                "Create Savings Circle"
                                            )}
                                        </Button>

                                        {!isConnected && (
                                            <p className="text-center text-red-400 text-sm mt-3">
                                                Please connect your wallet to create a circle
                                            </p>
                                        )}

                                        <p className="text-center text-muted-foreground text-sm mt-3">
                                            Estimated gas fee: <span className="text-primary font-medium">~$2-5</span>
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}