import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for circle cards
 * Provides visual feedback while circle data is loading
 */
export function CircleCardSkeleton() {
    return (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
}

/**
 * Loading skeleton for circle details page
 */
export function CircleDetailsSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-6 space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            {/* Progress Section */}
            <div className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </div>

            {/* Members List */}
            <div className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Loading skeleton for dashboard stats
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-6 space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <CircleCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Generic table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-5 w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}
