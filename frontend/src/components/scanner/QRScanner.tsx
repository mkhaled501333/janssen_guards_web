'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

// Type declarations for legacy getUserMedia
declare global {
  interface Navigator {
    getUserMedia?: (constraints: MediaStreamConstraints, successCallback: (stream: MediaStream) => void, errorCallback: (error: Error) => void) => void;
  }
}

// Helper function to detect browser
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

interface QRScannerProps {
  isActive: boolean;
  onScan: (code: string) => void;
  onError: (error: Error) => void;
  onCameraStart?: () => void;
  onCameraToggle?: () => void;
  status?: 'initial' | 'loading' | 'success' | 'error' | 'noInternet';
  isScanning?: boolean;
  hasInternet?: boolean;
  onCheckConnectivity?: () => void;
  isFlashOn?: boolean;
}

export function QRScanner({
  isActive,
  onScan,
  onError,
  onCameraStart,
  onCameraToggle,
  status = 'initial',
  isScanning = true,
  hasInternet = true,
  onCheckConnectivity,
  isFlashOn = false,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const lastProcessTimeRef = useRef<number>(0);
  
  // Add mounted state to prevent SSR hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const [isScanningState, setIsScanningState] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (isMountedRef.current) {
      setIsScanningState(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Enhanced camera API detection and fallback
      let stream;
      
      // Only access navigator after mounting to prevent SSR issues
      if (!isMounted) return;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      console.log('Device info:', {
        userAgent: navigator.userAgent,
        isMobile: isMobile,
        isIOS: isIOS,
        isAndroid: isAndroid,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasLegacyGetUserMedia: !!navigator.getUserMedia,
        protocol: window.location.protocol,
        host: window.location.host,
        isSecureContext: window.isSecureContext,
        browser: getBrowserInfo()
      });

      // Check for secure context (HTTPS or localhost)
      const hostname = window.location.hostname;
      const isLocalHost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' ||
                          hostname.endsWith('.localhost');
      
      // Check if it's a local network IP (e.g., 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
      
      const isSecureContext = window.isSecureContext || isLocalHost;
      
      console.log('Security Context Check:', {
        hostname,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext,
        isLocalHost,
        isLocalNetwork,
        allowsCamera: isSecureContext || isLocalNetwork
      });
      
      // Allow camera access for localhost, HTTPS, or local network
      // Note: Most modern browsers will allow camera on localhost even without HTTPS
      if (!isSecureContext && !isLocalHost && !isLocalNetwork) {
        console.warn('Camera may not work on HTTP connections outside localhost/local network');
      }
      
      if ((isLocalNetwork || isLocalHost) && !isSecureContext) {
        console.log('Using camera on local network/localhost without HTTPS - this is allowed for local development.');
      }
      
      // Try multiple camera access methods with progressive fallback
      console.log('Attempting to access camera with available APIs...');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Using modern navigator.mediaDevices.getUserMedia API');
        // Modern browsers - try multiple constraint combinations
        const constraintsToTry = [];
        
        if (isMobile) {
          // Mobile-specific constraints (try multiple options)
          constraintsToTry.push(
            { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: { facingMode: 'environment' } },
            { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: true }
          );
        } else {
          // Desktop constraints
          constraintsToTry.push(
            { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
            { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: true }
          );
        }
        
        let lastError;
        for (const constraints of constraintsToTry) {
          try {
            console.log('Trying camera constraints:', constraints);
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera access successful with constraints:', constraints);
            break;
          } catch (error) {
            console.log('Camera constraints failed:', constraints, error);
            lastError = error;
            continue;
          }
        }
        
        if (!stream) {
          throw lastError || new Error('All camera constraint attempts failed');
        }
      } else if (navigator.getUserMedia) {
        console.log('Using legacy navigator.getUserMedia API');
        // Legacy browsers
        stream = await new Promise<MediaStream>((resolve, reject) => {
          navigator.getUserMedia!(
            { video: true },
            resolve,
            reject
          );
        });
      } else if ((navigator as any).webkitGetUserMedia) {
        console.log('Trying webkit getUserMedia fallback');
        // Webkit fallback
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (navigator as any).webkitGetUserMedia(
            { video: true },
            resolve,
            reject
          );
        });
      } else if ((navigator as any).mozGetUserMedia) {
        console.log('Trying moz getUserMedia fallback');
        // Mozilla fallback
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (navigator as any).mozGetUserMedia(
            { video: true },
            resolve,
            reject
          );
        });
      } else {
        // Provide detailed diagnostic information
        const diagnostics = {
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          hasLegacyGetUserMedia: !!navigator.getUserMedia,
          hasWebkitGetUserMedia: !!(navigator as any).webkitGetUserMedia,
          hasMozGetUserMedia: !!(navigator as any).mozGetUserMedia,
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        };
        console.error('Camera API not available. Diagnostics:', diagnostics);
        throw new Error(`Camera API not supported. Available APIs: ${JSON.stringify(diagnostics, null, 2)}`);
      }

      streamRef.current = stream as MediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream as MediaProvider;
        console.log('Video stream attached to video element');
        
        // Properly handle the play() promise
        try {
          await videoRef.current.play();
          console.log('Video playback started successfully');
        } catch (playError) {
          // Ignore abort errors - they occur when component unmounts during play
          if (playError instanceof Error && playError.name !== 'AbortError') {
            console.error('Video play error:', playError);
            throw playError;
          }
          console.log('Video play aborted (component unmounting)');
          return; // Early return if play was aborted
        }
      }

      // Only set state if component is still mounted
      if (!isMountedRef.current) {
        console.log('Component unmounted, aborting camera initialization');
        return;
      }

      console.log('✅ Camera initialized successfully, starting QR detection');
      setIsScanningState(true);
      setHasPermission(true);
      setIsInitializing(false);
      onCameraStart?.();

    } catch (err) {
      // Don't update state if component is unmounted
      if (!isMountedRef.current) {
        return;
      }

      console.error('Error accessing camera:', err);
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.message.includes('Camera API not supported') || err.message === 'All camera constraint attempts failed') {
          const browser = getBrowserInfo();
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // Check if we have diagnostic info
          if (err.message.includes('Available APIs:')) {
            errorMessage = 'Camera API not available on this browser.\n\nPlease check the browser console for details.\n\nTry:\n- Updating your browser\n- Using Chrome, Firefox, or Edge\n- Checking browser settings for camera permissions';
          } else if (isMobile) {
            if (browser === 'Safari') {
              errorMessage = 'Camera not supported. Try updating Safari or use Chrome on mobile.';
            } else if (browser === 'Chrome') {
              errorMessage = 'Camera not supported. Try updating Chrome or check camera permissions.';
            } else {
              errorMessage = 'Camera not supported on this mobile browser. Try Chrome or Safari.';
            }
          } else {
            errorMessage = `Camera not supported in ${browser}. Try Chrome, Firefox, or Edge.`;
          }
        } else if (err.message.includes('Camera requires HTTPS')) {
          errorMessage = 'Camera access may be limited. Try using HTTPS or allow camera access in your browser settings.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please connect a camera and try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device. Try Chrome or Safari.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Close other camera apps and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints cannot be satisfied. Please try again.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked for security reasons. Try using HTTPS or allow insecure camera access in your browser settings.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Camera access was interrupted. Please try again.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'Camera API error. Try refreshing the page or using a different browser.';
        }
      }
      
      setError(errorMessage);
      const errorObj = new Error(errorMessage);
      errorObj.name = 'CameraError';
      onError(errorObj);
      setHasPermission(false);
      setIsInitializing(false);
    }
  }, [onError, onCameraStart, isMounted]);

  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanningState || !isScanning) {
      if (isScanningState && isScanning) {
        animationRef.current = requestAnimationFrame(detectQRCode);
      }
      return;
    }

    const now = performance.now();
    // Throttle QR detection to ~10fps (every 100ms) to reduce CPU usage
    const PROCESS_INTERVAL = 100;
    
    // Always schedule next frame, but only process QR detection at throttled rate
    if (now - lastProcessTimeRef.current < PROCESS_INTERVAL) {
      animationRef.current = requestAnimationFrame(detectQRCode);
      return;
    }

    lastProcessTimeRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      animationRef.current = requestAnimationFrame(detectQRCode);
      return;
    }

    // Check if video is ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Use a smaller canvas for detection to improve performance
      // QR codes can be detected at lower resolution
      const DETECTION_SCALE = 0.5; // Process at 50% resolution for better performance
      const detectionWidth = Math.floor(video.videoWidth * DETECTION_SCALE);
      const detectionHeight = Math.floor(video.videoHeight * DETECTION_SCALE);
      
      // Set canvas size for detection (smaller = faster)
      if (canvas.width !== detectionWidth || canvas.height !== detectionHeight) {
        canvas.width = detectionWidth;
        canvas.height = detectionHeight;
      }

      // Draw video frame to canvas at reduced resolution
      context.drawImage(video, 0, 0, detectionWidth, detectionHeight);

      // Get image data
      const imageData = context.getImageData(0, 0, detectionWidth, detectionHeight);

      // Detect QR code with default inversion attempts for better detection
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log('✅ QR Code detected:', code.data);
        onScan(code.data);
        // Don't stop camera automatically - let parent handle it
        return;
      }
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(detectQRCode);
  }, [isScanningState, isScanning, onScan]);

  useEffect(() => {
    // Reset mounted ref when component mounts
    isMountedRef.current = true;
    
    // Only start camera after component is mounted (client-side) and if active
    if (isMounted && isActive) {
      console.log('Component mounted, starting camera...');
      startCamera();
    } else if (!isActive) {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      console.log('Component unmounting, stopping camera...');
      isMountedRef.current = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, isActive]);

  // Start QR detection when scanning begins
  useEffect(() => {
    if (isScanningState && !isInitializing && !error && isScanning && isActive) {
      console.log('Starting QR detection loop...');
      detectQRCode();
    }
    
    // Cleanup on unmount or when scanning stops
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanningState, isInitializing, error, isScanning, isActive]);

  // Control flash/torch
  useEffect(() => {
    if (!streamRef.current || !isActive) {
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    // Check if torch is supported
    const capabilities = videoTrack.getCapabilities();
    const hasTorch = 'torch' in (capabilities as any);

    if (!hasTorch) {
      console.log('Torch/flash not supported on this device');
      return;
    }

    // Apply torch constraint
    const applyTorch = async () => {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: isFlashOn } as any],
        });
        console.log(`Flash ${isFlashOn ? 'on' : 'off'}`);
      } catch (err) {
        console.error('Error toggling flash:', err);
      }
    };

    applyTorch();
  }, [isFlashOn, isActive]);

  const retryScanning = useCallback(() => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [stopCamera, startCamera]);

  const requestCameraPermission = useCallback(async () => {
    try {
      // Check if getUserMedia is available and request camera access with fallback
      let stream;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern browsers - try different constraints for mobile vs desktop
        try {
          if (isMobile) {
            // Mobile-specific constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment',
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 }
              }
            });
          } else {
            // Desktop constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
          }
        } catch (mobileError) {
          console.log('Mobile constraints failed, trying basic constraints:', mobileError);
          // Fallback to basic constraints if mobile-specific ones fail
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      } else if (navigator.getUserMedia) {
        // Legacy browsers
        stream = await new Promise<MediaStream>((resolve, reject) => {
          navigator.getUserMedia!(
            { video: true },
            resolve,
            reject
          );
        });
      } else {
        throw new Error('Camera API not supported on this device');
      }
      
      // Stop the test stream
      (stream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
      
      // Now try to start the camera
      startCamera();
    } catch (err) {
      // Don't update state if component is unmounted
      if (!isMountedRef.current) {
        return;
      }

      console.error('Error requesting camera permission:', err);
      let errorMessage = 'Camera permission denied';
      
      if (err instanceof Error) {
        if (err.message === 'Camera API not supported on this device') {
          errorMessage = 'Camera not supported on this device. Please use Chrome or Safari on mobile.';
        } else if (err.message.includes('Camera requires HTTPS')) {
          errorMessage = 'Camera access may be limited. Try using HTTPS or allow camera access in your browser settings.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device. Try Chrome or Safari.';
        }
      }
      
      setError(errorMessage);
      const errorObj = new Error(errorMessage);
      errorObj.name = 'CameraError';
      onError(errorObj);
    }
  }, [startCamera, onError]);

  // Don't render camera content until mounted (prevents SSR hydration issues)
  if (!isMounted) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Initializing scanner...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="relative w-full h-full bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-sm mb-4">Camera is off</p>
          <button
            onClick={() => {
              if (onCameraToggle) {
                onCameraToggle();
              } else {
                startCamera();
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Start Scanning
          </button>
        </div>
      </div>
    );
  }

  // Show processing overlay
  const showProcessing = status === 'loading';
  // Show no internet overlay
  const showNoInternet = status === 'noInternet' && !hasInternet;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      
      {/* Hidden canvas for QR detection */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Scanning overlay with frame */}
      {isScanningState && !showProcessing && !showNoInternet && !error && isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Overlay with transparent center */}
          <div className="absolute inset-0">
            {/* Top overlay */}
            <div className="absolute top-0 left-0 right-0 bg-black/20" style={{ height: 'calc(50% - 125px)' }} />
            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/20" style={{ height: 'calc(50% - 125px)' }} />
            {/* Left overlay */}
            <div className="absolute left-0 bg-black/20" style={{ top: 'calc(50% - 125px)', bottom: 'calc(50% - 125px)', width: 'calc(50% - 125px)' }} />
            {/* Right overlay */}
            <div className="absolute right-0 bg-black/20" style={{ top: 'calc(50% - 125px)', bottom: 'calc(50% - 125px)', width: 'calc(50% - 125px)' }} />
          </div>
          
          {/* Scanning Frame */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className="w-[250px] h-[250px] rounded-lg relative border"
              style={{
                borderColor: hasInternet ? '#3b82f6' : '#ef4444',
                borderWidth: '3px',
              }}
            >
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {showProcessing && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Processing...</p>
          </div>
        </div>
      )}

      {/* No Internet Overlay */}
      {showNoInternet && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center text-white p-6 max-w-md">
            <p className="text-sm mb-4 font-semibold">No Internet Connection</p>
            <p className="text-xs mb-4 text-gray-300">Please check your connection and try again</p>
            {onCheckConnectivity && (
              <button
                onClick={onCheckConnectivity}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Camera Error Overlay */}
      {(error || isInitializing) && !showProcessing && !showNoInternet && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center text-white p-6 max-w-md">
            {isInitializing ? (
              <>
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm mb-2">Initializing camera...</p>
                <p className="text-xs text-gray-400">Please allow camera access if prompted</p>
              </>
            ) : (
              <>
                <p className="text-sm mb-2 font-semibold">Camera Error</p>
                <p className="text-xs mb-4 text-gray-300 whitespace-pre-line">{error}</p>
                <div className="space-y-2">
                  <button
                    onClick={retryScanning}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium w-full"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={requestCameraPermission}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium w-full"
                  >
                    Request Camera Permission
                  </button>
                  {error?.includes('not supported') && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                      <p className="text-yellow-400 mb-2 text-xs">Alternative: Manual Entry</p>
                      <p className="text-gray-300 text-xs mb-3">
                        If camera is not supported, you can manually enter the QR code data:
                      </p>
                      <button
                        onClick={() => {
                          const manualCode = prompt('Enter QR code data manually:');
                          if (manualCode && manualCode.trim()) {
                            onScan(manualCode.trim());
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-xs"
                      >
                        Enter Code Manually
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
