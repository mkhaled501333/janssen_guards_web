'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/lib/api/config';

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    // First check browser online status
    if (!navigator.onLine) {
      return false;
    }

    // Then check actual server connectivity
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return false;
    }
  }, []);

  return { isOnline, checkConnectivity };
}

