import React, { useState, useEffect } from 'react';
import { 
  Send, RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Camera, MapPin, Calendar, FileText, Info, Terminal, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

export default function TelegramAdminConfig() {
  const [config, setConfig] = useState({
    botToken: '',
    adminChatId: '',
    channelChatId: '',
    executiveChatIds: {},
    enabled: true,
    sendAtHour: 8,
    sendAtMinute: 0
  });
  const [execMappingText, setExecMappingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [triggeringEod, setTriggeringEod] = useState(false);
  const [triggeringMonthEnd, setTriggeringMonthEnd] = useState(false);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/telegram/config');
      const data = res.data?.config || res.data;
      if (data) {
        const hour = data.dispatchTime ? parseInt(data.dispatchTime.split(':')[0], 10) : 8;
        const minute = data.dispatchTime ? parseInt(data.dispatchTime.split(':')[1], 10) : 0;
        
        setConfig({
          botToken: data.botToken || '',
          adminChatId: data.adminChatId || '',
          channelChatId: data.channelChatId || '',
          enabled: data.autoDispatchEnabled !== undefined ? data.autoDispatchEnabled : true,
          sendAtHour: isNaN(hour) ? 8 : hour,
          sendAtMinute: isNaN(minute) ? 0 : minute
        });

        if (Array.isArray(data.execMappings)) {
          const mapLines = data.execMappings
            .map(m => `${m.execId || m.execName}: ${m.chatId}`)
            .join('\n');
          setExecMappingText(mapLines);
        } else if (data.executiveChatIds && typeof data.executiveChatIds === 'object') {
          const mapLines = Object.entries(data.executiveChatIds)
            .map(([id, chatId]) => `${id}: ${chatId}`)
            .join('\n');
          setExecMappingText(mapLines);
        }
      }
    } catch (err) {
      console.error('Failed to load telegram config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/telegram/logs');
      const logsData = res.data?.logs || res.data || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error('Failed to load telegram logs:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    // Parse executive chat ID mapping lines
    const parsedExecMappings = [];
    const parsedExecsMap = {};
    execMappingText.split('\n').forEach(line => {
      const parts = line.split(':').map(p => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        parsedExecMappings.push({ execId: parts[0], execName: parts[0], chatId: parts[1] });
        parsedExecsMap[parts[0]] = parts[1];
      }
    });

    try {
      const padHour = String(config.sendAtHour || 8).padStart(2, '0');
      const padMin = String(config.sendAtMinute || 0).padStart(2, '0');
      const payload = {
        botToken: config.botToken,
        adminChatId: config.adminChatId,
        autoDispatchEnabled: config.enabled,
        adminNotificationsEnabled: true,
        dispatchTime: `${padHour}:${padMin}`,
        execMappings: parsedExecMappings,
        executiveChatIds: parsedExecsMap
      };
      const res = await api.put('/telegram/config', payload);
      if (res.data?.config) {
        setConfig(prev => ({ ...prev, botToken: res.data.config.botToken, adminChatId: res.data.config.adminChatId }));
      }
      setMessage('Telegram integration settings updated & active.');
      setTimeout(() => setMessage(''), 4000);
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save telegram settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestBot = async () => {
    setTesting(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/telegram/test');
      setMessage(`Ping sent! ${res.data.message || 'Telegram message dispatched to Admin chat ID.'}`);
      setTimeout(() => setMessage(''), 4000);
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to ping Telegram Bot.');
    } finally {
      setTesting(false);
    }
  };

  const handleTriggerEOD = async () => {
    setTriggeringEod(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/telegram/send-eod-report', { force: true });
      setMessage(`EOD Dispatch Complete! Dispatched report with photos & total KMs to field exec and admin.`);
      setTimeout(() => setMessage(''), 5000);
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch EOD report.');
    } finally {
      setTriggeringEod(false);
    }
  };

  const handleTriggerMonthEnd = async () => {
    setTriggeringMonthEnd(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/telegram/send-month-end-report', { force: true });
      setMessage(`Month-End Audit Complete! Sent comprehensive performance statement.`);
      setTimeout(() => setMessage(''), 5000);
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch Month-End report.');
    } finally {
      setTriggeringMonthEnd(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <RefreshCw size={18} className="animate-spin text-blue-600" />
        Loading Telegram integration...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
            <Send size={22} className="-translate-y-0.5 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">Telegram Bot & Daily 8:00 AM Automated Reports</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {config.enabled ? 'Active 8:00 AM IST' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sends automated previous-day EOD audit with shop visit photos, GPS geofence checks, total KMs & monthly statements to Admin and Field Execs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestBot}
          disabled={testing}
          className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-98"
        >
          {testing ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Test Bot Ping
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Manual Immediate Triggers & Actions */}
      <div className="bg-gradient-to-r from-blue-50/80 to-sky-50/80 p-4 sm:p-5 rounded-2xl border border-blue-100/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" /> On-Demand Trigger Dispatches
          </h4>
          <span className="text-[11px] font-semibold text-blue-700">Simulate or run manual dispatch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleTriggerEOD}
            disabled={triggeringEod}
            className="p-3.5 bg-white hover:bg-blue-600 hover:text-white text-slate-800 rounded-xl border border-blue-200 shadow-2xs transition-all flex items-start gap-3 text-left group"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white shrink-0">
              <Camera size={18} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none mb-1">Dispatch Yesterday EOD Report</p>
              <p className="text-[11px] text-slate-500 group-hover:text-blue-100">
                Sends full report with photos of visited shops, total KMs, and sales/collections to Field Exec & Admin
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleTriggerMonthEnd}
            disabled={triggeringMonthEnd}
            className="p-3.5 bg-white hover:bg-purple-600 hover:text-white text-slate-800 rounded-xl border border-purple-200 shadow-2xs transition-all flex items-start gap-3 text-left group"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none mb-1">Dispatch Month-End Report</p>
              <p className="text-[11px] text-slate-500 group-hover:text-purple-100">
                Sends consolidated 30-day performance matrix, firm lifting totals, and executive incentive audits
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Telegram Bot Token
            </label>
            <input
              type="text"
              placeholder="e.g. 7123456789:AAHq_ABCDEF1234567890"
              value={config.botToken || ''}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">Obtained from @BotFather on Telegram</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Telegram Chat ID / Channel
            </label>
            <input
              type="text"
              placeholder="e.g. -1001234567890 or 987654321"
              value={config.adminChatId || ''}
              onChange={(e) => setConfig({ ...config, adminChatId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">Admin will receive copy of all EOD reports and alerts</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Field Executive Chat ID Mapping (One per line)
          </label>
          <textarea
            rows={3}
            placeholder={`exec-1: 987654321\nexec-2: 876543210\nadmin-1: 123456789`}
            value={execMappingText}
            onChange={(e) => setExecMappingText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-1">Format: <code>[userId or executiveId]: [Telegram Chat ID]</code></p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs font-bold text-slate-700">Enable Automated 8:00 AM IST Daily Cron Dispatch</span>
          </label>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Scheduled Hour:</span>
            <input
              type="number"
              min="0"
              max="23"
              value={config.sendAtHour || 8}
              onChange={(e) => setConfig({ ...config, sendAtHour: parseInt(e.target.value) || 8 })}
              className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold bg-white"
            />
            <span>:00 IST (Daily)</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Save Telegram Bot & Schedule Settings
        </button>
      </form>

      {/* Live Dispatch Logs Stream */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Terminal size={14} className="text-slate-500" /> Recent Telegram Dispatch & Verification Logs
          </h4>
          <button
            onClick={fetchLogs}
            className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <RefreshCw size={11} /> Refresh Logs
          </button>
        </div>

        <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto space-y-1.5 border border-slate-800">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic">No dispatch logs recorded yet. Run a test ping or trigger EOD report above.</p>
          ) : (
            logs.slice(0, 15).map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b border-slate-900/60 pb-1 last:border-none">
                <span className="text-slate-500 shrink-0">
                  {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                </span>
                <span className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                  log.type === 'EOD' ? 'bg-purple-900 text-purple-200' :
                  log.type === 'MONTH_END' ? 'bg-emerald-900 text-emerald-200' :
                  'bg-blue-900 text-blue-200'
                }`}>
                  {log.type}
                </span>
                <span className="text-slate-300 truncate">{log.message || log.details}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
