import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PatrolRecord,
  ReportSummary,
  DistributionItem,
} from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { APP_NAME, COMPANY_NAME } from '@/constants';

export async function generatePDFReport(
  records: PatrolRecord[],
  summary: ReportSummary,
  pointDistribution: DistributionItem[],
  guardDistribution: DistributionItem[],
  dateRange?: { start: Date; end: Date }
): Promise<Uint8Array> {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text(APP_NAME, 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Patrol Summary Report', 105, 30, { align: 'center' });

  // Date range
  if (dateRange) {
    doc.setFontSize(10);
    doc.text(
      `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`,
      105,
      40,
      { align: 'center' }
    );
  }

  // Summary section
  let yPos = dateRange ? 50 : 45;
  doc.setFontSize(14);
  doc.text('Summary', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Total Scans: ${summary.totalScans}`, 20, yPos);
  yPos += 7;
  doc.text(`Unique Points: ${summary.uniquePoints}`, 20, yPos);
  yPos += 7;
  doc.text(`Unique Guards: ${summary.uniqueGuards}`, 20, yPos);
  yPos += 15;

  // Point distribution table
  doc.setFontSize(14);
  doc.text('Point Distribution', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Point', 'Count', 'Percentage']],
    body: pointDistribution.map((item) => [
      item.label,
      item.count.toString(),
      `${item.percentage.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243] },
  });

  // Guard distribution table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Guard Distribution', 20, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Guard', 'Count', 'Percentage']],
    body: guardDistribution.map((item) => [
      item.label,
      item.count.toString(),
      `${item.percentage.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${formatDateTime(new Date())}`,
      105,
      285,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }

  return new Uint8Array(doc.output('arraybuffer'));
}

export function calculateReportSummary(records: PatrolRecord[]): ReportSummary {
  const uniquePoints = new Set(records.map((r) => r.point));
  const uniqueGuards = new Set(records.map((r) => r.guardname));

  return {
    totalScans: records.length,
    uniquePoints: uniquePoints.size,
    uniqueGuards: uniqueGuards.size,
  };
}

export function calculatePointDistribution(
  records: PatrolRecord[]
): DistributionItem[] {
  const distribution = new Map<string, number>();

  records.forEach((record) => {
    const count = distribution.get(record.point) || 0;
    distribution.set(record.point, count + 1);
  });

  const total = records.length;
  return Array.from(distribution.entries())
    .map(([label, count]) => ({
      label: `Point ${label}`,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateGuardDistribution(
  records: PatrolRecord[]
): DistributionItem[] {
  const distribution = new Map<string, number>();

  records.forEach((record) => {
    const count = distribution.get(record.guardname) || 0;
    distribution.set(record.guardname, count + 1);
  });

  const total = records.length;
  return Array.from(distribution.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

