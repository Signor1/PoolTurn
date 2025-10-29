'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Reminder {
    circleId: number;
    circleName: string;
    roundNumber: number;
    dueDate: Date;
    contributionAmount: string;
    status: 'upcoming' | 'due-soon' | 'overdue' | 'paid';
}

interface ContributionRemindersProps {
    reminders: Reminder[];
    onDismiss?: (circleId: number) => void;
}

/**
 * Contribution Reminders Component
 * Displays upcoming contribution reminders for active circles
 */
export function ContributionReminders({ reminders, onDismiss }: ContributionRemindersProps) {
    const [sortedReminders, setSortedReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        // Sort by due date, overdue first
        const sorted = [...reminders].sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            return a.dueDate.getTime() - b.dueDate.getTime();
        });
        setSortedReminders(sorted);
    }, [reminders]);

    const getStatusBadge = (status: Reminder['status']) => {
        switch (status) {
            case 'overdue':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                    </Badge>
                );
            case 'due-soon':
                return (
                    <Badge variant="default" className="flex items-center gap-1 bg-orange-500">
                        <Clock className="w-3 h-3" />
                        Due Soon
                    </Badge>
                );
            case 'upcoming':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Upcoming
                    </Badge>
                );
            case 'paid':
                return (
                    <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Paid
                    </Badge>
                );
        }
    };

    const formatTimeUntilDue = (dueDate: Date): string => {
        const now = new Date();
        const diff = dueDate.getTime() - now.getTime();

        if (diff < 0) {
            const daysOverdue = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
            return `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `in ${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return 'Due very soon';
        }
    };

    const overdueCount = sortedReminders.filter(r => r.status === 'overdue').length;
    const dueSoonCount = sortedReminders.filter(r => r.status === 'due-soon').length;

    if (sortedReminders.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">No pending contributions</p>
                    <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Contribution Reminders
                    </CardTitle>
                    <div className="flex gap-2">
                        {overdueCount > 0 && (
                            <Badge variant="destructive">{overdueCount} overdue</Badge>
                        )}
                        {dueSoonCount > 0 && (
                            <Badge className="bg-orange-500">{dueSoonCount} due soon</Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sortedReminders.map((reminder) => (
                        <div
                            key={`${reminder.circleId}-${reminder.roundNumber}`}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                reminder.status === 'overdue'
                                    ? 'border-red-200 bg-red-50/50'
                                    : reminder.status === 'due-soon'
                                    ? 'border-orange-200 bg-orange-50/50'
                                    : 'border-gray-200'
                            }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{reminder.circleName}</h4>
                                    {getStatusBadge(reminder.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Round {reminder.roundNumber} • {reminder.contributionAmount}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {reminder.status === 'paid'
                                        ? 'Contribution completed'
                                        : formatTimeUntilDue(reminder.dueDate)
                                    }
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {reminder.status !== 'paid' && (
                                    <Link href={`/circles/${reminder.circleId}`}>
                                        <Button size="sm">
                                            Pay Now
                                        </Button>
                                    </Link>
                                )}
                                {onDismiss && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onDismiss(reminder.circleId)}
                                    >
                                        Dismiss
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Hook for calculating reminder status based on due date
 */
export function calculateReminderStatus(dueDate: Date, isPaid: boolean): Reminder['status'] {
    if (isPaid) return 'paid';

    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hoursUntilDue = diff / (1000 * 60 * 60);

    if (diff < 0) return 'overdue';
    if (hoursUntilDue < 48) return 'due-soon';
    return 'upcoming';
}

/**
 * Hook for browser notifications
 */
export function useContributionNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        }
        return false;
    };

    const sendNotification = (title: string, body: string) => {
        if (permission === 'granted' && 'Notification' in window) {
            new Notification(title, {
                body,
                icon: '/icon.png',
                badge: '/badge.png',
            });
        }
    };

    return {
        permission,
        requestPermission,
        sendNotification,
        isSupported: 'Notification' in window,
    };
}
