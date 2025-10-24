"use client"

import { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { useUserCircles } from "@/hooks/useCircleQueries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Users,
  DollarSign,
  Plus,
  Eye,
  TrendingUp,
  Award,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function MyCirclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { address, isConnected } = useAccount()
  const { circles: userCircles, isLoading, error } = useUserCircles(address)

  // Filter circles based on search and status
  const filteredCircles = userCircles.filter(circle => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         circle.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "open" && circle.state === 0) ||
                         (statusFilter === "active" && circle.state === 1) ||
                         (statusFilter === "completed" && circle.state === 2)
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (state: number) => {
    switch (state) {
      case 0: return <Badge className="bg-yellow-500/20 text-yellow-400">Open</Badge>;
      case 1: return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case 2: return <Badge className="bg-blue-500/20 text-blue-400">Completed</Badge>;
      case 3: return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatPeriod = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    if (days === 7) return "Weekly";
    if (days === 14) return "Bi-weekly";
    if (days === 30) return "Monthly";
    return `${days} days`;
  };

  // Calculate user statistics from real contract data
  const userStats = useMemo(() => {
    const totalCreated = userCircles.length;
    const activeCircles = userCircles.filter(c => c.state === 1);
    const completedCircles = userCircles.filter(c => c.state === 2);
    const openCircles = userCircles.filter(c => c.state === 0);

    // Calculate total contributions made (across all active/completed circles)
    const totalContributed = userCircles.reduce((sum, circle) => {
      if (circle.state === 1 || circle.state === 2) { // Active or completed
        // For active circles: estimate as (currentRound - 1) since current round might not be contributed yet
        // For completed circles: assume all rounds contributed (maxMembers)
        const contributedRounds = circle.state === 2
          ? circle.maxMembers  // Completed: all rounds
          : Math.max(0, circle.currentRound - 1); // Active: previous rounds only
        return sum + (parseFloat(circle.contributionAmount) * contributedRounds);
      }
      return sum;
    }, 0);

    // Calculate total potential saved (what user will receive when circles complete)
    const totalPotentialSaved = userCircles.reduce((sum, circle) => {
      if (circle.state === 1) { // Only active circles
        // Potential payout = contributionAmount * maxMembers
        return sum + (parseFloat(circle.contributionAmount) * circle.maxMembers);
      }
      return sum;
    }, 0);

    // Calculate total members across all created circles
    const totalMembersRecruited = userCircles.reduce((sum, circle) => {
      return sum + circle.currentMembers;
    }, 0);

    return {
      totalCreated,
      active: activeCircles.length,
      completed: completedCircles.length,
      open: openCircles.length,
      totalContributed,
      totalPotentialSaved,
      totalMembersRecruited,
      // Success rate (completed / (completed + cancelled))
      successRate: totalCreated > 0 ? (completedCircles.length / totalCreated) * 100 : 0
    };
  }, [userCircles]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">Please connect your wallet to view your circles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Circles</h2>
          <p className="text-slate-400 mb-6">Unable to load your circles. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Circles
            </h1>
            <p className="text-slate-400 text-lg">
              Manage your savings circles and track your financial progress.
            </p>
          </div>

          <Link href="/create-circle">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Circle
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userStats.totalCreated}</div>
              <div className="text-slate-400 text-sm">Circles Created</div>
              <div className="text-xs text-slate-500 mt-1">
                {userStats.open} open • {userStats.active} active • {userStats.completed} completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userStats.totalMembersRecruited}</div>
              <div className="text-slate-400 text-sm">Members Recruited</div>
              <div className="text-xs text-slate-500 mt-1">
                Across all your circles
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${userStats.totalContributed.toFixed(2)}</div>
              <div className="text-slate-400 text-sm">Total Contributed</div>
              <div className="text-xs text-slate-500 mt-1">
                Your contributions made
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${userStats.totalPotentialSaved.toFixed(2)}</div>
              <div className="text-slate-400 text-sm">Potential Savings</div>
              <div className="text-xs text-slate-500 mt-1">
                From active circles
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search circles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
              className={statusFilter === "all" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "open" ? "default" : "outline"}
              onClick={() => setStatusFilter("open")}
              size="sm"
              className={statusFilter === "open" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              Open
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
              className={statusFilter === "active" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              size="sm"
              className={statusFilter === "completed" ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Circles Grid */}
        {userCircles.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Circles Created Yet</h3>
              <p className="text-slate-400 mb-6">You haven't created any savings circles yet. Start your first circle to begin your savings journey!</p>
              <Link href="/create-circle">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Circle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredCircles.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Circles Found</h3>
              <p className="text-slate-400 mb-6">No circles match your current search and filter criteria.</p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCircles.map((circle) => (
              <Card key={circle.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">{circle.name}</CardTitle>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">{circle.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Creator</Badge>
                        {getStatusBadge(circle.state)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Members</p>
                      <p className="text-white font-semibold">{circle.currentMembers}/{circle.maxMembers}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Contribution</p>
                      <p className="text-white font-semibold">{circle.contributionAmount} USDC</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Period</p>
                      <p className="text-white font-semibold">{formatPeriod(circle.periodDuration)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Round</p>
                      <p className="text-white font-semibold">{circle.currentRound}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Circle Progress</span>
                      <span className="text-white font-medium text-sm">
                        {Math.round((circle.currentMembers / circle.maxMembers) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(circle.currentMembers / circle.maxMembers) * 100}
                      className="h-2"
                    />
                  </div>

                  <Link href={`/circles/${circle.id}`} className="block">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}