/**
 * Data processing utilities for patrol records
 */

import { PatrolRecord } from '@/lib/types';
import { normalizePoint } from './point-mapper';

export interface PointGroups {
  [pointNumber: string]: PatrolRecord[];
}

/**
 * Group patrol records by point number
 * Ensures all 12 points exist (empty arrays for points with no data)
 */
export function groupByPoint(records: PatrolRecord[]): PointGroups {
  const groups: PointGroups = {};

  // Initialize all 12 points
  for (let i = 1; i <= 12; i++) {
    groups[i.toString()] = [];
  }

  // Group records
  records.forEach((record) => {
    const normalizedPoint = normalizePoint(record.point);
    if (groups[normalizedPoint]) {
      groups[normalizedPoint].push(record);
    }
  });

  // Sort each group by time (ascending - oldest first)
  Object.keys(groups).forEach((point) => {
    groups[point].sort((a, b) => a.time - b.time);
  });

  return groups;
}

/**
 * Check if an entry is delayed (>100 minutes from previous entry)
 */
export function isDelayedEntry(records: PatrolRecord[], index: number): boolean {
  if (index === 0) return false;

  const currentTime = records[index].time;
  const prevTime = records[index - 1].time;
  const diffMinutes = (currentTime - prevTime) / 60;

  return diffMinutes > 100;
}

/**
 * Format timestamp to HH:mm format
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date to yyyy/MM/dd format
 */
export function formatDate(date: Date | null): string {
  if (!date) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

