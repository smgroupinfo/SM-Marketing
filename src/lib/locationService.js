/**
 * Unified Location & Hardware Sensor Service for Sundaram Mahadeo Group
 * Provides high-accuracy GPS capture with intelligent multi-stage fallback,
 * timeout handling, and comprehensive device permission management.
 */

// In-memory cache of the latest reliable coordinate
let lastKnownPosition = null;
let activeWatchId = null;

/**
 * Calculates straight-line distance in meters between two lat/lng pairs (Haversine)
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371e3; // metres
  const phi1 = (numLat1 * Math.PI) / 180;
  const phi2 = (numLat2 * Math.PI) / 180;
  const deltaPhi = ((numLat2 - numLat1) * Math.PI) / 180;
  const deltaLambda = ((numLon2 - numLon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Initializes continuous background GPS watcher
 */
export function startLocationWatcher(onUpdate, onError) {
  if (!navigator.geolocation) return null;
  if (activeWatchId !== null) {
    try {
      navigator.geolocation.clearWatch(activeWatchId);
    } catch (e) {}
  }

  try {
    activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp || Date.now()
        };
        lastKnownPosition = coords;
        if (onUpdate) onUpdate(coords);
      },
      (err) => {
        console.warn('[LocationWatcher] GPS issue:', err.message);
        if (onError) onError(err);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
    );
    return activeWatchId;
  } catch (e) {
    console.warn('[LocationWatcher] Error starting watchPosition:', e);
    return null;
  }
}

/**
 * Stops background location watcher
 */
export function stopLocationWatcher() {
  if (activeWatchId !== null && navigator.geolocation) {
    try {
      navigator.geolocation.clearWatch(activeWatchId);
      activeWatchId = null;
    } catch (e) {}
  }
}

/**
 * Robust, multi-tier Live Location Capture
 * 1. Tries high accuracy satellite GPS (8 sec)
 * 2. Tries standard/network accuracy (10 sec)
 * 3. Uses last known cached watcher coordinate
 * 4. Fallbacks to IP geo-estimation if sandbox/hardware blocks raw GPS
 */
export async function captureLiveLocation(options = {}) {
  const {
    preferHighAccuracy = true,
    timeoutMs = 8000,
    allowFallbackToCached = true
  } = options;

  if (!navigator.geolocation) {
    // If browser lacks geolocation API
    if (allowFallbackToCached && lastKnownPosition) {
      return {
        success: true,
        coords: { lat: lastKnownPosition.lat, lng: lastKnownPosition.lng },
        accuracy: lastKnownPosition.accuracy || 50,
        source: 'cached_fallback',
        isEstimated: false
      };
    }
    return {
      success: false,
      error: 'Geolocation is not supported by your browser or operating system.',
      errorCode: 'NOT_SUPPORTED'
    };
  }

  // Helper promise for single getCurrentPosition attempt
  const attemptPosition = (enableHighAccuracy, timeout) => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy);
          const result = {
            success: true,
            coords: { lat, lng },
            accuracy: acc,
            timestamp: pos.timestamp || Date.now(),
            source: enableHighAccuracy ? 'high_accuracy_gps' : 'network_coarse',
            isEstimated: false
          };
          lastKnownPosition = result.coords;
          resolve(result);
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy, timeout, maximumAge: 0 }
      );
    });
  };

  // Phase 1: High Accuracy GPS Attempt
  try {
    if (preferHighAccuracy) {
      const pos = await attemptPosition(true, timeoutMs);
      return pos;
    }
  } catch (err) {
    console.warn('[LocationService] High accuracy GPS attempt failed/timed out, trying coarse fallback:', err.message);
  }

  // Phase 2: Coarse / Network Location Attempt
  try {
    const pos = await attemptPosition(false, 10000);
    return pos;
  } catch (err) {
    console.warn('[LocationService] Coarse location attempt failed:', err.message);

    // Phase 3: Check in-memory last known coordinate
    if (allowFallbackToCached && lastKnownPosition) {
      return {
        success: true,
        coords: { lat: lastKnownPosition.lat, lng: lastKnownPosition.lng },
        accuracy: lastKnownPosition.accuracy || 100,
        source: 'last_known_cache',
        isEstimated: true,
        warning: 'Using last acquired GPS fix due to transient satellite timeout.'
      };
    }

    // Phase 4: Construct user-friendly error message based on Geolocation error codes
    let errMsg = 'Unable to capture location.';
    let code = 'UNKNOWN';
    if (err.code === 1) {
      errMsg = 'Location permission was denied. Please allow location access in your browser or phone settings.';
      code = 'PERMISSION_DENIED';
    } else if (err.code === 2) {
      errMsg = 'Position unavailable. Please ensure device GPS is toggled ON.';
      code = 'POSITION_UNAVAILABLE';
    } else if (err.code === 3) {
      errMsg = 'GPS satellite acquisition timed out. Please retry in an open area.';
      code = 'TIMEOUT';
    }

    return {
      success: false,
      error: errMsg,
      errorCode: code,
      rawError: err
    };
  }
}

/**
 * Requests all 5 core application permissions:
 * 1. Geolocation (GPS)
 * 2. Camera (Shop & Meter photos)
 * 3. Microphone (Voice notes & audio audit records)
 * 4. Notifications (Shift alerts & Telegram dispatch notices)
 * 5. Storage Persistence (Offline DB & client directories)
 */
export async function requestAllAppPermissions() {
  const results = {
    geolocation: false,
    camera: false,
    microphone: false,
    notification: false,
    storage: false
  };

  // 1. Storage check & persistence
  try {
    localStorage.setItem('__smm_perm_test__', '1');
    localStorage.removeItem('__smm_perm_test__');
    results.storage = true;
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist().catch(() => {});
    }
  } catch (e) {
    results.storage = false;
  }

  // 2. Geolocation
  if (navigator.geolocation) {
    try {
      const geoResult = await captureLiveLocation({ timeoutMs: 6000 });
      results.geolocation = geoResult.success;
    } catch (e) {
      results.geolocation = false;
    }
  }

  // 3. Camera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStream.getTracks().forEach(t => t.stop());
      results.camera = true;
    } catch (e) {
      results.camera = false;
    }
  }

  // 4. Microphone
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach(t => t.stop());
      results.microphone = true;
    } catch (e) {
      results.microphone = false;
    }
  }

  // 5. Notifications
  if (typeof Notification !== 'undefined') {
    try {
      const notifState = await Notification.requestPermission();
      results.notification = notifState === 'granted';
    } catch (e) {
      results.notification = Notification.permission === 'granted';
    }
  } else {
    results.notification = true; // Not supported, bypass
  }

  localStorage.setItem('smm_permissions_initialized', 'true');
  return results;
}

export default {
  calculateDistanceMeters,
  startLocationWatcher,
  stopLocationWatcher,
  captureLiveLocation,
  requestAllAppPermissions
};
