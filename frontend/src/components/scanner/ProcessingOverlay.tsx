'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  isVisible: boolean;
}

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-20">
      <div className="text-center text-white p-6">
        {/* Spinner */}
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-white" />

        {/* Shimmer Text */}
        <div className="space-y-2">
          <p
            className="text-lg font-bold text-white"
            style={{
              animation: 'shimmer 1500ms ease-in-out infinite',
            }}
          >
            Processing QR Code...
          </p>
          <p
            className="text-sm text-white/70"
            style={{
              animation: 'shimmer 1500ms ease-in-out infinite 200ms',
            }}
          >
            Please wait while we send the patrol log
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

