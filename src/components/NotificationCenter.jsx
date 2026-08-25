import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCheck, Send, AlertCircle, RefreshCw, 
  Sparkles, X, MessageSquare, Clock, Shield, User, Filter, Volume2, Play
} from 'lucide-react';
import { api } from '../lib/api';
import { sendMobilePushNotification, triggerTestNotification } from '../lib/notificationEngine';

export default function NotificationCenter({ user, isOpen, onClose, onCountUpdated }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, EOD, SYSTEM
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('ALL');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const list = res.data?.notifications || (Array.isArray(res.data) ? res.data : []);
      const formatted = list.map(n => ({
        ...n,
        isRead: Boolean(n.read || n.isRead)
      }));
      setNotifications(formatted);
      const unread = formatted.filter(n => !n.isRead).length;
      if (onCountUpdated) onCountUpdated(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-read', { markAll: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      if (onCountUpdated) onCountUpdated(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.post('/notifications/mark-read', { id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
      const remainingUnread = notifications.filter(n => n.id !== id && !n.isRead).length;
      if (onCountUpdated) onCountUpdated(remainingUnread);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setSendingBroadcast(true);
    setBroadcastSuccess('');
    try {
      await api.post('/notifications/send', {
        title: broadcastTitle,
        message: broadcastMessage,
        type: 'BROADCAST',
        targetUserId: broadcastTarget
      });
      // Trigger instant mobile push, sound chime & vibration
      sendMobilePushNotification(broadcastTitle, broadcastMessage, {
        type: 'broadcast',
        sound: true,
        vibrate: true
      });
      setBroadcastSuccess('Broadcast notification dispatched successfully.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setIsBroadcasting(false);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to send broadcast:', err);
      setBroadcastSuccess('Failed to send broadcast.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'EOD') return n.type === 'TELEGRAM_EOD' || n.type === 'MONTH_END';
    if (filter === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'BROADCAST';
    return true;
  });

  const unreadTotal = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Notifications & Alerts</h3>
                {unreadTotal > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    {unreadTotal} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Automated EOD telegrams & executive dispatches</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadTotal > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'UNREAD' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Unread ({unreadTotal})
            </button>
            <button
              onClick={() => setFilter('EOD')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'EOD' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Telegrams
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => triggerTestNotification('Test dispatch alert from SMM Notification Center.')}
              title="Test Mobile Push Notification with Audio Chime"
              className="px-2 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
            >
              <Volume2 size={12} />
              <span>Test Push</span>
            </button>
            <button
              onClick={fetchNotifications}
              title="Refresh"
              className="p-1 text-slate-500 hover:text-slate-900 rounded shrink-0"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Admin Broadcast Banner Action */}
        {user?.role === 'ADMIN' && (
          <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-600" /> Broadcast alert to team
            </span>
            <button
              onClick={() => setIsBroadcasting(!isBroadcasting)}
              className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-100/50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs transition-all"
            >
              {isBroadcasting ? 'Cancel' : '+ New Broadcast'}
            </button>
          </div>
        )}

        {/* Broadcast Form Drawer */}
        {isBroadcasting && (
          <form onSubmit={handleSendBroadcast} className="p-4 bg-slate-900 text-white border-b border-slate-800 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Send size={13} /> Compose Broadcast Notification
            </h4>
            <input
              type="text"
              placeholder="Title (e.g. Sales Target Update / Morning Brief)"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              required
            />
            <textarea
              rows={2}
              placeholder="Message details..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              required
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
              >
                <option value="ALL">Target: All Users</option>
                <option value="FIELD_EXEC">Target: Field Executives Only</option>
                <option value="ADMIN">Target: Administrators Only</option>
              </select>
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
              >
                {sendingBroadcast ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                Send Now
              </button>
            </div>
          </form>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-blue-500" />
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Bell size={24} className="text-slate-300" />
              <p className="font-semibold text-slate-600">No notifications in this view</p>
              <p className="text-[11px] text-slate-400">All automated dispatches and alerts will appear here.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                className={`pt-3 first:pt-0 p-3 rounded-xl transition-all cursor-pointer ${
                  !n.isRead 
                    ? 'bg-blue-50/70 border border-blue-200/80 shadow-2xs' 
                    : 'bg-white hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      n.type === 'TELEGRAM_EOD' 
                        ? 'bg-purple-100 text-purple-800' 
                        : n.type === 'MONTH_END'
                        ? 'bg-emerald-100 text-emerald-800'
                        : n.type === 'BROADCAST'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {n.type?.replace('_', ' ')}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock size={10} />
                    {new Date(n.timestamp || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mt-1.5">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed font-sans">
                  {n.message}
                </p>

                {n.metadata && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                    {n.metadata.executiveName && <span>Exec: {n.metadata.executiveName}</span>}
                    {n.metadata.totalKms && <span>KMs: {n.metadata.totalKms} km</span>}
                    {n.metadata.visitsCount !== undefined && <span>Visits: {n.metadata.visitsCount}</span>}
                    {n.metadata.photosCount !== undefined && <span>Photos: {n.metadata.photosCount}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
          Automated 8:00 AM IST Telegram dispatches actively monitored.
        </div>

      </div>
    </div>
  );
}
