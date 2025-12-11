'use client';

import React, { useState, useEffect } from 'react';
import { Filter, MapPin, User, Calendar, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterOptions } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  onClear: () => void;
}

export function FilterDialog({
  open,
  onOpenChange,
  currentFilters,
  onApply,
  onClear,
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  // Update local state when currentFilters change
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, open]);

  const handleApply = () => {
    // Validate date range
    if (filters.startDate && filters.endDate) {
      if (filters.startDate > filters.endDate) {
        alert('Start date must be before or equal to end date');
        return;
      }
    }
    
    onApply(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
    onOpenChange(false);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof FilterOptions] !== undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Filter Records</DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">
                Refine your search by point, guard, or date range
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Patrol Point */}
          <div className="space-y-2">
            <label 
              htmlFor="point" 
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Patrol Point
            </label>
            <Input
              id="point"
              type="text"
              placeholder="e.g., 1, 2, 3..."
              className="h-11 border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              value={filters.point || ''}
              onChange={(e) =>
                setFilters({ ...filters, point: e.target.value })
              }
            />
          </div>

          {/* Guard Name */}
          <div className="space-y-2">
            <label 
              htmlFor="guardName" 
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <User className="h-4 w-4 text-primary" />
              Guard Name
            </label>
            <Input
              id="guardName"
              type="text"
              placeholder="Enter guard name"
              className="h-11 border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              value={filters.guardName || ''}
              onChange={(e) =>
                setFilters({ ...filters, guardName: e.target.value })
              }
            />
          </div>

          {/* Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Calendar className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">
                Date Range
              </label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label 
                  htmlFor="startDate" 
                  className="text-xs font-medium text-muted-foreground"
                >
                  Start Date
                </label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-11 border-border bg-muted text-foreground focus:border-primary focus:ring-primary"
                  value={
                    filters.startDate
                      ? (() => {
                          // Format date as YYYY-MM-DD in local timezone
                          const year = filters.startDate.getFullYear();
                          const month = String(filters.startDate.getMonth() + 1).padStart(2, '0');
                          const day = String(filters.startDate.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      // Parse date string and create date at start of day in local timezone
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
                      setFilters({
                        ...filters,
                        startDate: date,
                      });
                    } else {
                      setFilters({
                        ...filters,
                        startDate: undefined,
                      });
                    }
                  }}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label 
                  htmlFor="endDate" 
                  className="text-xs font-medium text-muted-foreground"
                >
                  End Date
                </label>
                <Input
                  id="endDate"
                  type="date"
                  className="h-11 border-border bg-muted text-foreground focus:border-primary focus:ring-primary"
                  value={
                    filters.endDate
                      ? (() => {
                          // Format date as YYYY-MM-DD in local timezone
                          const year = filters.endDate.getFullYear();
                          const month = String(filters.endDate.getMonth() + 1).padStart(2, '0');
                          const day = String(filters.endDate.getDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })()
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      // Parse date string and create date at end of day in local timezone
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                      setFilters({
                        ...filters,
                        endDate: date,
                      });
                    } else {
                      setFilters({
                        ...filters,
                        endDate: undefined,
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.point && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    Point: {filters.point}
                    <button
                      onClick={() => setFilters({ ...filters, point: undefined })}
                      className="hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.guardName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    Guard: {filters.guardName}
                    <button
                      onClick={() => setFilters({ ...filters, guardName: undefined })}
                      className="hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    From: {filters.startDate.toLocaleDateString()}
                    <button
                      onClick={() => setFilters({ ...filters, startDate: undefined })}
                      className="hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    To: {filters.endDate.toLocaleDateString()}
                    <button
                      onClick={() => setFilters({ ...filters, endDate: undefined })}
                      className="hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4 gap-2 bg-card">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className="flex-1 sm:flex-none border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Clear All
          </Button>
          <Button 
            onClick={handleApply}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

