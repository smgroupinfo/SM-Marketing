import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Camera, Mic, Bell, Database, ShieldAlert, ShieldCheck, CheckCircle2, 
  AlertCircle, XCircle, RefreshCw, Lock, ArrowRight, Smartphone,
  Info, AlertTriangle, Check, Volume2, Sparkles, HardDrive
} from 'lucide-react';
import { captureLiveLocation, requestAllAppPermissions } from '../lib/locationService';

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
 * Component 1: Initial Mandatory Permissions Gate Screen (for Field Staff & Onboarding)
 */
export function PermissionsCheckScreen({ user, onPermissionsGranted }) {
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'granted' | 'prompt' | 'denied' | 'checking'
  const [cameraStatus, setCameraStatus] = useState('prompt');     // 'granted' | 'prompt' | 'denied' | 'checking'
  const [micStatus, setMicStatus] = useState('prompt');           // 'granted' | 'prompt' | 'denied' | 'checking'
  const [notifStatus, setNotifStatus] = useState('prompt');       // 'granted' | 'prompt' | 'denied' | 'checking'
  const [storageStatus, setStorageStatus] = useState('checking'); // 'granted' | 'denied' | 'checking'
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial passive status check
  useEffect(() => {
    // Check storage immediately
    const storageOk = checkStorageAvailable();
    setStorageStatus(storageOk ? 'granted' : 'denied');

    // Notifications status check
    if (typeof Notification !== 'undefined') {
      setNotifStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'prompt');
    } else {
      setNotifStatus('granted');
    }

    // Passive permission queries if supported
    const checkPassivePermissions = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
          setLocationStatus(geoStatus.state);
          geoStatus.onchange = () => setLocationStatus(geoStatus.state);
        } catch (e) {}

        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' });
          setCameraStatus(camStatus.state);
          camStatus.onchange = () => setCameraStatus(camStatus.state);
        } catch (e) {}

        try {
          const mStatus = await navigator.permissions.query({ name: 'microphone' });
          setMicStatus(mStatus.state);
          mStatus.onchange = () => setMicStatus(mStatus.state);
        } catch (e) {}
      }
    };

    checkPassivePermissions();
  }, []);

  // Request Location
  const requestLocation = useCallback(async () => {
    setLocationStatus('checking');
    const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 8000 });
    if (res.success) {
      setLocationStatus('granted');
      return true;
    } else {
      console.warn('Geolocation capture issue:', res.error);
      setLocationStatus('denied');
      return false;
    }
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

  // Request Microphone
  const requestMicrophone = useCallback(() => {
    return new Promise(async (resolve) => {
      setMicStatus('checking');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus('granted');
        resolve(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicStatus('granted');
        resolve(true);
      } catch (err) {
        console.warn('Microphone error / denied:', err);
        setMicStatus('denied');
        resolve(false);
      }
    });
  }, []);

  // Request Notifications
  const requestNotification = useCallback(async () => {
    setNotifStatus('checking');
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        const ok = res === 'granted';
        setNotifStatus(ok ? 'granted' : 'denied');
        return ok;
      } catch (e) {
        setNotifStatus('granted');
        return true;
      }
    } else {
      setNotifStatus('granted');
      return true;
    }
  }, []);

  // Request Storage Space
  const requestStorage = useCallback(async () => {
    setStorageStatus('checking');
    const ok = checkStorageAvailable();
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist().catch(() => {});
    }
    setStorageStatus(ok ? 'granted' : 'denied');
    return ok;
  }, []);

  // Master request: 'Grant All App Permissions'
  const handleGrantAll = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    const results = await requestAllAppPermissions();

    setLocationStatus(results.geolocation ? 'granted' : 'denied');
    setCameraStatus(results.camera ? 'granted' : 'denied');
    setMicStatus(results.microphone ? 'granted' : 'denied');
    setNotifStatus(results.notification ? 'granted' : 'denied');
    setStorageStatus(results.storage ? 'granted' : 'denied');

    setIsProcessing(false);

    if (results.geolocation && results.camera && results.storage) {
      localStorage.setItem('smm_permissions_initialized', 'true');
      onPermissionsGranted();
    } else {
      setErrorMessage('Location, Camera, and Storage permissions are required for Field Staff to record visits and verify shifts.');
    }
  };

  const coreGranted = locationStatus === 'granted' && cameraStatus === 'granted' && storageStatus === 'granted';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Smartphone size={32} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Initial App Permissions
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
            Sundaram Mahadeo Group requires one-time permission access for GPS tracking, shop proof capture, audio notes, storage caching, and dispatch alerts.
          </p>
        </div>

        {/* Error / Alert Banner if permissions denied */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs font-semibold flex items-start gap-3 shadow-lg">
            <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={16} />
            <div>
              <p className="font-bold text-red-100 mb-0.5">Permission Required</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 5 Key Permission Tiles */}
        <div className="space-y-2.5 mb-6">
          
          {/* 1. Location (GPS) */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            locationStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : locationStatus === 'denied'
              ? 'bg-red-950/20 border-red-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  locationStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">Location (GPS & Coordinates)</h4>
                  <p className="text-[11px] text-slate-400">Live distance calculation & dealer geofencing</p>
                </div>
              </div>
              <div>
                {locationStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    <Check size={12} /> Granted
                  </span>
                ) : (
                  <button 
                    onClick={requestLocation}
                    disabled={locationStatus === 'checking'}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {locationStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Allow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Camera */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            cameraStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : cameraStatus === 'denied'
              ? 'bg-red-950/20 border-red-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  cameraStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  <Camera size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">Camera Access</h4>
                  <p className="text-[11px] text-slate-400">Odometer meter readings & dealer shopfront photos</p>
                </div>
              </div>
              <div>
                {cameraStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    <Check size={12} /> Granted
                  </span>
                ) : (
                  <button 
                    onClick={requestCamera}
                    disabled={cameraStatus === 'checking'}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {cameraStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Allow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Microphone */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            micStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  micStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Mic size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">Microphone (Audio Memos)</h4>
                  <p className="text-[11px] text-slate-400">Voice remarks & market feedback recordings</p>
                </div>
              </div>
              <div>
                {micStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    <Check size={12} /> Granted
                  </span>
                ) : (
                  <button 
                    onClick={requestMicrophone}
                    disabled={micStatus === 'checking'}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {micStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Allow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Mobile Notifications */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            notifStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  notifStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">Mobile Notifications</h4>
                  <p className="text-[11px] text-slate-400">Shift status alerts, daily targets, and sync reminders</p>
                </div>
              </div>
              <div>
                {notifStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                    <Check size={12} /> Granted
                  </span>
                ) : (
                  <button 
                    onClick={requestNotification}
                    disabled={notifStatus === 'checking'}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    {notifStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 'Allow'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. Storage Space & Offline DB */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            storageStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  storageStatus === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">Storage Space & Offline Cache</h4>
                  <p className="text-[11px] text-slate-400">Persistent local storage for visits & firm catalogs</p>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                  <Check size={12} /> Available
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Master Action Button */}
        <div className="space-y-3">
          <button
            onClick={coreGranted ? onPermissionsGranted : handleGrantAll}
            disabled={isProcessing}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 ${
              coreGranted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Authorizing App Permissions...
              </>
            ) : coreGranted ? (
              <>
                <CheckCircle2 size={18} /> Proceed to Portal <ArrowRight size={16} />
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Authorize All 5 Permissions
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-5">
          Sundaram Mahadeo Group Security & Audit Infrastructure • All sensor interactions are encrypted and verified.
        </p>
      </div>
    </div>
  );
}

/**
 * Component 2: One-time First Launch / Install Permission Prompt Banner
 */
export function InitialInstallPermissionsModal({ onDismiss }) {
  const [isOpen, setIsOpen] = useState(() => {
    const hasInitialized = localStorage.getItem('smm_initial_permissions_prompted');
    return !hasInitialized;
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGrant = async () => {
    setIsProcessing(true);
    await requestAllAppPermissions();
    setIsProcessing(false);
    localStorage.setItem('smm_initial_permissions_prompted', 'true');
    setIsOpen(false);
    if (onDismiss) onDismiss();
  };

  const handleSkip = () => {
    localStorage.setItem('smm_initial_permissions_prompted', 'true');
    setIsOpen(false);
    if (onDismiss) onDismiss();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Welcome to SMM - FMA</h3>
            <p className="text-xs text-slate-400">Sundaram Mahadeo Field Management</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          To enable live GPS tracking, instant odometer camera proofs, audio notes, persistent offline storage, and push shift notifications, please authorize the initial hardware permissions.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-5 text-[11px] font-semibold text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <MapPin size={14} className="text-blue-400 shrink-0" /> GPS & Location
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <Camera size={14} className="text-purple-400 shrink-0" /> Camera Proofs
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <Mic size={14} className="text-amber-400 shrink-0" /> Voice Remarks
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <Bell size={14} className="text-cyan-400 shrink-0" /> Push Alerts
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleGrant}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-98"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={16} />}
            {isProcessing ? 'Prompting Device Sensors...' : 'Grant App Permissions'}
          </button>
          <button
            onClick={handleSkip}
            type="button"
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component 3: Fallback Mid-Shift Lock-Screen Overlay
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
  InitialInstallPermissionsModal,
  RevokedPermissionsOverlay,
  checkStorageAvailable
};
