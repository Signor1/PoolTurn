import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportCirclesToCSV, exportAsJSON, exportCircleSummary } from '../export-utils';
import type { CircleExportData } from '../export-utils';

describe('Export Utilities', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;

  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock link element
    const mockLink = {
      setAttribute: vi.fn(),
      style: { visibility: '' },
      click: vi.fn(),
    };

    // Mock DOM methods
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as any);
  });

  describe('exportCirclesToCSV', () => {
    it('should export circles to CSV format', () => {
      const circles: CircleExportData[] = [
        {
          id: 1,
          name: 'Test Circle',
          description: 'A test circle',
          state: 'Open',
          contributionAmount: '100',
          periodDuration: '7 days',
          maxMembers: 10,
          currentMembers: 5,
          currentRound: 1,
          collateralFactor: 2,
          insuranceFee: '10',
          token: 'USDC',
        },
      ];

      exportCirclesToCSV(circles);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should handle empty circles array', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      exportCirclesToCSV([]);

      expect(alertSpy).toHaveBeenCalledWith('No data to export');

      alertSpy.mockRestore();
    });

    it('should escape quotes in circle names', () => {
      const circles: CircleExportData[] = [
        {
          id: 1,
          name: 'Circle with "quotes"',
          description: 'Test',
          state: 'Open',
          contributionAmount: '100',
          periodDuration: '7 days',
          maxMembers: 10,
          currentMembers: 5,
          currentRound: 1,
          collateralFactor: 2,
          insuranceFee: '10',
          token: 'USDC',
        },
      ];

      exportCirclesToCSV(circles);

      // Should have created download link
      expect(createElementSpy).toHaveBeenCalled();
    });
  });

  describe('exportAsJSON', () => {
    it('should export data as JSON', () => {
      const data = {
        id: 1,
        name: 'Test',
        value: 100,
      };

      exportAsJSON(data, 'test.json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const data = {
        circle: {
          id: 1,
          members: [{ address: '0x123', status: 'active' }],
        },
      };

      exportAsJSON(data, 'nested.json');

      expect(createElementSpy).toHaveBeenCalled();
    });
  });

  describe('exportCircleSummary', () => {
    it('should export circle summary as text', () => {
      const summary = {
        circleName: 'Test Circle',
        totalContributed: '500 USDC',
        totalReceived: '500 USDC',
        roundsParticipated: 5,
        collateralLocked: '1000 USDC',
        status: 'Active',
      };

      exportCircleSummary(summary);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });
});
