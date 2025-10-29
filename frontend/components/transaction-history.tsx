'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    XCircle,
    ExternalLink,
    Download
} from 'lucide-react';
import { formatDistance } from 'date-fns';

export type TransactionType = 'contribution' | 'payout' | 'join' | 'withdrawal' | 'collateral-lock' | 'collateral-return';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: string;
    token: string;
    timestamp: Date;
    status: TransactionStatus;
    txHash?: string;
    circleId?: number;
    circleName?: string;
    round?: number;
    blockNumber?: number;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    onExport?: () => void;
    showCircleInfo?: boolean;
}

/**
 * Transaction History Component
 * Displays a chronological list of all transactions for a user or circle
 */
export function TransactionHistory({
    transactions,
    onExport,
    showCircleInfo = true
}: TransactionHistoryProps) {
    const getTransactionIcon = (type: TransactionType, status: TransactionStatus) => {
        if (status === 'failed') {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
        if (status === 'pending') {
            return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
        }

        switch (type) {
            case 'contribution':
            case 'join':
            case 'collateral-lock':
                return <ArrowUpRight className="w-5 h-5 text-red-500" />;
            case 'payout':
            case 'withdrawal':
            case 'collateral-return':
                return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
            default:
                return <CheckCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTransactionLabel = (type: TransactionType): string => {
        const labels: Record<TransactionType, string> = {
            'contribution': 'Contribution',
            'payout': 'Payout Received',
            'join': 'Joined Circle',
            'withdrawal': 'Withdrawal',
            'collateral-lock': 'Collateral Locked',
            'collateral-return': 'Collateral Returned',
        };
        return labels[type];
    };

    const getStatusBadge = (status: TransactionStatus) => {
        switch (status) {
            case 'confirmed':
                return (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                        Confirmed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Pending
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                        Failed
                    </Badge>
                );
        }
    };

    const getExplorerUrl = (txHash: string) => {
        // Base Mainnet explorer
        return `https://basescan.org/tx/${txHash}`;
    };

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">
                        Your transaction history will appear here
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Transaction History</CardTitle>
                    {onExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {/* Icon */}
                                <div className="flex-shrink-0">
                                    {getTransactionIcon(tx.type, tx.status)}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold">
                                            {getTransactionLabel(tx.type)}
                                        </p>
                                        {getStatusBadge(tx.status)}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {showCircleInfo && tx.circleName && (
                                            <>
                                                <span>{tx.circleName}</span>
                                                {tx.round && <span>• Round {tx.round}</span>}
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>
                                            {formatDistance(tx.timestamp, new Date(), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {tx.txHash && (
                                        <a
                                            href={getExplorerUrl(tx.txHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                        >
                                            View on explorer
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="text-right flex-shrink-0">
                                    <p className={`font-semibold ${
                                        tx.type === 'payout' || tx.type === 'withdrawal' || tx.type === 'collateral-return'
                                            ? 'text-green-600'
                                            : 'text-gray-900'
                                    }`}>
                                        {tx.type === 'payout' || tx.type === 'withdrawal' || tx.type === 'collateral-return' ? '+' : '-'}
                                        {tx.amount} {tx.token}
                                    </p>
                                    {tx.blockNumber && (
                                        <p className="text-xs text-muted-foreground">
                                            Block #{tx.blockNumber.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Compact Transaction List for dashboard widgets
 */
export function TransactionList({ transactions, maxItems = 5 }: {
    transactions: Transaction[];
    maxItems?: number;
}) {
    const recentTransactions = transactions.slice(0, maxItems);

    return (
        <div className="space-y-2">
            {recentTransactions.map((tx) => (
                <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                            <p className="font-medium text-sm">
                                {tx.type === 'contribution' ? 'Contributed' :
                                 tx.type === 'payout' ? 'Received' :
                                 tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistance(tx.timestamp, new Date(), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <p className={`font-semibold text-sm ${
                        tx.type === 'payout' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                        {tx.type === 'payout' ? '+' : '-'}{tx.amount}
                    </p>
                </div>
            ))}
        </div>
    );
}
