/**
 * OFFLINE-FIRST INDEXEDDB SYNC ENGINE
 * Built for deep rural/mining belt field operations with zero connectivity.
 * Manages local database replication, photo persistence, and conflict resolution.
 */

const DB_NAME = 'SundaramMahadeoGroup_OfflineDB';
const DB_VERSION = 1;

// Object Store Names
export const STORES = {
  VISITS: 'visits_queue',
  SHIFTS: 'shifts_queue',
  FIRMS: 'firms_cache',
  CONFIG: 'config_cache',
  SYNC_LOGS: 'sync_logs'
};

// Initialize or Upgrade IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store 1: Offline Visits Queue
      if (!db.objectStoreNames.contains(STORES.VISITS)) {
        const visitStore = db.createObjectStore(STORES.VISITS, { keyPath: 'localId' });
        visitStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        visitStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store 2: Offline Shifts Queue
      if (!db.objectStoreNames.contains(STORES.SHIFTS)) {
        const shiftStore = db.createObjectStore(STORES.SHIFTS, { keyPath: 'localId' });
        shiftStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // Store 3: Local Cached Firms
      if (!db.objectStoreNames.contains(STORES.FIRMS)) {
        db.createObjectStore(STORES.FIRMS, { keyPath: 'id' });
      }

      // Store 4: Config & Matrix Cache
      if (!db.objectStoreNames.contains(STORES.CONFIG)) {
        db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      }

      // Store 5: Sync Logs & Conflict Audit Trail
      if (!db.objectStoreNames.contains(STORES.SYNC_LOGS)) {
        const logStore = db.createObjectStore(STORES.SYNC_LOGS, { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => {
      console.warn('[IndexedDB Error]', event.target.error);
      resolve(null); // Fallback to localStorage gracefully
    };
  });
}

// ==============================================================================
// CORE CRUD HELPERS FOR INDEXEDDB WITH LOCALSTORAGE FALLBACK
// ==============================================================================

export async function idbSave(storeName, item) {
  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => {
          console.warn('[IDB Save Error]', e);
          resolve(false);
        };
      });
    }
  } catch (e) {
    console.warn('[IDB Save Exception]', e);
  }

  // LocalStorage Fallback
  try {
    const key = `idb_fallback_${storeName}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const pk = item.localId || item.id || item.key;
    const filtered = items.filter(x => (x.localId || x.id || x.key) !== pk);
    filtered.push(item);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {}
  return true;
}

export async function idbGetAll(storeName) {
  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    }
  } catch (e) {
    console.warn('[IDB GetAll Exception]', e);
  }

  // Fallback
  try {
    const key = `idb_fallback_${storeName}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (err) {
    return [];
  }
}

export async function idbDelete(storeName, keyVal) {
  try {
    const db = await openDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(keyVal);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (e) {}

  try {
    const key = `idb_fallback_${storeName}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = items.filter(x => (x.localId || x.id || x.key) !== keyVal);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {}
  return true;
}

// ==============================================================================
// OFFLINE VISITS QUEUE & CONFLICT RESOLUTION
// ==============================================================================

/**
 * Enqueue a visit logged while offline or online
 */
export async function queueOfflineVisit(visitData) {
  const localId = 'offline_visit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const queuedItem = {
    ...visitData,
    localId,
    id: visitData.id || localId,
    syncStatus: 'QUEUED', // 'QUEUED' | 'SYNCING' | 'SYNCED' | 'CONFLICT_RESOLVED'
    queuedAt: new Date().toISOString(),
    retryCount: 0
  };

  await idbSave(STORES.VISITS, queuedItem);
  
  // Also keep localStorage user_visits synced for instant UI responsiveness
  try {
    const currentVisits = JSON.parse(localStorage.getItem('user_visits') || '[]');
    const updated = [queuedItem, ...currentVisits.filter(v => (v.id || v.localId) !== queuedItem.id)];
    localStorage.setItem('user_visits', JSON.stringify(updated));
  } catch (e) {}

  notifySyncStateChange();
  return queuedItem;
}

/**
 * Enqueue a shift start / close logged while offline
 */
export async function queueOfflineShift(shiftData, shiftAction = 'START') {
  const localId = 'offline_shift_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const queuedItem = {
    ...shiftData,
    localId,
    shiftAction, // 'START' | 'CLOSE'
    syncStatus: 'QUEUED',
    queuedAt: new Date().toISOString(),
    retryCount: 0
  };

  await idbSave(STORES.SHIFTS, queuedItem);
  notifySyncStateChange();
  return queuedItem;
}

// ==============================================================================
// SYNC ENGINE DISPATCHER & CONFLICT RESOLUTION
// ==============================================================================

let isSyncing = false;
const syncListeners = new Set();

export function subscribeToSyncState(callback) {
  syncListeners.add(callback);
  return () => syncListeners.delete(callback);
}

function notifySyncStateChange() {
  getSyncQueueSummary().then(summary => {
    syncListeners.forEach(fn => {
      try { fn(summary); } catch (e) {}
    });
    // Dispatch window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline_sync_status_updated', { detail: summary }));
    }
  });
}

export async function getSyncQueueSummary() {
  const [visits, shifts, logs] = await Promise.all([
    idbGetAll(STORES.VISITS),
    idbGetAll(STORES.SHIFTS),
    idbGetAll(STORES.SYNC_LOGS)
  ]);

  const pendingVisits = visits.filter(v => v.syncStatus === 'QUEUED' || v.syncStatus === 'SYNCING');
  const pendingShifts = shifts.filter(s => s.syncStatus === 'QUEUED' || s.syncStatus === 'SYNCING');
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    isOnline,
    isSyncing,
    pendingTotal: pendingVisits.length + pendingShifts.length,
    pendingVisits: pendingVisits.length,
    pendingShifts: pendingShifts.length,
    queuedVisitsList: pendingVisits,
    queuedShiftsList: pendingShifts,
    recentLogs: (logs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
  };
}

/**
 * Execute synchronization of all pending items with server/Supabase
 */
export async function triggerBackgroundSync(apiClient) {
  if (isSyncing) return { success: false, message: 'Sync already in progress' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, message: 'Network offline. Operations remain safely queued in IndexedDB.' };
  }

  isSyncing = true;
  notifySyncStateChange();

  const syncStartTime = Date.now();
  let syncedVisitsCount = 0;
  let syncedShiftsCount = 0;
  let conflictsResolved = 0;

  try {
    const [visits, shifts] = await Promise.all([
      idbGetAll(STORES.VISITS),
      idbGetAll(STORES.SHIFTS)
    ]);

    const pendingVisits = visits.filter(v => v.syncStatus === 'QUEUED' || v.syncStatus === 'SYNCING');
    const pendingShifts = shifts.filter(s => s.syncStatus === 'QUEUED' || s.syncStatus === 'SYNCING');

    // 1. Process Pending Shifts First (Ensures active shift exists before visits)
    for (const shift of pendingShifts) {
      try {
        shift.syncStatus = 'SYNCING';
        await idbSave(STORES.SHIFTS, shift);

        if (apiClient) {
          if (shift.shiftAction === 'START') {
            await apiClient.post('/shifts/start', {
              openingOdometer: shift.openingOdometer,
              openingPhoto: shift.openingPhoto,
              startLocation: shift.startLocation,
              startTime: shift.startTime || shift.queuedAt
            });
          } else {
            await apiClient.post('/shifts/close', {
              closingOdometer: shift.closingOdometer,
              closingPhoto: shift.closingPhoto,
              closeLocation: shift.closeLocation,
              endTime: shift.endTime || shift.queuedAt
            });
          }
        }

        // Successfully synced -> Remove from queue
        await idbDelete(STORES.SHIFTS, shift.localId);
        syncedShiftsCount++;
      } catch (err) {
        console.warn('[Sync Shift Error]', err);
        shift.syncStatus = 'QUEUED';
        shift.retryCount = (shift.retryCount || 0) + 1;
        await idbSave(STORES.SHIFTS, shift);
      }
    }

    // 2. Process Pending Visits
    for (const visit of pendingVisits) {
      try {
        visit.syncStatus = 'SYNCING';
        await idbSave(STORES.VISITS, visit);

        if (apiClient) {
          await apiClient.post('/visits', {
            ...visit,
            isOfflineSync: true,
            clientLocalId: visit.localId
          });
        }

        // Successfully synced -> Remove from queue
        await idbDelete(STORES.VISITS, visit.localId);
        syncedVisitsCount++;
      } catch (err) {
        // Smart Conflict Resolution: Check if already stored or duplicate
        const isDuplicate = err.response?.status === 409 || (err.message || '').includes('duplicate');
        if (isDuplicate) {
          conflictsResolved++;
          await idbDelete(STORES.VISITS, visit.localId);
        } else {
          console.warn('[Sync Visit Error]', err);
          visit.syncStatus = 'QUEUED';
          visit.retryCount = (visit.retryCount || 0) + 1;
          await idbSave(STORES.VISITS, visit);
        }
      }
    }

    // Log the sync event
    const logEntry = {
      id: 'sync_log_' + Date.now(),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - syncStartTime,
      syncedVisitsCount,
      syncedShiftsCount,
      conflictsResolved,
      status: 'SUCCESS'
    };
    await idbSave(STORES.SYNC_LOGS, logEntry);

    return {
      success: true,
      syncedVisitsCount,
      syncedShiftsCount,
      conflictsResolved,
      durationMs: Date.now() - syncStartTime
    };
  } catch (globalErr) {
    console.error('[Global Sync Error]', globalErr);
    return { success: false, error: globalErr.message };
  } finally {
    isSyncing = false;
    notifySyncStateChange();
  }
}

// ==============================================================================
// DYNAMIC NPCI UPI QR DEEP LINK BUILDER & VALIDATOR
// ==============================================================================

/**
 * Generates an official NPCI compliant UPI deep-link URI
 * Specification: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export function buildDynamicUpiUri({
  upiId = 'sundarammahadeo@icici',
  firmName = 'Sundaram Mahadeo Group',
  amount = '',
  transactionNote = '',
  transactionRef = ''
}) {
  const cleanUpi = (upiId || 'sundarammahadeo@icici').trim();
  const cleanName = (firmName || 'Sundaram Mahadeo Group').trim();
  const numAmount = parseFloat(amount);
  const formattedAmount = (!isNaN(numAmount) && numAmount > 0) ? numAmount.toFixed(2) : '';

  const note = transactionNote || `Invoice settlement for ${cleanName}`;
  const ref = transactionRef || `SMG-${Date.now().toString().slice(-6)}`;

  let uri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(ref)}`;
  
  if (formattedAmount) {
    uri += `&am=${formattedAmount}`;
  }

  return {
    uri,
    cleanUpi,
    cleanName,
    formattedAmount,
    note,
    ref
  };
}
