'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectivity } from './useConnectivity';
import { useServerStatus } from './useServerStatus';
import { createPatrolRecord } from '@/lib/api/patrol';
import { feedbackService } from '@/services/feedback';
import { ScanResult, ScannerStatus } from '@/lib/types';
import { isNumeric, generateId, generateImageId, normalizePointCode } from '@/lib/utils/format';
import { STORAGE_KEYS, TOTAL_PATROL_POINTS, SCAN_DEBOUNCE_TIME } from '@/constants';

export function useScanner() {
  const { user } = useAuth();
  const { isOnline, checkConnectivity } = useConnectivity();
  const { isServerOnline } = useServerStatus();
  const [scannedPoints, setScannedPoints] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ScannerStatus>('initial');
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [lastProcessedCode, setLastProcessedCode] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  // Load scanned points from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCANNED_POINTS);
    if (saved) {
      try {
        setScannedPoints(new Set(JSON.parse(saved)));
      } catch (error) {
        console.error('Failed to load scanned points:', error);
      }
    }
  }, []);

  // Save scanned points to localStorage
  const saveScannedPoints = useCallback((points: Set<string>) => {
    localStorage.setItem(STORAGE_KEYS.SCANNED_POINTS, JSON.stringify([...points]));
  }, []);

  const processQrCode = useCallback(
    async (code: string): Promise<ScanResult> => {
      // Step 1: Duplicate Prevention - Check if same code scanned within last 5 seconds
      const now = Date.now();
      if (
        lastProcessedCode === code &&
        now - lastScanTime < SCAN_DEBOUNCE_TIME
      ) {
        console.log(`Scan ignored: isScanning=${isScanning}, code=${code}`);
        return {
          success: true,
          serverSuccess: false,
          message: 'Code already processed',
          turnOffCamera: false,
          skipFeedback: true,
        };
      }

      // Step 2: Code Extraction & Validation - Check if numeric
      if (!isNumeric(code)) {
        feedbackService.playErrorSound();
        return {
          success: false,
          serverSuccess: false,
          message: 'INVALID QR CODE\nPlease scan a numeric patrol point',
          turnOffCamera: false,
          skipFeedback: false,
        };
      }

      // Normalize code (remove leading zeros)
      const normalizedCode = normalizePointCode(code);

      // Step 3: Check if point already scanned (silent return)
      if (scannedPoints.has(normalizedCode)) {
        return {
          success: true,
          serverSuccess: false,
          message: `Point ${normalizedCode} already scanned`,
          turnOffCamera: true, // Turn off camera for already scanned points
          skipFeedback: true,
        };
      }

      // Step 4: Disable scanning and set loading state
      setIsScanning(false);
      setStatus('loading');

      // Step 5: Connectivity Check
      const hasInternet = await checkConnectivity();
      if (!hasInternet || !isOnline) {
        setStatus('noInternet');
        feedbackService.playErrorSound();
        return {
          success: false,
          serverSuccess: false,
          message: 'No Internet Connection\nPlease check your connection and try again',
          turnOffCamera: false,
          skipFeedback: false,
        };
      }

      // Check server status
      if (!isServerOnline) {
        setStatus('error');
        feedbackService.playErrorSound();
        return {
          success: false,
          serverSuccess: false,
          message: 'Server Offline\nPlease try again later',
          turnOffCamera: false,
          skipFeedback: false,
        };
      }

      if (!user) {
        setStatus('error');
        feedbackService.playErrorSound();
        return {
          success: false,
          serverSuccess: false,
          message: 'User not authenticated\nPlease log in again',
          turnOffCamera: false,
          skipFeedback: false,
        };
      }

      // Validate guard name
      if (!user.guardName || user.guardName.trim().length === 0) {
        setStatus('error');
        feedbackService.playErrorSound();
        return {
          success: false,
          serverSuccess: false,
          message: 'Invalid user data\nPlease log in again',
          turnOffCamera: false,
          skipFeedback: false,
        };
      }

      // Step 6: Create patrol record
      const timestamp = Math.floor(Date.now() / 1000);
      const record = {
        id: generateId(), // Generate proper UUID format as required by backend
        point: normalizedCode,
        guardname: user.guardName.trim(),
        time: timestamp.toString(),
        servertime: timestamp.toString(),
        imageid: generateImageId(),
        note: '',
      };

      try {
        // Step 7: Server Communication
        await createPatrolRecord(record);

        // Step 8: Success Path
        const newScannedPoints = new Set(scannedPoints);
        newScannedPoints.add(normalizedCode);
        setScannedPoints(newScannedPoints);
        saveScannedPoints(newScannedPoints);

        // Update last scan tracking
        setLastProcessedCode(normalizedCode);
        setLastScanTime(now);

        // Check if all points completed
        const isCompleted = newScannedPoints.size === TOTAL_PATROL_POINTS;

        // Play success sound
        feedbackService.playSuccessSound();

        // If track just completed, play second success sound with delay
        if (isCompleted) {
          setTimeout(() => {
            feedbackService.playSuccessSound();
          }, 500);
        }

        // Clear last processed code after success (allows rescanning same code later)
        setTimeout(() => {
          setLastProcessedCode(null);
        }, SCAN_DEBOUNCE_TIME);

        setStatus('success');

        return {
          success: true,
          serverSuccess: true,
          message: isCompleted
            ? `Point ${normalizedCode}: SUCCESSFULLY RECORDED\n\nProgress: ${newScannedPoints.size}/${TOTAL_PATROL_POINTS} points\n\nALL PATROL POINTS COMPLETED!`
            : `Point ${normalizedCode}: SUCCESSFULLY RECORDED\n\nProgress: ${newScannedPoints.size}/${TOTAL_PATROL_POINTS} points`,
          turnOffCamera: true, // Always turn off camera after successful scan
          skipFeedback: false,
          point: normalizedCode,
        };
      } catch (error: any) {
        console.error('Failed to record scan:', error);
        
        // Step 9: Error Path
        feedbackService.playErrorSound();
        setStatus('error');

        let errorMessage = 'SERVER ERROR\nScan not recorded';
        if (error.response?.status === 422) {
          const validationErrors = error.response.data?.detail;
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            const firstError = validationErrors[0];
            errorMessage = `Validation error: ${firstError.loc?.join('.')} - ${firstError.msg}`;
          }
        } else if (error.response?.status) {
          errorMessage = `SERVER ERROR (${error.response.status})\nScan not recorded`;
        }

        return {
          success: false,
          serverSuccess: false,
          message: errorMessage,
          turnOffCamera: false, // Resume camera on error
          skipFeedback: false,
          point: normalizedCode,
        };
      }
    },
    [
      scannedPoints,
      user,
      isOnline,
      isServerOnline,
      lastProcessedCode,
      lastScanTime,
      saveScannedPoints,
      isScanning,
      checkConnectivity,
    ]
  );

  const handleScan = useCallback(
    async (code: string) => {
      // Validation: Only process if not already processing and scanning is enabled
      if (status === 'loading' || !isScanning) {
        return;
      }

      try {
        const result = await processQrCode(code);

        // Show dialog if feedback is not skipped
        if (!result.skipFeedback) {
          setDialogState({
            isOpen: true,
            type: result.success ? 'success' : 'error',
            message: result.message,
          });
        }

        // Handle camera state based on result
        // Camera auto-stop is handled by parent component via turnOffCamera flag
      } catch (error: any) {
        // Step 10: Processing Errors
        console.error('Processing error:', error);
        feedbackService.playErrorSound();
        setStatus('error');
        setDialogState({
          isOpen: true,
          type: 'error',
          message: `SCAN FAILED\nCould not process patrol point`,
        });
      }
    },
    [status, isScanning, processQrCode]
  );

  const closeDialog = useCallback(() => {
    setDialogState({ isOpen: false, type: 'success', message: '' });
    // Reset status after dialog closes
    if (status === 'success' || status === 'error') {
      setStatus('initial');
      // Re-enable scanning after error (camera will resume)
      if (status === 'error') {
        setIsScanning(true);
      }
    }
  }, [status]);

  const handleCheckConnectivity = useCallback(async () => {
    const hasInternet = await checkConnectivity();
    if (hasInternet && isOnline) {
      setStatus('initial');
      setIsScanning(true);
      feedbackService.showSuccess('Internet connection restored');
    } else {
      feedbackService.showError('Still no internet connection');
    }
  }, [checkConnectivity, isOnline]);

  const resetProgress = useCallback(() => {
    if (confirm('Start New Patrol?\n\nThis will reset your patrol progress. All scanned points will be cleared.')) {
      setScannedPoints(new Set());
      localStorage.removeItem(STORAGE_KEYS.SCANNED_POINTS);
      feedbackService.showInfo('Patrol progress reset. Ready to start a new patrol.');
    }
  }, []);

  return {
    scannedPoints,
    status,
    isScanning,
    handleScan,
    resetProgress,
    dialogState,
    closeDialog,
    handleCheckConnectivity,
    setIsScanning,
  };
}

