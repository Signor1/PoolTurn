import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CircleCardSkeleton,
  CircleDetailsSkeleton,
  DashboardSkeleton,
  TableSkeleton,
} from '../loading-skeleton';

describe('Loading Skeletons', () => {
  describe('CircleCardSkeleton', () => {
    it('should render circle card skeleton', () => {
      const { container } = render(<CircleCardSkeleton />);
      expect(container.querySelector('.border')).toBeInTheDocument();
    });
  });

  describe('CircleDetailsSkeleton', () => {
    it('should render circle details skeleton', () => {
      const { container } = render(<CircleDetailsSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('DashboardSkeleton', () => {
    it('should render dashboard skeleton with multiple sections', () => {
      const { container } = render(<DashboardSkeleton />);
      // Should have grid layout for stats
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('TableSkeleton', () => {
    it('should render table skeleton with default rows and columns', () => {
      const { container } = render(<TableSkeleton />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      // Default is 5 rows + 1 header = 6 total, with 4 columns each = 24 elements
      expect(skeletons.length).toBeGreaterThan(20);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<TableSkeleton rows={3} columns={2} />);
      const grids = container.querySelectorAll('.grid');
      // Should have header + 3 data rows = 4 grids
      expect(grids.length).toBe(4);
    });
  });
});
