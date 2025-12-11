'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Printer, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useServerStatus } from '@/lib/hooks/useServerStatus';
import { getPatrolRecords } from '@/lib/api/patrol';
import { PatrolRecord, FilterOptions } from '@/lib/types';
import { SummaryCard } from '@/components/reports/SummaryCard';
import { DistributionCard } from '@/components/reports/DistributionCard';
import { FilterDialog } from '@/components/logs/FilterDialog';
import { ServerStatus } from '@/components/shared/ServerStatus';
import { NavigationDrawer, MenuButton } from '@/components/shared/NavigationDrawer';
import { Button } from '@/components/ui/button';
import {
  generatePDFReport,
  calculateReportSummary,
  calculatePointDistribution,
  calculateGuardDistribution,
} from '@/services/pdfGenerator';
import { feedbackService } from '@/services/feedback';
import { APP_NAME, ROUTES } from '@/constants';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isServerOnline } = useServerStatus();

  const [records, setRecords] = useState<PatrolRecord[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, router]);

  const loadReportData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load all records with pagination (API max limit is 100)
      const allRecords: PatrolRecord[] = [];
      let currentPage = 1;
      const pageLimit = 100; // API maximum
      let hasMore = true;

      while (hasMore) {
        const response = await getPatrolRecords({
          page: currentPage,
          limit: pageLimit,
          ...filters,
        });

        allRecords.push(...response.records);
        
        // Check if there are more pages
        hasMore = currentPage < (response.total_pages || 1);
        currentPage++;
      }

      setRecords(allRecords);
    } catch (err: any) {
      // Extract error message from validation errors if available
      let errorMessage = 'Failed to load report data';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => 
            `${e.loc?.join('.') || 'field'}: ${e.msg || 'validation error'}`
          ).join(', ');
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

  useEffect(() => {
    if (isAuthenticated) {
      loadReportData();
    }
  }, [filters, isAuthenticated]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const summary = calculateReportSummary(records);
      const pointDistribution = calculatePointDistribution(records);
      const guardDistribution = calculateGuardDistribution(records);

      const dateRange = filters.startDate && filters.endDate
        ? { start: filters.startDate, end: filters.endDate }
        : undefined;

      const pdfData = await generatePDFReport(
        records,
        summary,
        pointDistribution,
        guardDistribution,
        dateRange
      );

      // Print PDF instead of downloading
      // TypeScript requires explicit type assertion for Uint8Array to BlobPart
      const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 100);
      };

      feedbackService.showSuccess('PDF report ready for printing');
    } catch (err: any) {
      feedbackService.showError('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const summary = calculateReportSummary(records);
  const pointDistribution = calculatePointDistribution(records);
  const guardDistribution = calculateGuardDistribution(records);

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof FilterOptions] !== undefined
  );

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
                <h1 className="text-xl font-bold text-foreground">Reports</h1>
                <p className="text-sm text-muted-foreground">{user.guardName}</p>
              </div>
            </div>
            <ServerStatus isOnline={isServerOnline} />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || records.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Print PDF'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadReportData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="bg-primary/10 border-b border-border px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Active Filters:
              </span>
              {filters.point && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">
                  Point: {filters.point}
                </span>
              )}
              {filters.guardName && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">
                  Guard: {filters.guardName}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-primary hover:text-primary/80"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <SummaryCard summary={summary} />
            <DistributionCard
              title="Point Distribution"
              data={pointDistribution}
            />
            <DistributionCard
              title="Guard Distribution"
              data={guardDistribution}
            />
          </>
        )}
      </main>

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        currentFilters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

