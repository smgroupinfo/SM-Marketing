import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, 
  Database, ShieldCheck, ArrowUpCircle, Layers, X, Clock,
  FileText, ExternalLink, ChevronDown, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { 
  getSyncQueueSummary, 
  triggerBackgroundSync, 
  subscribeToSyncState 
} from '../lib/offlineSyncEngine';

export default function OfflineSyncIndicator() {
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingTotal: 0,
    pendingVisits: 0,
    pendingShifts: 0,
    queuedVisitsList: [],
    queuedShiftsList: [],
    recentLogs: []
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  useEffect(() => {
    // Initial summary
    getSyncQueueSummary().then(setSyncState);

    // Subscribe to internal sync state
    const unsubscribe = subscribeToSyncState(setSyncState);

    // Network listeners
    const handleOnline = () => {
      setSyncFeedback('Network restored. Background sync initiating...');
      getSyncQueueSummary().then(summary => {
        setSyncState(prev => ({ ...prev, isOnline: true }));
        // Automatically trigger sync when back online
        triggerBackgroundSync(api).then(res => {
          if (res.success) {
            setSyncFeedback(`Successfully synchronized ${res.syncedVisitsCount} visits & ${res.syncedShiftsCount} shifts.`);
          }
          setTimeout(() => setSyncFeedback(''), 5000);
        });
      });
    };

    const handleOffline = () => {
      setSyncFeedback('Offline mode active. All shifts, visits & photos safely queued in local IndexedDB.');
      getSyncQueueSummary().then(setSyncState);
      setTimeout(() => setSyncFeedback(''), 6000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      getSyncQueueSummary().then(setSyncState);
    }, 15000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleForceSync = async () => {
    setSyncFeedback('Synchronizing local database with central cloud server...');
    const res = await triggerBackgroundSync(api);
    if (res.success) {
      setSyncFeedback(`Sync complete! ${res.syncedVisitsCount} visits and ${res.syncedShiftsCount} shifts uploaded without conflicts.`);
    } else {
      setSyncFeedback(res.message || res.error || 'Sync deferred (network offline).');
    }
    getSyncQueueSummary().then(setSyncState);
    setTimeout(() => setSyncFeedback(''), 5000);
  };

  const { isOnline, isSyncing, pendingTotal, pendingVisits, pendingShifts, queuedVisitsList } = syncState;

  return (
    <>
      {/* Top Banner or Capsule Widget */}
      <div className="flex items-center gap-2">
        {/* Status Pill Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
            !isOnline
              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
              : pendingTotal > 0
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
          }`}
          title="Click to open Offline Database & Sync Manager"
        >
          {!isOnline ? (
            <>
              <WifiOff size={14} className="animate-bounce" />
              <span>Offline ({pendingTotal} Queued)</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw size={14} className="animate-spin text-white" />
              <span>Syncing ({pendingTotal})...</span>
            </>
          ) : pendingTotal > 0 ? (
            <>
              <ArrowUpCircle size={14} className="text-amber-300" />
              <span>{pendingTotal} Pending Sync</span>
            </>
          ) : (
            <>
              <Wifi size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Offline-First Engine:</span>
              <span>Synced</span>
            </>
          )}
        </button>

        {/* Quick Sync Button if pending */}
        {isOnline && pendingTotal > 0 && (
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full border border-blue-400/40 transition-colors"
            title="Force Synchronize Now"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Floating Feedback Notification */}
      {syncFeedback && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-sm">
          <Database size={18} className="text-blue-400 flex-shrink-0" />
          <span className="flex-1">{syncFeedback}</span>
          <button onClick={() => setSyncFeedback('')} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* OFFLINE DATABASE SYNC MANAGER DRAWER / MODAL */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* DRAWER HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Offline SQLite & IndexedDB Engine
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Local Database Sync Manager
                </h3>
                <p className="text-xs text-slate-300">
                  Rural Mining Belt Resilient Offline Storage & Automatic Conflict Resolver
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* STATUS SUMMARY BANNER */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Connection</span>
                <span className={`font-black ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isOnline ? 'Online (4G/WiFi)' : 'Offline (Local IDB)'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Queued Visits</span>
                <span className="font-black text-slate-800 font-mono text-sm">{pendingVisits}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Queued Shifts</span>
                <span className="font-black text-slate-800 font-mono text-sm">{pendingShifts}</span>
              </div>
            </div>

            {/* QUEUED ITEMS LIST */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Pending Outbox Queue ({pendingTotal})</span>
                  {pendingTotal === 0 && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      All Records Synced
                    </span>
                  )}
                </h4>

                {pendingTotal === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center text-emerald-800 space-y-1">
                    <ShieldCheck size={28} className="mx-auto text-emerald-600" />
                    <p className="font-bold">No pending records in offline queue.</p>
                    <p className="text-[11px] text-emerald-700">
                      All local transactions, photos, and odometer logs have been verified and pushed to the cloud server.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queuedVisitsList.map((item, idx) => (
                      <div key={item.localId || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 truncate max-w-[240px]">
                            {item.firmName || item.clientName || 'Logged Visit'}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>₹{parseFloat(item.orderValue || item.collectedAmount || 0).toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{item.purpose || 'Visit'}</span>
                          </p>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-200">
                          {item.syncStatus || 'QUEUED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ARCHITECTURE HIGHLIGHTS */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  Rural Mining Belt Offline Capabilities:
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Zero-Data Loss Guarantee:</strong> Shifts, GPS stamps, and visits are written to browser IndexedDB before network dispatch.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>High-Resolution Photo Buffer:</strong> Camera captures of odometers & receipts are stored without localStorage quota limits.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Conflict Resolver:</strong> Deduplicates records using client-generated UUID hashes when reconnecting.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-1/3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition-all text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleForceSync}
                disabled={!isOnline || isSyncing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Synchronizing...' : 'Force Push to Cloud Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
