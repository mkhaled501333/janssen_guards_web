'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, WifiOff, ImageOff } from 'lucide-react';
import { PatrolRecord } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { getPatrolImage } from '@/lib/api/patrol';

interface LogCardProps {
  record: PatrolRecord;
  onClick: (record: PatrolRecord) => void;
}

export function LogCard({ record, onClick }: LogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'not-found' | null>(null);

  useEffect(() => {
    // Clean up blob URL when component unmounts or image changes
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Fetch image when expanding (only if not already loaded and not currently loading)
    if (newExpanded && record.imageid && !imageUrl && !isLoadingImage) {
      setIsLoadingImage(true);
      setImageError(false);
      setErrorType(null);

      try {
        const imageData = await getPatrolImage(record.imageid);
        if (imageData && imageData.length > 0) {
          // Convert Uint8Array to Blob
          const blob = new Blob([imageData as BlobPart], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setImageError(false);
        } else {
          setImageError(true);
          setErrorType('not-found');
        }
      } catch (error: any) {
        console.error('Failed to load image:', error);
        setImageError(true);
        // Determine error type based on error properties
        // Axios network errors don't have a response object
        if (!error?.response) {
          // No response means network/connection error
          setErrorType('network');
        } else if (error?.response?.status === 404) {
          setErrorType('not-found');
        } else if (error?.code === 'NETWORK_ERROR' || 
                   error?.message?.toLowerCase().includes('network') || 
                   error?.message?.toLowerCase().includes('fetch') ||
                   error?.message?.toLowerCase().includes('failed to fetch') ||
                   error?.message?.toLowerCase().includes('timeout')) {
          setErrorType('network');
        } else {
          // Default to network error for other failures
          setErrorType('network');
        }
      } finally {
        setIsLoadingImage(false);
      }
    }
    
    // If no imageid, show not-found placeholder when expanded
    if (newExpanded && !record.imageid) {
      setImageError(true);
      setErrorType('not-found');
    }
  };

  const handleCardClick = () => {
    onClick(record);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow mx-2 my-2"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-foreground">Point {record.point}</h3>
          <div className="flex items-center gap-2">
            <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded">
              RECORDED
            </span>
            <button
              onClick={handleToggle}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatDateTime(record.time)}</span>
          </div>

          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            <span>{record.guardname}</span>
          </div>

          {record.note && (
            <div className="flex items-start text-muted-foreground">
              <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{record.note}</span>
            </div>
          )}
        </div>

        {/* Expanded Image Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {isLoadingImage ? (
              <div className="flex items-center justify-center py-16 bg-muted rounded-md border-2 border-dashed border-border">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Loading image...</p>
                </div>
              </div>
            ) : imageError || !imageUrl ? (
              <div className="flex items-center justify-center py-16 bg-muted rounded-md border-2 border-dashed border-border min-h-[200px]">
                <div className="text-center px-4">
                  {errorType === 'network' ? (
                    <>
                      <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Network Error</p>
                      <p className="text-xs text-muted-foreground">Unable to load image. Please check your connection.</p>
                    </>
                  ) : (
                    <>
                      <ImageOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">No Image Available</p>
                      <p className="text-xs text-muted-foreground">No image was captured for this patrol record.</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-md overflow-hidden bg-muted border border-border">
                <img
                  src={imageUrl}
                  alt={`Patrol image for point ${record.point}`}
                  className="w-full h-auto max-h-96 object-contain"
                  onError={() => {
                    setImageError(true);
                    setErrorType('not-found');
                    if (imageUrl) {
                      URL.revokeObjectURL(imageUrl);
                      setImageUrl(null);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

