import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, Camera, Mic, Bell, Database, ShieldAlert, ShieldCheck, CheckCircle2, 
  AlertCircle, XCircle, RefreshCw, Lock, ArrowRight, Smartphone,
  Info, AlertTriangle, Check, Volume2, Sparkles, HardDrive, ExternalLink,
  Video, MicOff, Play, Square, Radio, HelpCircle, ChevronDown, ChevronUp, ChevronRight, Scale
} from 'lucide-react';
import { captureLiveLocation } from '../lib/locationService';
import IndianStatutoryComplianceModal from './IndianStatutoryComplianceModal';
import { 
  requestNotificationPermission, 
  sendMobilePushNotification, 
  triggerTestNotification, 
  getNotificationPermissionStatus,
  playNotificationChime,
  triggerHapticFeedback
} from '../lib/notificationEngine';

/**
 * Storage verification helper
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
  const [locationStatus, setLocationStatus] = useState('prompt');
  const [locationDetails, setLocationDetails] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('prompt');
  const [micStatus, setMicStatus] = useState('prompt');
  const [notifStatus, setNotifStatus] = useState('prompt');
  const [storageStatus, setStorageStatus] = useState('checking');
  
  // Live camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Live audio analyser state
  const [isMicActive, setIsMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [dpdpConsentGiven, setDpdpConsentGiven] = useState(false); // DPDP Act 2023 strictly requires unchecked opt-in consent by default

  // Clean up any hardware streams on unmount
  useEffect(() => {
    return () => {
      stopCameraPreview();
      stopMicPreview();
    };
  }, []);

  const stopCameraPreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const stopMicPreview = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setIsMicActive(false);
    setAudioLevel(0);
  };

  // Passive initial check
  useEffect(() => {
    const storageOk = checkStorageAvailable();
    setStorageStatus(storageOk ? 'granted' : 'denied');

    const curNotif = getNotificationPermissionStatus();
    setNotifStatus(curNotif === 'granted' ? 'granted' : curNotif === 'denied' ? 'denied' : 'prompt');

    const checkPassive = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' });
          setLocationStatus(geo.state);
          geo.onchange = () => setLocationStatus(geo.state);
        } catch (e) {}

        try {
          const notif = await navigator.permissions.query({ name: 'notifications' });
          setNotifStatus(notif.state);
          notif.onchange = () => setNotifStatus(notif.state);
        } catch (e) {}
      }
    };
    checkPassive();
  }, []);

  // 1. Request / Test Location
  const requestLocation = async () => {
    setLocationStatus('checking');
    setErrorMessage('');
    const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 9000 });
    if (res.success && res.coords) {
      setLocationStatus('granted');
      setLocationDetails(res);
      playNotificationChime('granted');
      triggerHapticFeedback([80, 40, 80]);
      return true;
    } else {
      setLocationStatus('denied');
      setErrorMessage(res.error || 'Could not acquire GPS coordinates. Please ensure Location is enabled in your browser/device.');
      return false;
    }
  };

  // 2. Request / Test Camera with live preview
  const requestCamera = async () => {
    setCameraStatus('checking');
    setErrorMessage('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('denied');
      setErrorMessage('Camera hardware interface is not supported on this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      setCameraStatus('granted');
      setIsCameraActive(true);
      playNotificationChime('granted');
      triggerHapticFeedback([80, 40, 80]);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn('Camera request issue:', err);
      setCameraStatus('denied');
      setErrorMessage('Camera access was denied or is in use by another app. Please allow camera access in browser site settings.');
      return false;
    }
  };

  // 3. Request / Test Microphone with live decibel meter
  const requestMicrophone = async () => {
    setMicStatus('checking');
    setErrorMessage('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('denied');
      setErrorMessage('Microphone interface not supported.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicStatus('granted');
      setIsMicActive(true);
      playNotificationChime('granted');
      triggerHapticFeedback([80, 40, 80]);

      // Set up AudioContext analyser for live audio level meter
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!micStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
      return true;
    } catch (err) {
      console.warn('Microphone request issue:', err);
      setMicStatus('denied');
      setErrorMessage('Microphone permission was denied. Please allow microphone in browser settings.');
      return false;
    }
  };

  // 4. Request / Test Notifications
  const requestNotification = async () => {
    setNotifStatus('checking');
    const res = await requestNotificationPermission();
    setNotifStatus(res.granted ? 'granted' : 'denied');
    
    // Always trigger interactive test notification so user sees immediate feedback
    await triggerTestNotification('Mobile notifications are active! Sound chime and push toast verified.');
    return res.granted;
  };

  // Master 'Authorize All Sensors'
  const handleAuthorizeAll = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    await requestLocation();
    await requestCamera();
    await requestMicrophone();
    await requestNotification();

    setIsProcessing(false);

    if (locationStatus === 'granted' && cameraStatus === 'granted') {
      localStorage.setItem('smm_permissions_initialized', 'true');
      stopCameraPreview();
      stopMicPreview();
      onPermissionsGranted();
    }
  };

  const isCoreReady = locationStatus === 'granted' && cameraStatus === 'granted';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6">
      <div className="max-w-xl w-full bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800 my-4">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            <Smartphone size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            App & Sensor Permissions
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Sundaram Mahadeo Group requires GPS, Camera, Microphone, and Push alerts for field dispatch, shop visits, and audit verification.
          </p>
        </div>

        {/* Dedicated Tab Banner (Useful for iFrames / Previews) */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-200">
            <Sparkles size={16} className="text-blue-400 shrink-0" />
            <span>Need OS-level permissions in Chrome / Safari?</span>
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <span>Open Dedicated Tab</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs font-semibold flex items-start gap-2.5 shadow-lg">
            <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="font-bold text-red-100 mb-0.5">Permission Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 5 Hardware Sensor Tiles */}
        <div className="space-y-3 mb-5">
          
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
                  <p className="text-[11px] text-slate-400">Live dealer distance calculation & geofencing</p>
                </div>
              </div>
              <div>
                {locationStatus === 'granted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold">
                    <Check size={13} /> Active
                  </span>
                ) : (
                  <button 
                    onClick={requestLocation}
                    disabled={locationStatus === 'checking'}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    {locationStatus === 'checking' ? <RefreshCw size={13} className="animate-spin" /> : 'Allow & Test'}
                  </button>
                )}
              </div>
            </div>

            {/* GPS details if acquired */}
            {locationStatus === 'granted' && locationDetails?.coords && (
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-[11px] text-emerald-200">
                <span>Lat: {locationDetails.coords.lat}° N, Lng: {locationDetails.coords.lng}° E</span>
                <span className="font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  ±{locationDetails.accuracy || 15}m accuracy ({locationDetails.source || 'GPS Satellite'})
                </span>
              </div>
            )}
          </div>

          {/* 2. Camera Access */}
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
                  <p className="text-[11px] text-slate-400">Odometer meter readings & shopfront photos</p>
                </div>
              </div>
              <div>
                {cameraStatus === 'granted' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold">
                      <Check size={13} /> Active
                    </span>
                    {!isCameraActive ? (
                      <button
                        onClick={requestCamera}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        onClick={stopCameraPreview}
                        className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 rounded-lg text-[10px] font-semibold"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={requestCamera}
                    disabled={cameraStatus === 'checking'}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    {cameraStatus === 'checking' ? <RefreshCw size={13} className="animate-spin" /> : 'Allow & Test'}
                  </button>
                )}
              </div>
            </div>

            {/* Live Camera Viewfinder if active */}
            {isCameraActive && (
              <div className="mt-3 relative rounded-xl overflow-hidden bg-black border border-purple-500/40 aspect-video max-h-48 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Viewfinder Feed
                </div>
              </div>
            )}
          </div>

          {/* 3. Microphone Access */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            micStatus === 'granted'
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : micStatus === 'denied'
              ? 'bg-red-950/20 border-red-500/40'
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
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold">
                      <Check size={13} /> Active
                    </span>
                    {!isMicActive ? (
                      <button
                        onClick={requestMicrophone}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold"
                      >
                        Meter
                      </button>
                    ) : (
                      <button
                        onClick={stopMicPreview}
                        className="px-2 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 rounded-lg text-[10px] font-semibold"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={requestMicrophone}
                    disabled={micStatus === 'checking'}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    {micStatus === 'checking' ? <RefreshCw size={13} className="animate-spin" /> : 'Allow & Test'}
                  </button>
                )}
              </div>
            </div>

            {/* Live Audio Decibel Meter */}
            {isMicActive && (
              <div className="mt-3 p-2.5 bg-slate-900/90 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-between text-[11px] text-amber-300 mb-1">
                  <span className="flex items-center gap-1"><Volume2 size={12} /> Speak into mic to test</span>
                  <span className="font-mono font-bold">{audioLevel}% Vol</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full transition-all duration-75"
                    style={{ width: `${Math.max(5, audioLevel)}%` }}
                  />
                </div>
              </div>
            )}
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
                  <h4 className="font-bold text-xs sm:text-sm text-white">Mobile Push Notifications</h4>
                  <p className="text-[11px] text-slate-400">Shift alerts, audio chimes & Telegram dispatch notices</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={requestNotification}
                  disabled={notifStatus === 'checking'}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                >
                  {notifStatus === 'checking' ? <RefreshCw size={13} className="animate-spin" /> : <Play size={11} />}
                  <span>Test Push & Sound</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Storage Space */}
          <div className="p-3.5 rounded-2xl border bg-slate-800/60 border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400">
                <HardDrive size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">Storage Space & Offline Cache</h4>
                <p className="text-[11px] text-slate-400">Persistent local storage for visits & firm catalogs</p>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold">
                <Check size={13} /> Ready
              </span>
            </div>
          </div>

        </div>

        {/* DPDP Act 2023 Statutory Consent & Compliance Notice */}
        <div className="mb-4 p-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl space-y-2">
          <div className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              id="dpdp-consent"
              checked={dpdpConsentGiven}
              onChange={(e) => setDpdpConsentGiven(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-600"
            />
            <label htmlFor="dpdp-consent" className="text-[11px] text-slate-300 cursor-pointer">
              I consent under India's <strong>DPDP Act 2023</strong> to GPS tracking &amp; camera capture strictly during active shift hours for enterprise travel reimbursement and dealer visit verification.
            </label>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">Purpose-limited to official shift duty</span>
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
            >
              <Scale size={11} />
              <span>Read Statutory Compliance &amp; Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Master Action Button */}
        <div className="space-y-2.5">
          <button
            onClick={isCoreReady ? () => { stopCameraPreview(); stopMicPreview(); onPermissionsGranted(); } : handleAuthorizeAll}
            disabled={isProcessing || !dpdpConsentGiven}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 ${
              !dpdpConsentGiven
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isCoreReady
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Authorizing Device Sensors...
              </>
            ) : isCoreReady ? (
              <>
                <CheckCircle2 size={18} /> Enter SMM Field Portal <ArrowRight size={16} />
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Authorize All Sensors Now
              </>
            )}
          </button>

          {/* Expandable Browser Settings Guide */}
          <button
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            type="button"
            className="w-full text-center text-xs text-slate-400 hover:text-slate-300 py-1.5 flex items-center justify-center gap-1 transition-colors"
          >
            <HelpCircle size={13} />
            <span>How to enable permissions in Chrome / Safari settings</span>
            {showHelpGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showHelpGuide && (
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-[11px] text-slate-300 space-y-2 animate-in fade-in">
              <p className="font-bold text-white">Browser Site Settings Guide:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Google Chrome / Edge:</strong> Tap the lock or tune icon on the left of the URL address bar &gt; Tap <em>Site Settings / Permissions</em> &gt; Set <strong>Location, Camera, Microphone, and Notifications</strong> to <em>Allow</em>.</li>
                <li><strong className="text-slate-200">Mobile Safari (iOS):</strong> Tap the <em>aA</em> icon in the address bar &gt; <em>Website Settings</em> &gt; Set <strong>Camera, Microphone, and Location</strong> to <em>Allow</em>.</li>
                <li><strong className="text-slate-200">Android Chrome App:</strong> Tap the 3 dots (Menu) &gt; <em>Settings</em> &gt; <em>Site Settings</em> &gt; Ensure Location &amp; Camera are enabled.</li>
              </ul>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-4">
          Sundaram Mahadeo Group Security &amp; Audit Infrastructure • DPDP Act 2023 &amp; IT Act 2000 Compliant.
        </p>

        {/* Indian Statutory Compliance Modal */}
        <IndianStatutoryComplianceModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          user={user}
        />
      </div>
    </div>
  );
}

/**
 * Component 2: Interactive Permission & Diagnostics Hub Modal (Accessible anytime from top bar)
 */
export function DevicePermissionsHubModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative max-w-xl w-full my-auto">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border border-slate-700 shadow-xl"
        >
          <XCircle size={20} />
        </button>
        <PermissionsCheckScreen
          user={{}}
          onPermissionsGranted={onClose}
        />
      </div>
    </div>
  );
}

/**
 * Component 3: One-time First Launch Permission Prompt Modal
 */
export function InitialInstallPermissionsModal({ onDismiss }) {
  const [isOpen, setIsOpen] = useState(() => {
    const hasInitialized = localStorage.getItem('smm_initial_permissions_prompted');
    return !hasInitialized;
  });

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('smm_initial_permissions_prompted', 'true');
    setIsOpen(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative max-w-xl w-full my-auto">
        <PermissionsCheckScreen
          user={{}}
          onPermissionsGranted={handleClose}
        />
      </div>
    </div>
  );
}

/**
 * Component 4: Mid-Shift Fallback Overlay
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
          Field executives must keep Location (GPS) and Camera permissions active at all times during an active shift.
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
  DevicePermissionsHubModal,
  InitialInstallPermissionsModal,
  RevokedPermissionsOverlay,
  checkStorageAvailable
};
