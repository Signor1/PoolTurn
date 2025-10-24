'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Shield,
  DollarSign,
  Settings,
  Plus,
  Wallet,
  Trophy,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { SUPPORTED_TOKENS } from '@/lib/config';
import { useUserCircles } from '@/hooks/useCircleQueries';
import { formatUnits } from 'viem';


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { address, isConnected } = useAccount();
  const { circles: userCircles, isLoading, error } = useUserCircles(address);

  // Calculate user statistics from real data
  const activeCircles = userCircles.filter(circle => circle.state === 1).length; // Active state
  const completedCircles = userCircles.filter(circle => circle.state === 2).length; // Completed state
  const totalSaved = userCircles.reduce((sum, circle) => {
    if (circle.state === 2) { // Only count completed circles
      return sum + (parseFloat(circle.contributionAmount) * circle.currentMembers);
    }
    return sum;
  }, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Wallet className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">Please connect your wallet to view your dashboard</p>
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

  const getStatusBadge = (state: number) => {
    switch (state) {
      case 0:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Open</Badge>;
      case 1:
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
      case 2:
        return <Badge className="bg-blue-500/20 text-blue-400">Completed</Badge>;
      case 3:
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTokenAmount = (amount: string, decimals: number = 6) => {
    const value = parseFloat(amount);
    return value.toFixed(decimals <= 6 ? 2 : 6);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              Welcome back, {formatAddress(address || '')}! Here's your savings overview.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Link href="/create-circle">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Circle
              </Button>
            </Link>
          </div>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">${formatTokenAmount(totalSaved.toString())}</div>
              <div className="text-slate-400 text-sm">Total Saved</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{activeCircles}</div>
              <div className="text-slate-400 text-sm">Active Circles</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userCircles.length}</div>
              <div className="text-slate-400 text-sm">Total Circles</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{completedCircles}</div>
              <div className="text-slate-400 text-sm">Completed Circles</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="circles" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">My Circles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats Card */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Circle Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Open Circles</span>
                      <span className="text-white font-semibold">{userCircles.filter(c => c.state === 0).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Active Circles</span>
                      <span className="text-white font-semibold">{activeCircles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Completed Circles</span>
                      <span className="text-white font-semibold">{completedCircles}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Summary */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-400" />
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Value Saved</span>
                      <span className="text-white font-semibold">${formatTokenAmount(totalSaved.toString())} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Circles Created</span>
                      <span className="text-white font-semibold">{userCircles.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Wallet Address</span>
                      <span className="text-white font-mono text-sm">
                        {formatAddress(address || '')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* My Circles Tab */}
          <TabsContent value="circles" className="space-y-6">
            {userCircles.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Circles Yet</h3>
                  <p className="text-slate-400 mb-6">You haven't created any circles yet. Start your first savings circle to begin your journey!</p>
                  <Link href="/create-circle">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Circle
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userCircles.map((circle) => (
                  <Card key={circle.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">{circle.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              Creator
                            </Badge>
                            {getStatusBadge(circle.state)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Members</p>
                          <p className="text-white font-semibold">{circle.currentMembers} of {circle.maxMembers}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Contribution</p>
                          <p className="text-white font-semibold">{circle.contributionAmount} USDC</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Collateral Factor</p>
                          <p className="text-white font-semibold">{circle.collateralFactor}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Current Round</p>
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

                      <Link href={`/circles/${circle.id}`} className="block mt-4">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

