import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircleComparison, useCircleComparison } from '../circle-comparison';
import { renderHook, act } from '@testing-library/react';

describe('CircleComparison', () => {
  const mockCircles = [
    {
      id: 1,
      name: 'Circle 1',
      contributionAmount: '100',
      periodDuration: '7 days',
      maxMembers: 10,
      currentMembers: 5,
      collateralFactor: 2,
      insuranceFee: '10',
      state: 0,
      token: 'USDC',
    },
    {
      id: 2,
      name: 'Circle 2',
      contributionAmount: '200',
      periodDuration: '14 days',
      maxMembers: 20,
      currentMembers: 15,
      collateralFactor: 3,
      insuranceFee: '20',
      state: 1,
      token: 'USDT',
    },
  ];

  it('should show empty state when no circles provided', () => {
    render(<CircleComparison circles={[]} />);
    expect(screen.getByText('No Circles Selected')).toBeInTheDocument();
    expect(screen.getByText(/Add circles to compare/i)).toBeInTheDocument();
  });

  it('should render circles for comparison', () => {
    render(<CircleComparison circles={mockCircles} />);
    expect(screen.getByText('Circle 1')).toBeInTheDocument();
    expect(screen.getByText('Circle 2')).toBeInTheDocument();
  });

  it('should display circle count', () => {
    render(<CircleComparison circles={mockCircles} />);
    expect(screen.getByText('2 circles selected')).toBeInTheDocument();
  });

  it('should call onRemove when remove button clicked', () => {
    const onRemove = vi.fn();
    render(<CircleComparison circles={mockCircles} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('should show comparison summary with statistics', () => {
    render(<CircleComparison circles={mockCircles} />);
    expect(screen.getByText('Quick Comparison')).toBeInTheDocument();
    expect(screen.getByText('Lowest Contribution')).toBeInTheDocument();
    expect(screen.getByText('Highest Contribution')).toBeInTheDocument();
  });

  it('should display availability status', () => {
    render(<CircleComparison circles={mockCircles} />);
    const availableTexts = screen.getAllByText('Available to join');
    expect(availableTexts.length).toBeGreaterThan(0);
  });
});

describe('useCircleComparison', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useCircleComparison());
    expect(result.current.selectedCircles).toEqual([]);
  });

  it('should add circle to selection', () => {
    const { result } = renderHook(() => useCircleComparison());

    act(() => {
      result.current.addCircle(1);
    });

    expect(result.current.selectedCircles).toContain(1);
  });

  it('should remove circle from selection', () => {
    const { result } = renderHook(() => useCircleComparison());

    act(() => {
      result.current.addCircle(1);
      result.current.addCircle(2);
    });

    act(() => {
      result.current.removeCircle(1);
    });

    expect(result.current.selectedCircles).not.toContain(1);
    expect(result.current.selectedCircles).toContain(2);
  });

  it('should not allow more than 4 circles', () => {
    const { result } = renderHook(() => useCircleComparison());

    act(() => {
      result.current.addCircle(1);
    });
    act(() => {
      result.current.addCircle(2);
    });
    act(() => {
      result.current.addCircle(3);
    });
    act(() => {
      result.current.addCircle(4);
    });
    act(() => {
      result.current.addCircle(5); // Should not be added
    });

    expect(result.current.selectedCircles).toHaveLength(4);
    expect(result.current.selectedCircles).not.toContain(5);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => useCircleComparison());

    act(() => {
      result.current.addCircle(1);
      result.current.addCircle(2);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.selectedCircles).toEqual([]);
  });

  it('should check if circle is selected', () => {
    const { result } = renderHook(() => useCircleComparison());

    act(() => {
      result.current.addCircle(1);
    });

    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.isSelected(2)).toBe(false);
  });

  it('should track if can add more circles', () => {
    const { result } = renderHook(() => useCircleComparison());

    expect(result.current.canAddMore).toBe(true);

    act(() => {
      result.current.addCircle(1);
    });
    act(() => {
      result.current.addCircle(2);
    });
    act(() => {
      result.current.addCircle(3);
    });
    act(() => {
      result.current.addCircle(4);
    });

    expect(result.current.canAddMore).toBe(false);
  });
});
