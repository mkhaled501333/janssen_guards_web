'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ScanDialogProps {
  isOpen: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function ScanDialog({
  isOpen,
  type,
  message,
  onClose,
  autoCloseDelay = 4000,
}: ScanDialogProps) {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isOpen ? 'opacity-90' : 'opacity-0'
        )}
        style={{ backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)' }}
      />

      {/* Dialog Content */}
      <div
        className={cn(
          'relative z-10 bg-card rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 border border-border',
          'transform transition-all duration-500',
          isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}
        style={{
          animation: isOpen ? 'dialogEnter 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {/* Icon */}
        <div
          className={cn(
            'mx-auto mb-6 flex items-center justify-center',
            'transform transition-all duration-500',
            isOpen ? 'scale-100' : 'scale-0'
          )}
          style={{
            animation: isOpen ? 'iconEnter 500ms ease-out' : 'none',
          }}
        >
          <Icon
            className={cn(
              'h-20 w-20',
              isSuccess ? 'text-green-600' : 'text-red-600'
            )}
          />
        </div>

        {/* Message */}
        <div
          className={cn(
            'text-center transition-opacity duration-700',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p
            className={cn(
              'text-xl font-bold mb-2 whitespace-pre-line',
              isSuccess ? 'text-green-800' : 'text-red-800'
            )}
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes dialogEnter {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes iconEnter {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

