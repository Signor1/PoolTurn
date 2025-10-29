/**
 * Utility functions for exporting circle data
 */

export interface CircleExportData {
    id: number;
    name: string;
    description: string;
    state: string;
    contributionAmount: string;
    periodDuration: string;
    maxMembers: number;
    currentMembers: number;
    currentRound: number;
    collateralFactor: number;
    insuranceFee: string;
    token: string;
}

/**
 * Convert circle data to CSV format
 */
export function exportCirclesToCSV(circles: CircleExportData[]): void {
    if (circles.length === 0) {
        alert('No data to export');
        return;
    }

    // Define CSV headers
    const headers = [
        'Circle ID',
        'Name',
        'Description',
        'Status',
        'Contribution Amount',
        'Period Duration',
        'Max Members',
        'Current Members',
        'Current Round',
        'Collateral Factor',
        'Insurance Fee',
        'Token',
    ];

    // Convert data to CSV rows
    const rows = circles.map(circle => [
        circle.id,
        `"${circle.name.replace(/"/g, '""')}"`, // Escape quotes in names
        `"${circle.description.replace(/"/g, '""')}"`,
        circle.state,
        circle.contributionAmount,
        circle.periodDuration,
        circle.maxMembers,
        circle.currentMembers,
        circle.currentRound,
        circle.collateralFactor,
        circle.insuranceFee,
        circle.token,
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n');

    // Create and trigger download
    downloadCSV(csvContent, `circles-export-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export member participation data to CSV
 */
export function exportMemberDataToCSV(data: {
    circleName: string;
    contributions: Array<{
        round: number;
        amount: string;
        date: string;
        status: string;
    }>;
}): void {
    const headers = ['Round', 'Amount', 'Date', 'Status'];

    const rows = data.contributions.map(c => [
        c.round,
        c.amount,
        c.date,
        c.status,
    ]);

    const csvContent = [
        `Circle: ${data.circleName}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n');

    downloadCSV(
        csvContent,
        `${data.circleName.replace(/\s+/g, '-')}-contributions-${new Date().toISOString().split('T')[0]}.csv`
    );
}

/**
 * Export circle summary report
 */
export function exportCircleSummary(summary: {
    circleName: string;
    totalContributed: string;
    totalReceived: string;
    roundsParticipated: number;
    collateralLocked: string;
    status: string;
}): void {
    const content = `
Circle Summary Report
Generated: ${new Date().toLocaleString()}

Circle Name: ${summary.circleName}
Status: ${summary.status}

Financial Summary:
- Total Contributed: ${summary.totalContributed}
- Total Received: ${summary.totalReceived}
- Collateral Locked: ${summary.collateralLocked}

Participation:
- Rounds Participated: ${summary.roundsParticipated}
    `.trim();

    downloadText(
        content,
        `${summary.circleName.replace(/\s+/g, '-')}-summary-${new Date().toISOString().split('T')[0]}.txt`
    );
}

/**
 * Helper function to trigger CSV download
 */
function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
}

/**
 * Helper function to trigger text file download
 */
function downloadText(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    triggerDownload(blob, filename);
}

/**
 * Generic download trigger
 */
function triggerDownload(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export data as JSON
 */
export function exportAsJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    triggerDownload(blob, filename);
}
