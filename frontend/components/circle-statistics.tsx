'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    Award,
    Shield,
    Target,
    Clock
} from 'lucide-react';

export interface CircleStats {
    totalCircles: number;
    activeCircles: number;
    completedCircles: number;
    totalContributed: string;
    totalReceived: string;
    successRate: number;
    onTimePaymentRate: number;
    averageCircleSize: number;
    collateralLocked: string;
    insurancePaid: string;
}

interface CircleStatisticsProps {
    stats: CircleStats;
}

/**
 * Circle Statistics Component
 * Displays comprehensive statistics and analytics for user's circle participation
 */
export function CircleStatistics({ stats }: CircleStatisticsProps) {
    const statCards = [
        {
            title: 'Total Contributed',
            value: stats.totalContributed,
            icon: DollarSign,
            description: 'Lifetime contributions',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total Received',
            value: stats.totalReceived,
            icon: TrendingUp,
            description: 'Payouts received',
            color: 'text-green-500',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Active Circles',
            value: stats.activeCircles,
            icon: Activity,
            description: `${stats.totalCircles} total circles`,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Success Rate',
            value: `${stats.successRate}%`,
            icon: Award,
            description: 'On-time payments',
            color: 'text-orange-500',
            bgColor: 'bg-orange-50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                {stat.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Success Rate */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Circle Completion Rate</span>
                            <span className="text-sm font-semibold">{stats.successRate}%</span>
                        </div>
                        <Progress value={stats.successRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.completedCircles} of {stats.totalCircles} circles completed successfully
                        </p>
                    </div>

                    {/* On-time Payment Rate */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">On-Time Payment Rate</span>
                            <span className="text-sm font-semibold">{stats.onTimePaymentRate}%</span>
                        </div>
                        <Progress value={stats.onTimePaymentRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Your payment reliability score
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Collateral Locked</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.collateralLocked}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Security deposit for active circles
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Net Position</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {(parseFloat(stats.totalReceived) - parseFloat(stats.totalContributed)).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Received minus contributed
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium">Insurance Paid</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.insurancePaid}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total insurance fees paid
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Circle Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Circle Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Avg Circle Size</p>
                            <p className="text-2xl font-bold flex items-center gap-1">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                {stats.averageCircleSize}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Active</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.activeCircles}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Completed</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.completedCircles}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total</p>
                            <p className="text-2xl font-bold">
                                {stats.totalCircles}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Compact stats widget for dashboard
 */
export function StatsWidget({ label, value, icon: Icon, trend }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: number; isPositive: boolean };
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
            {trend && (
                <div className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                </div>
            )}
        </div>
    );
}
