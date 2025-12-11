'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoInternetOverlayProps {
  isVisible: boolean;
  errorMessage?: string;
  onTryAgain: () => void;
}

export function NoInternetOverlay({
  isVisible,
  errorMessage = 'No Internet Connection',
  onTryAgain,
}: NoInternetOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-20">
      <div className="text-center text-white p-6 max-w-sm">
        {/* WiFi Off Icon */}
        <WifiOff className="h-16 w-16 mx-auto mb-6 text-white" />

        {/* Shimmer Text */}
        <div className="space-y-2 mb-6">
          <p
            className="text-lg font-bold text-white"
            style={{
              animation: 'shimmer 1500ms ease-in-out infinite',
            }}
          >
            No Internet Connection
          </p>
          <p
            className="text-sm text-white/70"
            style={{
              animation: 'shimmer 1500ms ease-in-out infinite 200ms',
            }}
          >
            {errorMessage}
          </p>
        </div>

        {/* Try Again Button */}
        <Button
          onClick={onTryAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full"
        >
          Try Again
        </Button>
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

