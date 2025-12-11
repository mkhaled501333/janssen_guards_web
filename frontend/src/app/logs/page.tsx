'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useServerStatus } from '@/lib/hooks/useServerStatus';
import { getPatrolRecords } from '@/lib/api/patrol';
import { PatrolRecord, FilterOptions } from '@/lib/types';
import { LogCard } from '@/components/logs/LogCard';
import { FilterDialog } from '@/components/logs/FilterDialog';
import { ServerStatus } from '@/components/shared/ServerStatus';
import { NavigationDrawer, MenuButton } from '@/components/shared/NavigationDrawer';
import { Button } from '@/components/ui/button';
import { APP_NAME, ROUTES, PAGINATION_LIMIT } from '@/constants';

export default function LogsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isServerOnline } = useServerStatus();

  const [records, setRecords] = useState<PatrolRecord[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, router]);

  const loadLogs = useCallback(
    async (pageNum: number, reset = false) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getPatrolRecords({
          page: pageNum,
          limit: PAGINATION_LIMIT,
          ...filters,
        });

        if (reset) {
          setRecords(response.records);
        } else {
          setRecords((prev) => [...prev, ...response.records]);
        }

        setHasMore(response.records.length === PAGINATION_LIMIT);
      } catch (err: any) {
        setError(err.message || 'Failed to load patrol logs');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, isAuthenticated]
  );

  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      loadLogs(1, true);
    }
  }, [filters, isAuthenticated]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleRefresh = () => {
    setPage(1);
    loadLogs(1, true);
  };

  const handleLogClick = (record: PatrolRecord) => {
    // TODO: Open detail dialog
    console.log('Log clicked:', record);
  };

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
                <h1 className="text-xl font-bold text-foreground">Patrol Logs</h1>
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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
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
      <main className="flex-1 container mx-auto py-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mx-2 mb-4">
            {error}
          </div>
        )}

        {isLoading && records.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-card rounded-lg mx-2 animate-pulse"
              />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patrol logs found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try changing your filters'
                : 'No logs available yet'}
            </p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {records.map((record) => (
                <LogCard
                  key={record.id}
                  record={record}
                  onClick={handleLogClick}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
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

