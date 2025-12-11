
/**
 * PDF Component for Patrol Points Report
 * Uses @react-pdf/renderer to generate PDF
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { PointGroups } from '@/lib/utils/data-processor';
import { getPointName, normalizePoint } from '@/lib/utils/point-mapper';
import { isDelayedEntry, formatTime, formatDate } from '@/lib/utils/data-processor';
import { PatrolRecord } from '@/lib/types';

// Register Arabic font (fallback to system font if not available)
// Note: User needs to add HacenTunisia.ttf to /public/fonts/
// Font registration happens at module load time (server-side for PDF generation)
let fontRegistered = false;

// Only try to register font if we're in a server context
if (typeof window === 'undefined') {
  try {
    // Use absolute path for server-side font loading
    const path = require('path');
    const fs = require('fs');
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'HacenTunisia.ttf');
    
    // Check if font file exists before trying to register
    if (fs.existsSync(fontPath)) {
      Font.register({
        family: 'HacenTunisia',
        src: fontPath,
      });
      fontRegistered = true;
    } else {
      // Font file doesn't exist, will use fallback font
      console.warn('HacenTunisia font file not found at:', fontPath, '- using Helvetica fallback');
    }
  } catch (error: any) {
    // Font registration failed, will use fallback font
    // This is expected if the font file doesn't exist yet
    console.warn('Could not register HacenTunisia font, using fallback:', error?.message || error);
  }
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 30, // Reduced top padding
    paddingBottom: 85.039,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 7.5,
    direction: 'rtl', // RTL for Arabic
  },
  dateHeader: {
    fontSize: 10,
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: 5,
    width: '100%',
    fontFamily: fontRegistered ? 'HacenTunisia' : 'Helvetica',
  },
  columnsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 3,
    flex: 1,
  },
  column: {
    width: 65,
  },
  header: {
    backgroundColor: '#E5E5E5',
    border: '0.5px solid #000000',
    padding: 0.7,
    fontSize: 7.5,
    textAlign: 'center',
    fontFamily: fontRegistered ? 'HacenTunisia' : 'Helvetica',
    minHeight: 15,
  },
  dataCell: {
    border: '0.5px solid #000000',
    padding: '2px 4px',
    backgroundColor: '#FFFFFF',
    minHeight: 15,
  },
  delayedCell: {
    backgroundColor: '#D3D3D3',
  },
  dataRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 7.5,
    width: '100%',
  },
  guardName: {
    fontFamily: fontRegistered ? 'HacenTunisia' : 'Helvetica',
    flexShrink: 1,
    maxWidth: '60%',
  },
  time: {
    textAlign: 'left',
    fontFamily: fontRegistered ? 'HacenTunisia' : 'Helvetica',
    flexShrink: 0,
    marginLeft: 2,
  },
  delayedTime: {
    color: '#FF0000',
  },
  footer: {
    border: '0.5px solid #000000',
    padding: 0.7,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
    fontFamily: fontRegistered ? 'HacenTunisia' : 'Helvetica',
    minHeight: 15,
  },
});

interface PatrolPointsPDFProps {
  pointGroups: PointGroups;
  startDate: Date | null;
  endDate: Date | null;
}

export default function PatrolPointsPDF({
  pointGroups,
  startDate,
  endDate,
}: PatrolPointsPDFProps) {
  // Generate all 12 points (sorted)
  const allPoints = Array.from({ length: 12 }, (_, i) => String(i + 1));

  // Helper function to format date with time
  const formatDateWithTime = (date: Date | null): string => {
    if (!date) return '';
    const dateStr = formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  };

  // Format date range string
  const getDateRangeText = (): string => {
    if (startDate && endDate) {
      return `من ${formatDateWithTime(startDate)} إلى ${formatDateWithTime(endDate)}`;
    } else if (startDate) {
      return `من ${formatDateWithTime(startDate)}`;
    } else if (endDate) {
      return `إلى ${formatDateWithTime(endDate)}`;
    }
    return '';
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Date Header */}
        <Text style={styles.dateHeader}>
          التاريخ {getDateRangeText()}
        </Text>

        {/* Columns Container */}
        <View style={styles.columnsContainer}>
          {allPoints.map((point) => {
            const normalizedPoint = normalizePoint(point);
            const records = pointGroups[normalizedPoint] || [];
            const pointName = getPointName(normalizedPoint);

            return (
              <View key={point} style={styles.column}>
                {/* Header */}
                <View style={styles.header}>
                  <Text>{pointName}</Text>
                </View>

                {/* Data Rows */}
                {records.map((record, index) => {
                  const delayed = isDelayedEntry(records, index);

                  return (
                    <View
                      key={record.id}
                      style={delayed ? [styles.dataCell, styles.delayedCell] : styles.dataCell}
                    >
                      <View style={styles.dataRow}>
                        <Text style={styles.guardName}>{record.guardname}</Text>
                        <Text
                          style={delayed ? [styles.time, styles.delayedTime] : styles.time}
                        >
                          {formatTime(record.time)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Footer (Count) */}
                <View style={styles.footer}>
                  <Text>{records.length}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}









