/**
 * PDF Preview Component
 * Displays PDF in browser with print/download/share options
 */

'use client';

import React from 'react';
import { Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './PDFPreview.module.css';

interface PDFPreviewProps {
  pdfUrl: string;
  title: string;
  onDownload?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

export default function PDFPreview({
  pdfUrl,
  title,
  onDownload,
  onShare,
  onClose,
}: PDFPreviewProps) {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default download handler
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.click();
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // Default share handler
    if ('share' in navigator) {
      try {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], `${title}.pdf`, {
          type: 'application/pdf',
        });

        await navigator.share({
          title: title,
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to download
        handleDownload();
      }
    } else {
      // Fallback: copy link to clipboard
      const nav = navigator as Navigator & { clipboard?: Clipboard };
      if (nav.clipboard) {
        try {
          await nav.clipboard.writeText(pdfUrl);
          alert('PDF URL copied to clipboard');
        } catch (error) {
          console.error('Error copying to clipboard:', error);
          handleDownload();
        }
      } else {
        // Final fallback: download
        handleDownload();
      }
    }
  };

  return (
    <div className={styles.pdfPreviewContainer}>
      {/* Header with actions */}
      <div className={styles.pdfPreviewHeader}>
        <h2>{title}</h2>
        <div className={styles.pdfActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className={styles.actionButton}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {'share' in navigator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className={styles.actionButton}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={styles.actionButton}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* PDF Embed */}
      <div className={styles.pdfViewerWrapper}>
        <iframe
          src={pdfUrl}
          className={styles.pdfIframe}
          title={title}
        />
      </div>
    </div>
  );
}

