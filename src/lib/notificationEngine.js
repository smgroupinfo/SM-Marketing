/**
 * Unified Notification & Audio Feedback Engine for Sundaram Mahadeo Group
 * - Web Push Notifications (Service Worker & Notification API)
 * - Synthetic Web Audio Chime synthesizer (instant sound without external assets)
 * - Mobile Haptic Vibration feedback
 * - Interactive In-App Push Notification Toast System
 */

// Simple event bus for in-app push toasts
const toastSubscribers = new Set();

export function subscribeToPushToasts(callback) {
  toastSubscribers.add(callback);
  return () => toastSubscribers.delete(callback);
}

export function dispatchInAppToast(toast) {
  const fullToast = {
    id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title: toast.title || 'SMM Alert',
    message: toast.message || '',
    type: toast.type || 'info', // 'info' | 'success' | 'warning' | 'error' | 'broadcast'
    timestamp: new Date().toLocaleTimeString(),
    duration: toast.duration || 5000,
    ...toast
  };

  toastSubscribers.forEach(cb => {
    try {
      cb(fullToast);
    } catch (e) {
      console.warn('Toast subscriber error:', e);
    }
  });

  return fullToast;
}

/**
 * Web Audio Synthesizer: Plays crisp notification chimes natively
 */
export function playNotificationChime(type = 'default') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success' || type === 'granted') {
      // Ascending two-tone chime (E5 -> B5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert' || type === 'warning' || type === 'broadcast') {
      // Double pulse alert (A5 -> F5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(698.46, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Clean single ping (C6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.debug('Audio chime skipped:', e.message);
  }
}

/**
 * Mobile Device Vibration
 */
export function triggerHapticFeedback(pattern = [100, 50, 100]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

/**
 * Checks current Notification Permission state safely
 */
export function getNotificationPermissionStatus() {
  if (typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission; // 'granted', 'denied', 'default'
}

/**
 * Requests Notification permission with fallback handling
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return {
      status: 'unsupported',
      granted: false,
      message: 'Web Notifications API is not supported on this browser.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      playNotificationChime('granted');
      triggerHapticFeedback([120, 60, 120]);
    }
    return {
      status: permission,
      granted,
      message: granted ? 'Notifications enabled successfully!' : 'Notification permission was not granted.'
    };
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return {
      status: 'denied',
      granted: false,
      message: err.message || 'Failed to request notification permission.'
    };
  }
}

/**
 * Comprehensive Multi-Channel Notification Dispatcher:
 * 1. Plays sound chime
 * 2. Vibrate mobile phone
 * 3. Shows rich In-App Push Toast
 * 4. Tries ServiceWorker showNotification (Android/PWA) or native Notification
 */
export async function sendMobilePushNotification(title, body, options = {}) {
  const {
    type = 'info',
    sound = true,
    vibrate = true,
    data = {},
    icon = '/icon.svg',
    tag = 'smm-alert-' + Date.now()
  } = options;

  // 1. Play Audio Feedback
  if (sound) {
    playNotificationChime(type);
  }

  // 2. Mobile Haptic Vibration
  if (vibrate) {
    triggerHapticFeedback(type === 'broadcast' ? [200, 100, 200] : [100, 50, 100]);
  }

  // 3. Always show interactive In-App Toast
  dispatchInAppToast({
    title,
    message: body,
    type,
    data
  });

  // 4. Try OS-Level Push Notification (Service Worker or Notification API)
  let osNotificationSent = false;

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    // Try Service Worker registration first (Required for Chrome on Android)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag,
            vibrate: [100, 50, 100],
            data: { url: window.location.href, ...data }
          });
          osNotificationSent = true;
        }
      } catch (swErr) {
        console.warn('Service worker notification fallback:', swErr.message);
      }
    }

    // If Service Worker didn't send (e.g. desktop non-SW), try standard Notification constructor
    if (!osNotificationSent) {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          tag,
          data
        });
        notif.onclick = function () {
          window.focus();
          notif.close();
        };
        osNotificationSent = true;
      } catch (nErr) {
        console.debug('Standard Notification constructor unavailable (common on mobile):', nErr.message);
      }
    }
  }

  return {
    success: true,
    osNotificationSent,
    inAppToastShown: true
  };
}

/**
 * Triggers an immediate interactive test notification with sound, vibration, and toast
 */
export async function triggerTestNotification(customMessage) {
  const result = await sendMobilePushNotification(
    '🔔 SMM Mobile Push Test',
    customMessage || 'Mobile notification engine is fully active with audio chime and haptic feedback.',
    {
      type: 'broadcast',
      sound: true,
      vibrate: true
    }
  );
  return result;
}

export default {
  subscribeToPushToasts,
  dispatchInAppToast,
  playNotificationChime,
  triggerHapticFeedback,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendMobilePushNotification,
  triggerTestNotification
};
