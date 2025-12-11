'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkServerStatus } from '@/lib/api/auth';
import { SERVER_CHECK_INTERVAL } from '@/constants';

export function useServerStatus() {
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const status = await checkServerStatus();
      setIsServerOnline(status);
      setLastChecked(new Date());
    } catch (error) {
      setIsServerOnline(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    // Check immediately
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, SERVER_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkStatus]);

  return { isServerOnline, lastChecked, checkStatus };
}

