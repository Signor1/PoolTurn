'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, AlertCircle } from 'lucide-react';

interface CircleComparisonProps {
    circles: Array<{
        id: number;
        name: string;
        contributionAmount: string;
        periodDuration: string;
        maxMembers: number;
        currentMembers: number;
        collateralFactor: number;
        insuranceFee: string;
        state: number;
        token: string;
    }>;
    onRemove?: (circleId: number) => void;
}

/**
 * Circle Comparison Component
 * Allows users to compare multiple circles side by side
 */
export function CircleComparison({ circles, onRemove }: CircleComparisonProps) {
    if (circles.length === 0) {
        return (
            <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Circles Selected</h3>
                <p className="text-muted-foreground">
                    Add circles to compare their features side by side
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Compare Circles</h2>
                <p className="text-sm text-muted-foreground">
                    {circles.length} circle{circles.length !== 1 ? 's' : ''} selected
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {circles.map((circle) => (
                    <Card key={circle.id} className="relative">
                        {onRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => onRemove(circle.id)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}

                        <CardHeader>
                            <CardTitle className="pr-8">{circle.name}</CardTitle>
                            <Badge variant={circle.state === 0 ? 'default' : 'secondary'}>
                                {circle.state === 0 ? 'Open' : circle.state === 1 ? 'Active' : 'Completed'}
                            </Badge>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Contribution Amount */}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Contribution</span>
                                <span className="font-semibold">{circle.contributionAmount}</span>
                            </div>

                            {/* Period */}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Period</span>
                                <span className="font-semibold">{circle.periodDuration}</span>
                            </div>

                            {/* Members */}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Members</span>
                                <span className="font-semibold">
                                    {circle.currentMembers} / {circle.maxMembers}
                                </span>
                            </div>

                            {/* Collateral */}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Collateral</span>
                                <span className="font-semibold">{circle.collateralFactor}x</span>
                            </div>

                            {/* Insurance Fee */}
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Insurance</span>
                                <span className="font-semibold">{circle.insuranceFee}</span>
                            </div>

                            {/* Availability */}
                            <div className="flex items-center gap-2 pt-2">
                                {circle.currentMembers < circle.maxMembers ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-600">Available to join</span>
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-600">Full</span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Comparison Summary */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Lowest Contribution</p>
                            <p className="font-semibold">
                                {Math.min(...circles.map(c => parseFloat(c.contributionAmount))).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Highest Contribution</p>
                            <p className="font-semibold">
                                {Math.max(...circles.map(c => parseFloat(c.contributionAmount))).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Most Members</p>
                            <p className="font-semibold">
                                {Math.max(...circles.map(c => c.maxMembers))} members
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Available Circles</p>
                            <p className="font-semibold">
                                {circles.filter(c => c.currentMembers < c.maxMembers).length} / {circles.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Hook for managing circle comparison
 */
export function useCircleComparison() {
    const [selectedCircles, setSelectedCircles] = useState<number[]>([]);

    const addCircle = (circleId: number) => {
        if (!selectedCircles.includes(circleId) && selectedCircles.length < 4) {
            setSelectedCircles([...selectedCircles, circleId]);
        }
    };

    const removeCircle = (circleId: number) => {
        setSelectedCircles(selectedCircles.filter(id => id !== circleId));
    };

    const clearAll = () => {
        setSelectedCircles([]);
    };

    const isSelected = (circleId: number) => {
        return selectedCircles.includes(circleId);
    };

    return {
        selectedCircles,
        addCircle,
        removeCircle,
        clearAll,
        isSelected,
        canAddMore: selectedCircles.length < 4,
    };
}
