/**
 * Patrol Report Page
 * Displays patrol points report with table preview and PDF generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useServerStatus } from '@/lib/hooks/useServerStatus';
import { getPatrolRecords } from '@/lib/api/patrol';
import { PatrolRecord, FilterOptions } from '@/lib/types';
import { groupByPoint, PointGroups } from '@/lib/utils/data-processor';
import { NavigationDrawer, MenuButton } from '@/components/shared/NavigationDrawer';
import { ServerStatus } from '@/components/shared/ServerStatus';
import { Button } from '@/components/ui/button';
import PatrolPointsTable from '@/components/patrol-report/PatrolPointsTable';
import { feedbackService } from '@/services/feedback';
import { ROUTES } from '@/constants';

export default function PatrolReportPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isServerOnline } = useServerStatus();

  const [records, setRecords] = useState<PatrolRecord[]>([]);
  const [pointGroups, setPointGroups] = useState<PointGroups | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, router]);

  // Initialize default date range (last 7 days)
  useEffect(() => {
    const now = new Date();
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      0,
      0,
      0
    );
    setEndDate(end);
    setStartDate(start);
  }, []);

  // Load data when dates change
  useEffect(() => {
    if (isAuthenticated && startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, isAuthenticated]);

  const loadData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load all records with pagination (API max limit is 100)
      const allRecords: PatrolRecord[] = [];
      let currentPage = 1;
      const pageLimit = 100; // API maximum
      let hasMore = true;

      const loadFilters: FilterOptions = {
        ...filters,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
      };

      while (hasMore) {
        const response = await getPatrolRecords({
          page: currentPage,
          limit: pageLimit,
          ...loadFilters,
        });

        allRecords.push(...response.records);

        // Check if there are more pages
        hasMore = currentPage < (response.total_pages || 1);
        currentPage++;
      }

      setRecords(allRecords);

      // Group by point
      const groups = groupByPoint(allRecords);
      setPointGroups(groups);
    } catch (err: any) {
      let errorMessage = 'Failed to load report data';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail
            .map(
              (e: any) =>
                `${e.loc?.join('.') || 'field'}: ${e.msg || 'validation error'}`
            )
            .join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!pointGroups) return;

    setIsGeneratingPDF(true);
    setError(null);

    try {
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointGroups,
          startDate: startDate?.toISOString() || null,
          endDate: endDate?.toISOString() || null,
        }),
      });

      if (!pdfResponse.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await pdfResponse.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          console.error('PDF generation error details:', errorData);
        } catch (e) {
          console.error('PDF generation failed with status:', pdfResponse.status);
        }
        throw new Error(errorMessage);
      }

      // Print PDF directly without preview
      const blob = await pdfResponse.blob();
      const url = URL.createObjectURL(blob);
      
      // Try opening in a new window first (most reliable for printing only PDF)
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        // Wait for PDF to load, then print
        // Note: PDFs in new windows may not fire load events, so we use a timeout
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            // Clean up after printing dialog
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
              URL.revokeObjectURL(url);
            }, 1000);
          } catch (err) {
            console.error('Print error:', err);
            if (!printWindow.closed) {
              printWindow.close();
            }
            URL.revokeObjectURL(url);
          }
        }, 1000);
      } else {
        // Fallback to iframe if popup is blocked
        const iframe = document.createElement('iframe');
        Object.assign(iframe.style, {
          position: 'absolute',
          width: '1px',
          height: '1px',
          left: '-9999px',
          top: '-9999px',
          border: 'none',
          visibility: 'hidden',
        });
        
        iframe.src = url;
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (err) {
              console.error('Print error:', err);
            } finally {
              setTimeout(() => {
                if (iframe.parentNode) {
                  document.body.removeChild(iframe);
                }
                URL.revokeObjectURL(url);
              }, 1000);
            }
          }, 500);
        };
      }

      feedbackService.showSuccess('PDF report ready for printing');
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      setError(err.message || 'Failed to generate PDF. Please try again.');
      feedbackService.showError('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MenuButton onClick={() => setIsDrawerOpen(true)} />
              <div>
                <h1 className="text-xl font-bold text-foreground">التقرير</h1>
                <p className="text-sm text-muted-foreground">{user.guardName}</p>
              </div>
            </div>
            <ServerStatus isOnline={isServerOnline} />
          </div>

          {/* Date Filters */}
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                Start Date & Time:
              </label>
              <input
                type="datetime-local"
                value={
                  startDate
                    ? startDate.toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-3 py-2 border border-border rounded-md text-sm bg-muted text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                End Date & Time:
              </label>
              <input
                type="datetime-local"
                value={endDate ? endDate.toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-3 py-2 border border-border rounded-md text-sm bg-muted text-foreground"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || !pointGroups || records.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading && !pointGroups ? (
          <div className="space-y-4">
            <div className="h-48 bg-card rounded-lg animate-pulse" />
            <div className="text-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          </div>
        ) : pointGroups ? (
          <div className="table-preview-section">
            <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Report Preview</h2>
              <PatrolPointsTable
                pointGroups={pointGroups}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </div>
        ) : (
          <div className="empty-state bg-card rounded-lg shadow-sm p-8 text-center border border-border">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No data available. Please select date range and load data.
            </p>
          </div>
        )}
      </main>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

