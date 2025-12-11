'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TOTAL_PATROL_POINTS } from '@/constants';

interface PatrolProgressProps {
  scannedPoints: Set<string>;
}

export function PatrolProgress({ scannedPoints }: PatrolProgressProps) {
  const points = Array.from({ length: TOTAL_PATROL_POINTS }, (_, i) => i + 1);
  const isCompleted = scannedPoints.size === TOTAL_PATROL_POINTS;

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4 mx-2 my-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Patrol Progress</h3>
        {isCompleted && (
          <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            ✓ COMPLETED
          </span>
        )}
      </div>

      {/* Progress Grid */}
      <div className="space-y-4">
        {/* Row 1: Points 1-7 */}
        <div className="flex items-center justify-between">
          {points.slice(0, 7).map((point, index) => (
            <React.Fragment key={point}>
              <PointIndicator
                number={point}
                isScanned={scannedPoints.has(point.toString())}
              />
              {index < 6 && (
                <ConnectionLine
                  isActive={
                    scannedPoints.has(point.toString()) ||
                    scannedPoints.has((point + 1).toString())
                  }
                  isBothScanned={
                    scannedPoints.has(point.toString()) &&
                    scannedPoints.has((point + 1).toString())
                  }
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Row 2: Points 8-12 */}
        <div className="flex items-center justify-between">
          {points.slice(7, 12).map((point, index) => (
            <React.Fragment key={point}>
              <PointIndicator
                number={point}
                isScanned={scannedPoints.has(point.toString())}
              />
              {index < 4 && (
                <ConnectionLine
                  isActive={
                    scannedPoints.has(point.toString()) ||
                    scannedPoints.has((point + 1).toString())
                  }
                  isBothScanned={
                    scannedPoints.has(point.toString()) &&
                    scannedPoints.has((point + 1).toString())
                  }
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Progress Text */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {scannedPoints.size} of {TOTAL_PATROL_POINTS} points scanned
      </div>
    </div>
  );
}

interface PointIndicatorProps {
  number: number;
  isScanned: boolean;
}

function PointIndicator({ number, isScanned }: PointIndicatorProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all',
          isScanned
            ? 'bg-green-500 border-green-600 text-white'
            : 'bg-muted border-border text-muted-foreground'
        )}
      >
        {isScanned ? <Check className="h-5 w-5" /> : number}
      </div>
    </div>
  );
}

interface ConnectionLineProps {
  isActive: boolean;
  isBothScanned: boolean;
}

function ConnectionLine({ isActive, isBothScanned }: ConnectionLineProps) {
  return (
    <div
      className={cn(
        'h-0.5 flex-1 mx-1 transition-all',
        isBothScanned
          ? 'bg-green-500'
          : isActive
          ? 'bg-green-300'
          : 'bg-border'
      )}
    />
  );
}

