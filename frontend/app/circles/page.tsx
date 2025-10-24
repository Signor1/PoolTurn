"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Search, Filter, Clock, Users, TrendingUp, DollarSign, Plus, Shield, Eye } from "lucide-react"
import Link from "next/link"
import { CircleState, SUPPORTED_TOKENS } from "@/lib/config"
import { USDCMint } from "@/components/usdc-mint"
import { useJoinCircleFlow } from "@/hooks/usePoolTurnContract"
import { useAllCirclesMulticall } from "@/hooks/useCircleQueries"
import { parseUnits } from "viem"
import { useAccount } from "wagmi"
import { USDTMint } from "@/components/usdt-mint"


export default function CirclesPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [selectedToken, setSelectedToken] = useState("all")
    const { address } = useAccount()

    const [token, setToken] = useState<string>(SUPPORTED_TOKENS.USDC.address)
    const {
        startJoinFlow,
        currentCircleId,
        isPending,
        isApproving,
        isJoining
    } = useJoinCircleFlow(token)


    // Fetch all circles from the contract
    const { circles: contractCircles, isLoading: isLoadingCircles, error: circlesError } = useAllCirclesMulticall()

    const handleJoinCircle = async (e: React.MouseEvent, circleId: number, token_address: string) => {
        e.preventDefault()
        e.stopPropagation()

        setToken(token_address)

        if (!address) {
            toast.error("Please connect your wallet first")
            return
        }

        // Find the circle to get contribution amount and collateral factor
        const circle = contractCircles.find(c => c.id === circleId)
        if (!circle) {
            toast.error("Circle not found")
            return
        }

        // Calculate total amount needed (collateral + insurance fee)
        const contributionAmount = parseUnits(circle.contributionAmount, SUPPORTED_TOKENS.USDC.decimals)
        const collateral = contributionAmount * BigInt(circle.collateralFactor)
        const insuranceFee = parseUnits(circle.insuranceFee, SUPPORTED_TOKENS.USDC.decimals)
        const totalRequired = collateral + insuranceFee

        // Start the unified join flow - toast will be shown by the hook
        await startJoinFlow(BigInt(circleId), totalRequired, address)
    }

    // Use real circles data only
    const allCircles = contractCircles

    const filteredCircles = allCircles.filter((circle) => {
        const matchesSearch =
            circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            circle.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "open" && circle.state === CircleState.Open) ||
            (statusFilter === "active" && circle.state === CircleState.Active) ||
            (statusFilter === "completed" && circle.state === CircleState.Completed)

        const matchesToken = selectedToken === "all" || circle.token === selectedToken

        return matchesSearch && matchesStatus && matchesToken
    })

    const getStatusBadge = (state: CircleState) => {
        switch (state) {
            case CircleState.Open:
                return <Badge className="bg-primary/20 text-primary">Open</Badge>
            case CircleState.Active:
                return <Badge className="bg-secondary/20 text-secondary">Active</Badge>
            case CircleState.Completed:
                return <Badge className="bg-muted/20 text-muted-foreground">Completed</Badge>
            case CircleState.Cancelled:
                return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>
            default:
                return null
        }
    }

    const getTokenSymbol = (address: string) => {
        const token = Object.values(SUPPORTED_TOKENS).find(t => t.address === address)
        return token?.symbol || "TOKEN"
    }

    const getMembershipProgress = (current: number, max: number) => {
        return (current / max) * 100
    }

    const formatPeriod = (seconds: number) => {
        const days = Math.floor(seconds / (24 * 60 * 60))
        if (days === 7) return "Weekly"
        if (days === 14) return "Bi-weekly"
        if (days === 30) return "Monthly"
        if (days === 90) return "Quarterly"
        return `${days} days`
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 mt-16">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent mb-4">
                            Savings Circles
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Join trusted community savings circles or create your own. Build financial security together.
                        </p>
                    </div>

                    {/* USDC Minting Section */}
                    <div className="mb-8">
                        <USDCMint />
                    </div>

                    {/* USDT Minting Section */}
                    <div className="mb-8">
                        <USDTMint />
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search circles or creators..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 glass-morphism border-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48 glass-morphism border-primary/20">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent className="glass-morphism border-primary/20">
                                    <SelectItem value="all">All Circles</SelectItem>
                                    <SelectItem value="open">Open to Join</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedToken} onValueChange={setSelectedToken}>
                                <SelectTrigger className="w-48 glass-morphism border-primary/20">
                                    <SelectValue placeholder="Filter by token" />
                                </SelectTrigger>
                                <SelectContent className="glass-morphism border-primary/20">
                                    <SelectItem value="all">All Tokens</SelectItem>
                                    {Object.values(SUPPORTED_TOKENS).map((token) => (
                                        <SelectItem key={token.address} value={token.address}>
                                            {token.symbol}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-48 glass-morphism border-primary/20">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="glass-morphism border-primary/20">
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="oldest">Oldest</SelectItem>
                                    <SelectItem value="pool-size">Pool Size</SelectItem>
                                    <SelectItem value="success-rate">Success Rate</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" className="glass-morphism border-primary/30 bg-transparent">
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                            </Button>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-8">
                        <div className="w-full flex justify-between items-center">
                            <TabsList className="glass-morphism border border-primary/20 p-1">
                                <TabsTrigger value="all" className="flex items-center gap-2">
                                    All Circles
                                    <Badge variant="secondary" className="text-xs">{allCircles.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="open" className="flex items-center gap-2">
                                    Open to Join
                                    <Badge variant="secondary" className="text-xs">
                                        {allCircles.filter(c => c.state === CircleState.Open).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="active" className="flex items-center gap-2">
                                    Active
                                    <Badge variant="secondary" className="text-xs">
                                        {allCircles.filter(c => c.state === CircleState.Active).length}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="flex items-center gap-2">
                                    Completed
                                    <Badge variant="secondary" className="text-xs">
                                        {allCircles.filter(c => c.state === CircleState.Completed).length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            <Link href="/create-circle">
                                <Button
                                    size="sm"
                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 neon-glow"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Circle
                                </Button>
                            </Link>
                        </div>

                        <TabsContent value={statusFilter} className="mt-6">
                            {isLoadingCircles ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span className="text-muted-foreground">Loading circles...</span>
                                    </div>
                                </div>
                            ) : circlesError ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <p className="text-red-500 mb-2">Error loading circles</p>
                                        <p className="text-muted-foreground text-sm">{circlesError ? String((circlesError as Error)?.message ?? circlesError) : ""}</p>
                                    </div>
                                </div>
                            ) : allCircles.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-foreground mb-2">No Circles Available Yet</h3>
                                        <p className="text-muted-foreground mb-6">Be the first to create a savings circle and start building financial security with your community.</p>
                                        <Link href="/create-circle">
                                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Circle
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : filteredCircles.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-foreground mb-2">No Circles Found</h3>
                                        <p className="text-muted-foreground mb-6">No circles match your current search and filter criteria.</p>
                                        <Button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setStatusFilter("all");
                                                setSelectedToken("all");
                                            }}
                                            variant="outline"
                                            className="border-primary/30 text-primary hover:bg-primary/10"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredCircles.map((circle) => (
                                        <div key={circle.id}>
                                            <Card className="glass-morphism border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 group cursor-pointer">
                                                <CardHeader className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                                                                {circle.name}
                                                            </h3>
                                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                                                {circle.description}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(circle.state)}
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                                                {circle.creator.slice(2, 4).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-muted-foreground text-sm font-mono">
                                                            {circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}
                                                        </span>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-4 pt-0">
                                                    <div className="space-y-3">
                                                        {/* Membership Progress */}
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-muted-foreground text-sm">Members</span>
                                                                <span className="text-foreground font-medium text-sm">
                                                                    {circle.currentMembers}/{circle.maxMembers}
                                                                </span>
                                                            </div>
                                                            <Progress
                                                                value={getMembershipProgress(circle.currentMembers, circle.maxMembers)}
                                                                className="h-2"
                                                            />
                                                        </div>

                                                        {/* Financial Info */}
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-muted-foreground">Contribution</p>
                                                                <p className="text-primary font-bold">
                                                                    {circle.contributionAmount} {getTokenSymbol(circle.token)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">Current Pool</p>
                                                                <p className="text-foreground font-medium">
                                                                    {(parseFloat(circle.contributionAmount) * circle.currentMembers).toFixed(2)} {getTokenSymbol(circle.token)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Additional Info */}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">{formatPeriod(circle.periodDuration)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                                    <span className="text-muted-foreground">{circle.currentMembers}/{circle.maxMembers}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <Shield className="w-3 h-3 text-primary" />
                                                                <span className="text-primary font-medium">{circle.collateralFactor}x</span>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        {circle.state === CircleState.Open ? (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                                                                    onClick={(e) => handleJoinCircle(e, circle.id, circle.token)}
                                                                    disabled={
                                                                        isPending && currentCircleId === BigInt(circle.id)
                                                                    }
                                                                >
                                                                    {isPending && currentCircleId === BigInt(circle.id) ? (
                                                                        <div className="flex items-center justify-center space-x-2">
                                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                            <span>
                                                                                {isApproving ? "Approving..." :
                                                                                    isJoining ? "Joining..." : "Processing..."}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        "Join Circle"
                                                                    )}
                                                                </Button>
                                                                <Link href={`/circles/${circle.id}`}>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-primary/30 text-primary hover:bg-primary/10 hover:text-white"
                                                                    >
                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                        Details
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        ) : (
                                                            <Link href={`/circles/${circle.id}`}>
                                                                <Button
                                                                    size="sm"
                                                                    className={`w-full ${circle.state === CircleState.Active
                                                                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                                                        : "bg-muted text-muted-foreground"
                                                                        }`}
                                                                    disabled={circle.state === CircleState.Completed}
                                                                >
                                                                    {circle.state === CircleState.Active ? "View Details" : "View History"}
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
                        <Card className="glass-morphism border-primary/20 text-center">
                            <CardContent className="p-6">
                                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">{isLoadingCircles ? "..." : allCircles.length}</div>
                                <div className="text-muted-foreground text-sm">Total Circles</div>
                            </CardContent>
                        </Card>
                        <Card className="glass-morphism border-secondary/20 text-center">
                            <CardContent className="p-6">
                                <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">
                                    {isLoadingCircles ? "..." : allCircles.reduce((sum, circle) => sum + circle.currentMembers, 0)}
                                </div>
                                <div className="text-muted-foreground text-sm">Active Members</div>
                            </CardContent>
                        </Card>
                        <Card className="glass-morphism border-accent/20 text-center">
                            <CardContent className="p-6">
                                <DollarSign className="w-8 h-8 text-accent mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">
                                    {isLoadingCircles ? "..." : `$${allCircles.reduce((sum, circle) => sum + (parseFloat(circle.contributionAmount) * circle.currentMembers), 0).toLocaleString()}`}
                                </div>
                                <div className="text-muted-foreground text-sm">Total Saved</div>
                            </CardContent>
                        </Card>
                        <Card className="glass-morphism border-primary/20 text-center">
                            <CardContent className="p-6">
                                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">
                                    {isLoadingCircles ? "..." : allCircles.length > 0 ? `${Math.round(allCircles.filter(c => c.state === CircleState.Completed).length / allCircles.length * 100)}%` : "0%"}
                                </div>
                                <div className="text-muted-foreground text-sm">Success Rate</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}