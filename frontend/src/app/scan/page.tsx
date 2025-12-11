'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  RotateCcw,
  RefreshCw,
  FlipHorizontal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useServerStatus } from '@/lib/hooks/useServerStatus';
import { useScanner } from '@/lib/hooks/useScanner';
import { useConnectivity } from '@/lib/hooks/useConnectivity';
import { QRScanner } from '@/components/scanner/QRScanner';
import { PatrolProgress } from '@/components/scanner/PatrolProgress';
import { ScanDialog } from '@/components/scanner/ScanDialog';
import { ServerStatus } from '@/components/shared/ServerStatus';
import { NavigationDrawer, MenuButton } from '@/components/shared/NavigationDrawer';
import { Button } from '@/components/ui/button';
import { APP_NAME, ROUTES } from '@/constants';

export default function ScanPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { isServerOnline } = useServerStatus();
  const { isOnline } = useConnectivity();
  const {
    scannedPoints,
    status,
    isScanning,
    handleScan,
    resetProgress,
    dialogState,
    closeDialog,
    handleCheckConnectivity,
    setIsScanning,
  } = useScanner();

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, router]);


  const handleScanResult = (code: string) => {
    // Only process if scanning is enabled and not already processing
    if (isScanning && status !== 'loading') {
      handleScan(code);
    }
  };

  const handleScanError = (error: Error) => {
    // Only log unexpected errors, not expected camera errors (like no camera found)
    if (error.name !== 'CameraError') {
      console.error('Unexpected scanner error:', error);
    }
  };

  // Handle camera auto-stop after successful scan
  useEffect(() => {
    if (status === 'success' && dialogState.isOpen && dialogState.type === 'success') {
      // Turn off camera after successful scan
      setIsCameraActive(false);
      setIsScanning(false);
    }
  }, [status, dialogState]);

  // Re-enable scanning when camera is turned back on
  useEffect(() => {
    if (isCameraActive && status === 'initial') {
      setIsScanning(true);
    }
  }, [isCameraActive, status]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* AppBar */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MenuButton onClick={() => setIsDrawerOpen(true)} />
              <h1 className="text-xl font-bold text-foreground">Patrol Scanner</h1>
            </div>
            <div className="flex items-center gap-4">
              <ServerStatus isOnline={isServerOnline} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Camera View - Exactly 1/3 of screen height */}
        <div className="flex-shrink-0" style={{ height: '33vh', minHeight: '200px' }}>
          <QRScanner
            isActive={isCameraActive}
            onScan={handleScanResult}
            onError={handleScanError}
            onCameraToggle={() => {
              setIsCameraActive(true);
              setIsScanning(true);
            }}
            status={status}
            isScanning={isScanning && isCameraActive}
            hasInternet={isOnline}
            onCheckConnectivity={handleCheckConnectivity}
            isFlashOn={isFlashOn}
          />
        </div>

        {/* Instructions & Controls - Bottom 2/3 */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Control Buttons */}
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => setIsFlashOn(!isFlashOn)}
                className="h-auto py-4 flex items-center justify-center"
                title={isFlashOn ? 'Flash On' : 'Flash Off'}
              >
                {isFlashOn ? (
                  <Zap className="h-5 w-5 text-amber-500" />
                ) : (
                  <ZapOff className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setIsCameraActive(!isCameraActive);
                  if (!isCameraActive) {
                    setIsScanning(true);
                  }
                }}
                className="h-auto py-4 flex items-center justify-center"
                title={isCameraActive ? 'Camera Off' : 'Camera On'}
              >
                {isCameraActive ? (
                  <CameraOff className="h-5 w-5 text-red-500" />
                ) : (
                  <Camera className="h-5 w-5 text-green-500" />
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsFrontCamera(!isFrontCamera)}
                className="h-auto py-4 flex items-center justify-center"
                disabled
                title="Camera flip (coming soon)"
              >
                <FlipHorizontal className="h-5 w-5 text-blue-500" />
              </Button>

              <Button
                variant="outline"
                onClick={resetProgress}
                className="h-auto py-4 flex items-center justify-center"
                title="Reset Progress"
              >
                <RefreshCw className="h-5 w-5 text-green-500" />
              </Button>
            </div>

            {/* Patrol Progress */}
            <PatrolProgress scannedPoints={scannedPoints} />
          </div>
        </div>
      </main>

      {/* Success/Error Dialog */}
      <ScanDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        message={dialogState.message}
        onClose={closeDialog}
        autoCloseDelay={4000}
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}


