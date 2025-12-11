'use client';

import React from 'react';
import { QrCode, MapPin, Users } from 'lucide-react';
import { ReportSummary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  summary: ReportSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <QrCode className="h-12 w-12 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{summary.totalScans}</div>
            <div className="text-sm text-muted-foreground">Total Scans</div>
          </div>

          <div className="text-center">
            <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{summary.uniquePoints}</div>
            <div className="text-sm text-muted-foreground">Unique Points</div>
          </div>

          <div className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{summary.uniqueGuards}</div>
            <div className="text-sm text-muted-foreground">Unique Guards</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

