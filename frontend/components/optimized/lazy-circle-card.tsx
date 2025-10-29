'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { CircleCardSkeleton } from '../loading-skeleton';

/**
 * Optimized Circle Card Component
 * - Memoized to prevent unnecessary re-renders
 * - Can be lazy loaded for better initial page load
 */

interface CircleCardProps {
  id: number;
  name: string;
  description: string;
  contributionAmount: string;
  currentMembers: number;
  maxMembers: number;
  state: number;
  onJoin?: () => void;
}

function CircleCardComponent({
  id,
  name,
  description,
  contributionAmount,
  currentMembers,
  maxMembers,
  state,
  onJoin,
}: CircleCardProps) {
  // Component implementation would go here
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <span>{contributionAmount}</span>
        <span>{currentMembers}/{maxMembers}</span>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const CircleCard = memo(CircleCardComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.currentMembers === nextProps.currentMembers &&
    prevProps.state === nextProps.state
  );
});

// Optional: Create lazy-loaded version
export const LazyCircleCard = dynamic(() => Promise.resolve(CircleCard), {
  loading: () => <CircleCardSkeleton />,
  ssr: false,
});

CircleCard.displayName = 'CircleCard';
