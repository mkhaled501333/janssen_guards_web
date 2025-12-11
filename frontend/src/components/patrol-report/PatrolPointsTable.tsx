/**
 * Table Preview Component for Patrol Points Report
 * Displays the report data in a table format matching the PDF layout
 */

'use client';

import React from 'react';
import { PointGroups } from '@/lib/utils/data-processor';
import { getPointName, normalizePoint } from '@/lib/utils/point-mapper';
import { isDelayedEntry, formatTime, formatDate } from '@/lib/utils/data-processor';
import { PatrolRecord } from '@/lib/types';
import styles from './PatrolPointsTable.module.css';

interface PatrolPointsTableProps {
  pointGroups: PointGroups;
  startDate: Date | null;
  endDate: Date | null;
}

export default function PatrolPointsTable({
  pointGroups,
  startDate,
  endDate,
}: PatrolPointsTableProps) {
  // Generate all 12 points (sorted)
  const allPoints = Array.from({ length: 12 }, (_, i) => String(i + 1));

  return (
    <div className={styles.reportTable} dir="rtl">
      {/* Date Header */}
      <div className={styles.dateHeader}>
        التاريخ {formatDate(startDate)}
      </div>

      {/* Table Container - Horizontal Scroll */}
      <div className={styles.tableContainer}>
        <div className={styles.columnsWrapper}>
          {allPoints.map((point) => {
            const normalizedPoint = normalizePoint(point);
            const records = pointGroups[normalizedPoint] || [];
            const pointName = getPointName(normalizedPoint);

            return (
              <div key={point} className={styles.pointColumn}>
                {/* Header */}
                <div className={styles.pointHeader}>{pointName}</div>

                {/* Data Rows */}
                <div className={styles.dataRows}>
                  {records.map((record, index) => {
                    const delayed = isDelayedEntry(records, index);

                    return (
                      <div
                        key={record.id}
                        className={`${styles.dataCell} ${
                          delayed ? styles.delayed : ''
                        }`}
                      >
                        <div className={styles.dataRow}>
                          <span className={styles.guardName}>
                            {record.guardname}
                          </span><span
                            className={`${styles.time} ${
                              delayed ? styles.delayedText : ''
                            }`}
                          >
                            {formatTime(record.time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer (Count) */}
                <div className={styles.pointFooter}>{records.length}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

