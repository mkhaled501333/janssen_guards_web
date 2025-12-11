'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ServerStatusProps {
  isOnline: boolean;
  className?: string;
}

export function ServerStatus({ isOnline, className }: ServerStatusProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-2 w-2 rounded-full pulse-dot",
          isOnline ? "bg-green-500" : "bg-red-500"
        )}
      />
      <span className="text-sm font-medium text-foreground">
        {isOnline ? "Server Online" : "Server Offline"}
      </span>
    </div>
  );
}

