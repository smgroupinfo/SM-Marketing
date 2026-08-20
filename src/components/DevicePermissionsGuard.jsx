import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Camera, Database, ShieldAlert, ShieldCheck, CheckCircle2, 
  AlertCircle, XCircle, RefreshCw, Lock, ArrowRight, Smartphone,
  Info, AlertTriangle, Check
} from 'lucide-react';

/**
 * Storage check helper
 */
export function checkStorageAvailable() {
  try {
    const testKey = '__smm_storage_check__';
    localStorage.setItem(testKey, 'ok');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Component 1: Initial Mandatory Permissions Gate Screen
 */
export function PermissionsCheckScreen({ user, onPermissionsGranted, onBypassTesting }) {
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'granted' | 'prompt' | 'denied' | 'checking'
  const [cameraStatus, setCameraStatus] = useState('prompt');     // 'granted' | 'prompt' | 'denied' | 'checking'
  const [storageStatus, setStorageStatus] = useState('checking'); // 'granted' | 'denied' | 'checking'
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial passive status check
  useEffect(() => {
    // Check storage immediately
    const storageOk = checkStorageAvailable();
    setStorageStatus(storageOk ? 'granted' : 'denied');

    // Passive permission queries if supported
    const checkPassivePermissions = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
          setLocationStatus(geoStatus.state);
          geoStatus.onchange = () => setLocationStatus(geoStatus.state);
        } catch (e) {
          // Geolocation query might fail in some browsers; fallback to 'prompt'
        }

        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' });
          setCameraStatus(camStatus.state);
          camStatus.onchange = () => setCameraStatus(camStatus.state);
        } catch (e) {
          // Camera query not supported in all browsers
        }
      }
    };

    checkPassivePermissions();
  }, []);

  // Request Location
  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      setLocationStatus('checking');
      if (!navigator.geolocation) {
        setLocationStatus('denied');
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus('granted');
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation error / denied:', err);
          setLocationStatus('denied');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  // Request Camera
  const requestCamera = useCallback(() => {
    return new Promise(async (resolve) => {
      setCameraStatus('checking');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('denied');
        resolve(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop stream immediately once access is confirmed
        stream.getTracks().forEach(track => track.stop());
        setCameraStatus('granted');
        resolve(true);
      } catch (err) {
        console.warn('Camera error / denied:', err);
        setCameraStatus('denied');
        resolve(false);
      }
    });
  }, []);

  // Grand master request: 'Grant All Permissions'
  const handleGrantAll = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    // Check storage
    const storageOk = checkStorageAvailable();
    setStorageStatus(storageOk ? 'granted' : 'denied');

    // Trigger both prompts
    const locGranted = await requestLocation();
    const camGranted = await requestCamera();

    setIsProcessing(false);

    if (locGranted && camGranted && storageOk) {
      onPermissionsGranted();
    } else {
      setErrorMessage('Location and Camera access are mandatory for Field Executives to start shifts and log visits.');
    }
  };

  const allGranted = locationStatus === 'granted' && cameraStatus === 'granted' && storageStatus === 'granted';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/80">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Smartphone size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Device Permissions Required
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
            Sundaram Mahadeo Group requires mandatory hardware sensor access to verify field shifts, mileage, and dealer visits.
          </p>
        </div>

        {/* Error / Alert Banner if permissions denied */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs font-semibold flex items-start gap-3 shadow-lg animate-in fade-in zoom-in-95">
            <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-red-100 mb-0.5">Access Blocked</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Status Badges & Requirement Cards */}
        <div className="space-y-3 mb-6">
          
          {/* 1. Location (GPS) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            locationStatus === 'granted'
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : locationStatus === 'denied'
              ? 'bg-red-950/30 border-red-500/40'
              : 'bg-slate-700/40 border-slate-600/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  locationStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : locationStatus === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Location Access (GPS)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Live GPS distance calculation & visit geofencing
                  </p>
                </div>
              </div>

              <div>
                {locationStatus === 'granted' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                    <Check size={14} /> Granted
                  </span>
                )}
                {locationStatus === 'denied' && (
                  <button 
                    onClick={requestLocation}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-bold hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle size={14} /> Denied (Retry)
                  </button>
                )}
                {(locationStatus === 'prompt' || locationStatus === 'checking') && (
                  <button 
                    onClick={requestLocation}
                    disabled={locationStatus === 'checking'}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold hover:bg-blue-500/30 transition-colors"
                  >
                    {locationStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Prompt'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Camera Access */}
          <div className={`p-4 rounded-2xl border transition-all ${
            cameraStatus === 'granted'
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : cameraStatus === 'denied'
              ? 'bg-red-950/30 border-red-500/40'
              : 'bg-slate-700/40 border-slate-600/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  cameraStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : cameraStatus === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  <Camera size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Camera Access
                  </h4>
                  <p className="text-xs text-slate-400">
                    Proof photos for dealer shopfronts & payment receipts
                  </p>
                </div>
              </div>

              <div>
                {cameraStatus === 'granted' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                    <Check size={14} /> Granted
                  </span>
                )}
                {cameraStatus === 'denied' && (
                  <button 
                    onClick={requestCamera}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-bold hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle size={14} /> Denied (Retry)
                  </button>
                )}
                {(cameraStatus === 'prompt' || cameraStatus === 'checking') && (
                  <button 
                    onClick={requestCamera}
                    disabled={cameraStatus === 'checking'}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold hover:bg-purple-500/30 transition-colors"
                  >
                    {cameraStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Prompt'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Local Storage / Offline Cache */}
          <div className={`p-4 rounded-2xl border transition-all ${
            storageStatus === 'granted'
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-red-950/30 border-red-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  storageStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Local Storage / Offline Cache
                  </h4>
                  <p className="text-xs text-slate-400">
                    Offline visit queueing & client master caching
                  </p>
                </div>
              </div>

              <div>
                {storageStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                    <Check size={14} /> Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-bold">
                    <XCircle size={14} /> Unavailable
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button: 'Grant All Permissions' */}
        <div className="space-y-3">
          <button
            onClick={allGranted ? onPermissionsGranted : handleGrantAll}
            disabled={isProcessing}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 ${
              allGranted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Verifying Hardware Sensors...
              </>
            ) : allGranted ? (
              <>
                <CheckCircle2 size={18} /> Continue to Shift Dashboard <ArrowRight size={16} />
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Grant All Permissions
              </>
            )}
          </button>

          {/* Bypass for testing option */}
          {onBypassTesting && (
            <button
              onClick={onBypassTesting}
              type="button"
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
            >
              Simulate / Bypass for Testing (Sandbox Mode)
            </button>
          )}
        </div>

        {/* Policy Footer Note */}
        <p className="text-[11px] text-slate-500 text-center mt-6">
          Sundaram Mahadeo Group Security & Audit Policy • All GPS locations and camera proofs are cryptographically logged with timestamps.
        </p>
      </div>
    </div>
  );
}

/**
 * Component 2: Fallback Mid-Shift Lock-Screen Overlay
 * Triggered if GPS or Camera access is revoked while on duty.
 */
export function RevokedPermissionsOverlay({ revokedReason, onRecheckPermissions, onBypassTesting, onLogout }) {
  const [rechecking, setRechecking] = useState(false);

  const handleRecheck = async () => {
    setRechecking(true);
    await onRecheckPermissions();
    setRechecking(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl text-slate-100">
        
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Lock size={32} />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">
          Shift On Hold — Permission Revoked
        </h3>

        <div className="mt-3 p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl text-left">
          <p className="text-xs font-bold text-red-300 flex items-center gap-1.5 mb-1">
            <AlertTriangle size={14} className="text-red-400" /> Sensor Interruption Detected
          </p>
          <p className="text-xs text-red-200">
            {revokedReason || 'Location (GPS) or Camera access was revoked or disabled mid-shift.'}
          </p>
        </div>

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Field executives must keep Location (GPS) and Camera permissions active at all times during an active shift. Please re-enable sensor access in your browser settings to continue logging visits.
        </p>

        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleRecheck}
            disabled={rechecking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-98"
          >
            <RefreshCw size={16} className={rechecking ? 'animate-spin' : ''} />
            {rechecking ? 'Testing Device Sensors...' : 'Re-check & Re-enable Permissions'}
          </button>

          {onBypassTesting && (
            <button
              onClick={onBypassTesting}
              type="button"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors border border-slate-700"
            >
              Bypass Lock for Testing
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              type="button"
              className="w-full text-xs text-red-400 hover:text-red-300 py-1.5 transition-colors"
            >
              Sign Out from Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default {
  PermissionsCheckScreen,
  RevokedPermissionsOverlay,
  checkStorageAvailable
};
