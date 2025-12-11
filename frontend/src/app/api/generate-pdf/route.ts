/**
 * API Route for PDF Generation
 * Generates PDF using @react-pdf/renderer
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import React from 'react';
import { PointGroups } from '@/lib/utils/data-processor';

// Dynamic import to avoid issues with server-side rendering
async function getPDFComponent() {
  const { default: PatrolPointsPDF } = await import('@/components/pdf/PatrolPointsPDF');
  return PatrolPointsPDF;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { pointGroups, startDate, endDate } = data as {
      pointGroups: PointGroups;
      startDate: string | null;
      endDate: string | null;
    };

    // Validate data
    if (!pointGroups) {
      return NextResponse.json(
        { error: 'Missing pointGroups data' },
        { status: 400 }
      );
    }

    // Dynamically import the PDF component
    const PatrolPointsPDF = await getPDFComponent();

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PatrolPointsPDF, {
        pointGroups,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }) as React.ReactElement<DocumentProps>
    );

    // Convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);

    // Return PDF with inline disposition for preview (not attachment)
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="patrol-report.pdf"',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error.message || String(error),
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

