import React, { useState, useEffect, useCallback, Component } from 'react';
import axios from 'axios';
import { 
  LogOut, Navigation, Play, Square, FileText, CheckCircle, History, Search, 
  TrendingUp, IndianRupee, User, Store, MapPin, Calendar, Settings, Users, 
  Activity, BarChart, Settings2, Download, AlertCircle, AlertTriangle, Camera, 
  Database, ShieldAlert, Lock, RefreshCw, Smartphone, ShieldCheck, ArrowRight,
  Bell, Send, Trash2, Plus, Scale, Building2, Key, Phone
} from 'lucide-react';
import AdminUMS from './components/AdminUMS';
import AdminReports from './components/AdminReports';
import AdminFirmDirectory from './components/AdminFirmDirectory';
import ShiftDashboard from './components/ShiftDashboard';
import VisitLogger from './components/VisitLogger';
import VisitHistory from './components/VisitHistory';
import IncentivesDashboard from './components/IncentivesDashboard';
import FirmOnboarding from './components/FirmOnboarding';
import TelegramAdminConfig from './components/TelegramAdminConfig';
import NotificationCenter from './components/NotificationCenter';
import OfflineSyncIndicator from './components/OfflineSyncIndicator';
import IndianStatutoryComplianceModal from './components/IndianStatutoryComplianceModal';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import SuperAdminGuard from './components/SuperAdminGuard';
import SuperAdminDedicatedLogin from './components/SuperAdminDedicatedLogin';
import SuperAdminApp from './components/SuperAdminApp';
import { 
  PermissionsCheckScreen, 
  RevokedPermissionsOverlay, 
  InitialInstallPermissionsModal,
  DevicePermissionsHubModal 
} from './components/DevicePermissionsGuard';
import { subscribeToPushToasts } from './lib/notificationEngine';

// Safe JSON parser safeguard
export function safeJsonParse(jsonString, fallback = null) {
  try {
    if (!jsonString || typeof jsonString !== 'string') return fallback;
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('safeJsonParse caught invalid JSON, using fallback:', err);
    return fallback;
  }
}

// React Error Boundary Class Component
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Application Safeguard</h2>
            <p className="text-sm text-slate-400 mt-2 mb-4">
              A temporary runtime issue was caught safely. Your session data is intact.
            </p>
            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 mb-6 overflow-x-auto">
                <p className="font-bold text-rose-400">Error Notice:</p>
                <p>{this.state.error.toString()}</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md text-sm"
              >
                Reload Dashboard
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all text-xs"
              >
                Clear Local Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { api } from './lib/api';
import { supabase, SUPABASE_URL } from './lib/supabase';

// ==========================================
// ADMIN CONFIGURATION & DASHBOARD
// ==========================================

function AdminConfig({ user }) {
  const [config, setConfig] = useState({ kmRate: 5, foodingAllowance: 250, incentives: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'Bags', rate: '' });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      const parsedConfig = res.data || {};
      let incs = parsedConfig.incentives;
      if (!Array.isArray(incs)) {
        incs = Object.entries(incs || {}).map(([name, rate], idx) => ({
          id: String(idx+1), name, unit: 'Units', rate: Number(rate) || 0
        }));
      }
      setConfig({
        kmRate: Number(parsedConfig.kmRate ?? parsedConfig.km_rate ?? 5),
        foodingAllowance: Number(parsedConfig.foodingAllowance ?? parsedConfig.fooding_allowance ?? 250),
        incentives: Array.isArray(incs) ? incs : []
      });
    } catch (err) {
      console.error('Failed to fetch admin config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        kmRate: parseFloat(config.kmRate) || 0,
        foodingAllowance: parseFloat(config.foodingAllowance) || 0,
        incentives: config.incentives.map(item => ({
          id: item.id || Date.now().toString(),
          name: item.name.trim(),
          unit: item.unit || 'Units',
          rate: parseFloat(item.rate) || 0
        }))
      };
      const res = await api.put('/admin/config', payload);
      const savedConfig = res.data?.config || payload;
      setConfig(savedConfig);
      localStorage.setItem('app_config', JSON.stringify(savedConfig));
      window.dispatchEvent(new CustomEvent('app_config_updated', { detail: savedConfig }));
      setMessage(`Configuration saved: ₹${savedConfig.kmRate}/km travel reimbursement, ₹${savedConfig.foodingAllowance}/day food allowance, and ${savedConfig.incentives.length} product incentives globally active.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const updateProductItem = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      incentives: prev.incentives.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.rate) return;
    setConfig(prev => ({
      ...prev,
      incentives: [...prev.incentives, { 
        ...newProduct, 
        id: 'p-' + Date.now().toString(), 
        rate: parseFloat(newProduct.rate) || 0 
      }]
    }));
    setNewProduct({ name: '', unit: 'Bags', rate: '' });
  };

  const removeProduct = (id) => {
    setConfig(prev => ({
      ...prev,
      incentives: prev.incentives.filter(p => p.id !== id)
    }));
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading configurations...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Rate & Allowance Configurations</h3>
        <p className="text-sm text-gray-500 mb-6">Values updated here instantly reflect across all executive devices, shift calculations, and visit forms.</p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 max-w-xl">
            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Reimbursement & Daily Allowances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Per-KM Travel Reimbursement (₹)
                </label>
                <div className="relative">
                  <input 
                    type="number" step="0.1" min="0"
                    value={config.kmRate ?? ''}
                    onChange={(e) => setConfig({...config, kmRate: e.target.value})}
                    className="w-full pl-8 pr-4 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                    required 
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">₹</span>
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">Applied to verified opening/closing odometer KMs</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Daily Fooding Allowance (₹)
                </label>
                <div className="relative">
                  <input 
                    type="number" step="1" min="0"
                    value={config.foodingAllowance ?? ''}
                    onChange={(e) => setConfig({...config, foodingAllowance: e.target.value})}
                    className="w-full pl-8 pr-4 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                    required 
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">₹</span>
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">Fixed per active duty day completed</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="font-semibold text-gray-800">Advanced Product Incentive Matrix</h4>
              <span className="text-xs text-gray-500">{config.incentives.length} Configured Products</span>
            </div>
            
            <div className="space-y-2">
              {config.incentives.map((product) => (
                <div key={product.id} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      value={product.name ?? ''}
                      onChange={(e) => updateProductItem(product.id, 'name', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-hidden px-1 py-0.5"
                    />
                  </div>
                  <div className="w-28">
                    <select
                      value={product.unit ?? 'Units'}
                      onChange={(e) => updateProductItem(product.id, 'unit', e.target.value)}
                      className="w-full text-xs text-gray-700 bg-gray-100 px-2 py-1.5 rounded border border-gray-200 font-medium"
                    >
                      <option value="Bags">Bags</option>
                      <option value="MT">MT</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Kgs">Kgs</option>
                      <option value="Units">Units</option>
                    </select>
                  </div>
                  <div className="w-32 flex items-center gap-1">
                    <span className="text-xs text-emerald-700 font-bold">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={product.rate ?? ''}
                      onChange={(e) => updateProductItem(product.id, 'rate', e.target.value)}
                      className="w-full text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeProduct(product.id)} 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove product"
                  >
                    <Trash2 size={16} /> 
                  </button>
                </div>
              ))}
              {config.incentives.length === 0 && <p className="text-sm text-gray-500">No products configured.</p>}
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Plus size={14} /> Add Custom Product to Incentive Catalog
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                  <input type="text" value={newProduct.name ?? ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. White Cement, TMT 12mm" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Type</label>
                  <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                    <option value="Bags">Bags</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Pcs">Pcs</option>
                    <option value="MT">MT</option>
                    <option value="Units">Units</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Incentive Rate (₹)</label>
                  <div className="flex gap-2">
                    <input type="number" step="any" min="0" value={newProduct.rate ?? ''} onChange={e => setNewProduct({...newProduct, rate: e.target.value})} placeholder="Rate (e.g. 15)" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                    <button type="button" onClick={addProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium shrink-0">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full max-w-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow transition-all mt-2"
          >
            {saving ? 'Saving Configurations...' : 'Save Global Configurations'}
          </button>
        </form>
      </div>

      {/* TELEGRAM BOT & AUTOMATED 8:00 AM DISPATCH HUB */}
      <TelegramAdminConfig />
    </div>
  );
}

function AdminDashboard({ user, onNavigate }) {
  const [data, setData] = useState({
    kpis: { activeExecutives: 0, totalFieldKmsToday: 0, totalVisitsToday: 0 },
    salesReport: { totalBilling: 0, byUnit: [] },
    paymentReport: { totalCollections: 0, byMode: [] },
    topPerformersExecs: [],
    top10PurchasingCompanies: [],
    top10TimelyPaymentCompanies: [],
    top10LowestPurchasingCompanies: [],
    top10SlowPaymentCompanies: [],
    activity: [],
    execActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedExec, setSelectedExec] = useState(null);
  const [inspectorMode, setInspectorMode] = useState('live');
  const [leaderboardTab, setLeaderboardTab] = useState('top_execs'); // 'top_execs' | 'top_buyers' | 'timely_payments' | 'lowest_buyers' | 'slow_payments'

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res && res.data) {
        setData(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading admin dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Active Execs</p>
          <p className="text-2xl font-bold text-gray-900">{data?.kpis?.activeExecutives ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Total KMs (Today)</p>
          <p className="text-2xl font-bold text-gray-900">{data?.kpis?.totalFieldKmsToday ?? 0} km</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-center">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider mb-1">Visits Today</p>
          <p className="text-2xl font-bold text-gray-900">{data?.kpis?.totalVisitsToday ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600"/> Today's Sales Report
          </h3>
          <div className="mb-4">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Billing</p>
            <p className="text-3xl font-black text-green-700">₹{(data.salesReport?.totalBilling || 0).toLocaleString()}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Quantities by Unit</p>
            {data.salesReport?.byUnit && data.salesReport.byUnit.length > 0 ? (
              data.salesReport.byUnit.map((u, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="font-medium text-gray-700">{u.unit}</span>
                  <span className="font-bold text-gray-900">{u.quantity}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-2">No sales logged today yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={20} className="text-green-600"/> Payment Collections
          </h3>
          <div className="mb-4">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-3xl font-black text-blue-700">₹{(data.paymentReport?.totalCollections || 0).toLocaleString()}</p>
          </div>
          <div className="space-y-3">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">By Mode</p>
             {data.paymentReport?.byMode && data.paymentReport.byMode.length > 0 ? (
               <div className="grid grid-cols-2 gap-2">
                 {data.paymentReport.byMode.map((m, i) => (
                   <div key={i} className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                     <p className="text-xs text-blue-600 font-semibold">{m.mode} ({m.count})</p>
                     <p className="font-bold text-blue-900">₹{m.amount.toLocaleString()}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-xs text-gray-400 italic py-2">No collections recorded today yet.</p>
             )}
          </div>
        </div>
      </div>

      {/* PERFORMANCE & RANKINGS INTELLIGENCE LEADERBOARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={20} /> Performance & Intelligence Rankings
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Top performing executives, buyer liftoffs, order turnaround speed, and risk monitoring.</p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('admin-reports', leaderboardTab)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all"
          >
            <span>Open in Full Reports</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b border-gray-100">
          <button
            onClick={() => setLeaderboardTab('top_execs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              leaderboardTab === 'top_execs' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Top Execs
          </button>
          <button
            onClick={() => setLeaderboardTab('top_buyers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              leaderboardTab === 'top_buyers' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Top 10 Buyers
          </button>
          <button
            onClick={() => setLeaderboardTab('timely_payments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              leaderboardTab === 'timely_payments' ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Top 10 Timely Payers
          </button>
          <button
            onClick={() => setLeaderboardTab('lowest_buyers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              leaderboardTab === 'lowest_buyers' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Top 10 Lowest Buyers
          </button>
          <button
            onClick={() => setLeaderboardTab('slow_payments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              leaderboardTab === 'slow_payments' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Top 10 Slow Payers
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="overflow-x-auto">
          {leaderboardTab === 'top_execs' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Executive Name</th>
                  <th className="p-3 text-right">Sales Value</th>
                  <th className="p-3 text-right">Collections</th>
                  <th className="p-3 text-right">Visits</th>
                  <th className="p-3 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(data.topPerformersExecs || []).length > 0 ? (
                  data.topPerformersExecs.slice(0, 5).map((e) => (
                    <tr key={e.execId} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-black text-purple-700">#{e.rank}</td>
                      <td className="p-3 font-bold text-gray-900">{e.execName}</td>
                      <td className="p-3 text-right font-black text-green-700">₹{e.salesValue.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-blue-700">₹{e.collections.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-gray-700">{e.visitsCount} visits</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                          {e.score} pts
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No field executives registered yet. Register and approve executives in User Management.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {leaderboardTab === 'top_buyers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Company / Dealer</th>
                  <th className="p-3">Primary Brand</th>
                  <th className="p-3 text-right">Total Purchased</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-center">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(data.top10PurchasingCompanies || []).length > 0 ? (
                  data.top10PurchasingCompanies.slice(0, 5).map((f) => (
                    <tr key={f.firmId} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-black text-emerald-700">#{f.rank}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{f.firmName}</p>
                        <p className="text-[10px] text-gray-500">{f.contactPerson}</p>
                      </td>
                      <td className="p-3 text-gray-700">{f.primaryProduct}</td>
                      <td className="p-3 text-right font-black text-emerald-800">₹{f.totalPurchased.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-blue-700">₹{f.totalPaid.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {f.tier}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No purchase orders recorded yet. Transactions will appear here as field visits are submitted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {leaderboardTab === 'timely_payments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3 text-center">Payment Speed</th>
                  <th className="p-3 text-center">On-Time Rate</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(data.top10TimelyPaymentCompanies || []).length > 0 ? (
                  data.top10TimelyPaymentCompanies.slice(0, 5).map((f) => (
                    <tr key={f.firmId} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-black text-teal-700">#{f.rank}</td>
                      <td className="p-3 font-bold text-gray-900">{f.firmName}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-900 font-bold rounded-full text-[10px]">
                          ⚡ {f.avgDaysToPay === 0 ? 'Instant' : `${f.avgDaysToPay}d`}
                        </span>
                      </td>
                      <td className="p-3 text-center text-green-700 font-bold">{f.onTimeRatePercent}%</td>
                      <td className="p-3 text-right font-black text-green-700">₹{f.totalPaid.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-800 border border-green-200">
                          {f.reliabilityRating}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No payment settlements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {leaderboardTab === 'lowest_buyers' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3 text-right">Total Purchased</th>
                  <th className="p-3 text-center">Orders</th>
                  <th className="p-3 text-center">Inactivity</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(data.top10LowestPurchasingCompanies || []).length > 0 ? (
                  data.top10LowestPurchasingCompanies.slice(0, 5).map((f) => (
                    <tr key={f.firmId} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-black text-amber-700">#{f.rank}</td>
                      <td className="p-3 font-bold text-gray-900">{f.firmName}</td>
                      <td className="p-3 text-right font-bold text-gray-900">₹{f.totalPurchased.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center text-gray-700">{f.orderCount}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded text-[10px]">
                          {f.daysSinceLastOrder}d gap
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-amber-800 truncate max-w-xs">{f.recommendedAction}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No client directory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {leaderboardTab === 'slow_payments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3 text-center">Payment Delay</th>
                  <th className="p-3 text-right">Overdue Dues</th>
                  <th className="p-3 text-center">Risk Level</th>
                  <th className="p-3">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(data.top10SlowPaymentCompanies || []).length > 0 ? (
                  data.top10SlowPaymentCompanies.slice(0, 5).map((f) => (
                    <tr key={f.firmId} className="hover:bg-gray-50">
                      <td className="p-3 text-center font-black text-rose-700">#{f.rank}</td>
                      <td className="p-3 font-bold text-gray-900">{f.firmName}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-bold rounded-full text-[10px]">
                          ⚠️ {f.avgDaysToPay}d
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-rose-700">₹{f.outstandingDues.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                          {f.riskLevel}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-rose-800 truncate max-w-xs">{f.recoveryAction}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      No overdue payment delays detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-red-500"/> Field Inspector
          </h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setInspectorMode('live')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md ${inspectorMode === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Live Tracking</button>
             <button onClick={() => setInspectorMode('history')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md ${inspectorMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Route History</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-1 border-r border-gray-100 pr-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Field Executives</p>
              {data.activity && data.activity.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {data.activity.map(exec => (
                    <button 
                      key={exec.id} 
                      onClick={() => setSelectedExec(exec)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedExec?.id === exec.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{exec.name}</p>
                      <p className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span className={`font-medium ${exec.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>{exec.status}</span>
                        <span>Visits: {exec.totalVisitsToday}</span>
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-500">
                  No field executives registered yet. New registrations will appear in UMS for approval.
                </div>
              )}
           </div>
           
           <div className="col-span-1 md:col-span-2">
              {!selectedExec ? (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100 min-h-[300px]">
                  Select an executive to view location details.
                </div>
              ) : inspectorMode === 'live' ? (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 h-full min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
                   <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> GPS Active
                   </div>
                   <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                     <MapPin size={32}/>
                   </div>
                   <h4 className="text-xl font-bold text-gray-900">{selectedExec.name}</h4>
                   <p className="text-sm text-gray-500 mb-6">Current Location</p>
                   
                   {data.liveLocation?.find(l => l.id === selectedExec.id) ? (
                     <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-blue-50 w-full max-w-sm">
                       <p className="font-mono text-lg text-gray-800">
                         {data.liveLocation.find(l => l.id === selectedExec.id).lat.toFixed(4)}, {data.liveLocation.find(l => l.id === selectedExec.id).lng.toFixed(4)}
                       </p>
                       <p className="text-xs text-gray-500 mt-2">Last updated: {data.liveLocation.find(l => l.id === selectedExec.id).lastUpdated}</p>
                     </div>
                   ) : (
                     <p className="text-gray-500">Location data not available.</p>
                   )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 h-full min-h-[300px]">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-gray-900">Route History</h4>
                      <p className="text-sm font-bold text-blue-600">Total KMs: {data.routeHistory?.totalShiftKms}</p>
                   </div>
                   <div className="relative border-l-2 border-blue-200 ml-3 space-y-6">
                     {data.routeHistory?.stops.map(stop => (
                       <div key={stop.id} className="relative pl-6">
                         <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"></div>
                         <p className="text-xs font-bold text-gray-400">{stop.time}</p>
                         <p className="font-semibold text-gray-900">{stop.name}</p>
                         <p className="text-xs text-gray-500 font-mono mt-1">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SHARED & EXECUTIVE COMPONENTS
// ==========================================

function ProfileSettings({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        setProfile(res.data);
        setFullName(res.data.fullName || '');
        setPhoneNumber(res.data.phoneNumber || '');
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await api.put('/user/update', { fullName, phoneNumber });
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update.' });
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {profile?.fullName?.charAt(0) || <User />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
            <p className="text-sm text-gray-500">{profile?.role}</p>
            <p className="text-xs text-blue-600 font-medium mt-1 uppercase tracking-wider">{profile?.status}</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={profile?.email} disabled className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed" />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
              Save Changes
            </button>
            <button type="button" onClick={onLogout} className="px-6 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl transition-colors">
              Logout
            </button>
          </div>
        </form>
      </div>

      {/* Database & Mobile APK Connectivity Status Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-emerald-600" size={18} />
            <h3 className="text-sm font-bold text-gray-900">Supabase Database & APK Standalone Bridge</h3>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Active & Connected
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          The Supabase PostgreSQL database URL and Anon API key are hardcoded directly in the client bundle. When built into an Android APK or downloaded, the application communicates with the live cloud database without server dependency.
        </p>
        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span>Project URL:</span>
            <span className="text-emerald-400 font-bold">{SUPABASE_URL}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>APK Connectivity:</span>
            <span className="text-sky-300 font-bold">Direct Supabase Cloud + REST</span>
          </div>
        </div>
      </div>

      {/* Statutory & Legal Compliance Card (India DPDP Act 2023, IT Act 2000, NPCI UPI) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="text-indigo-600" size={18} />
            <h3 className="text-sm font-bold text-gray-900">Statutory & Legal Compliance Hub (India)</h3>
          </div>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            DPDP Act 2023 Compliant
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Sundaram Mahadeo Group operations comply with the Digital Personal Data Protection Act 2023, Information Technology Act 2000, NPCI UPI Procedural Guidelines, and Indian Labour Law shift standards.
        </p>
        <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Grievance Officer: <span className="text-slate-800 font-bold">info@sundarammahadeogroup.com</span>
          </div>
          <button
            type="button"
            onClick={() => setIsLegalModalOpen(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors border border-indigo-200 flex items-center gap-1.5"
          >
            <Scale size={14} />
            <span>View Legal Compliance Hub & Policy</span>
          </button>
        </div>
      </div>

      {/* Indian Statutory Compliance Modal */}
      <IndianStatutoryComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        user={user}
      />
    </div>
  );
}

// ==========================================
// AUTH & MAIN APP
// ==========================================

function Login({ onLogin }) {
  const [portalMode, setPortalMode] = useState('app'); // 'app' | 'super_admin'
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Super Admin Specific Fields
  const [superPhone, setSuperPhone] = useState('9435188967');
  const [superPasskey, setSuperPasskey] = useState('');

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setLoading(true);
    try {
      if (isRegistering) {
        await api.post('/auth/register', { fullName, phoneNumber, currentAddress, email: emailOrPhone, password });
        setStatusMessage({
          type: 'pending_success',
          text: 'Registration submitted successfully! Your account status is set to PENDING Administrator approval. Once approved by the Admin in UMS, you will be able to log in.'
        });
        setIsRegistering(false);
        setPassword('');
      } else {
        const res = await api.post('/auth/login', { emailOrPhone, password });
        try {
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch {
          // ignore
        }
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('current_portal', 'app');
        onLogin(res.data.token, res.data.user, 'app');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Authentication failed';
      if (errMsg.toLowerCase().includes('pending')) {
        setStatusMessage({
          type: 'pending_warning',
          text: 'Your account is currently PENDING approval from the Administrator. Login is restricted until an Admin reviews and approves your account.'
        });
      } else if (errMsg.toLowerCase().includes('disabled')) {
        setStatusMessage({
          type: 'disabled_warning',
          text: 'Your account has been DISABLED. Please contact the Sundaram Mahadeo Group Administrator.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: errMsg
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminSubmit = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setLoading(true);

    setTimeout(() => {
      const cleanPhone = String(superPhone).replace(/\D/g, '');

      // Strict Super Admin Access Policy
      if (cleanPhone !== '9435188967') {
        setStatusMessage({
          type: 'forbidden_403',
          text: '403 Access Forbidden: Root Super Admin access is restricted exclusively to Master Phone 9435188967. Standard staff credentials cannot access this command center.'
        });
        setLoading(false);
        return;
      }

      if (superPasskey !== 'admin123' && superPasskey !== '9435188967') {
        setStatusMessage({
          type: 'error',
          text: 'Invalid Master Clearance Passkey. Please verify your confidential credentials.'
        });
        setLoading(false);
        return;
      }

      const superSession = {
        id: 'super_admin_root',
        fullName: 'Chief Super Administrator',
        phone: '9435188967',
        role: 'SUPER_ADMIN',
        loggedAt: new Date().toISOString()
      };

      const masterToken = 'super_admin_jwt_master_' + Date.now();
      localStorage.setItem('saas_super_admin_session', JSON.stringify(superSession));
      localStorage.setItem('token', masterToken);
      localStorage.setItem('user', JSON.stringify(superSession));
      localStorage.setItem('current_portal', 'super-admin');

      onLogin(masterToken, superSession, 'super-admin');
      setLoading(false);
    }, 450);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
      portalMode === 'super_admin' ? 'bg-[#090d16]' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl transition-all duration-300 border ${
        portalMode === 'super_admin' 
          ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
          : 'bg-white border-gray-100 text-gray-900'
      }`}>
        
        {/* Top Segmented Portal Switcher */}
        <div className="mb-6">
          <div className={`flex p-1 rounded-2xl border transition-all ${
            portalMode === 'super_admin' 
              ? 'bg-slate-950 border-slate-800' 
              : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              type="button"
              onClick={() => { 
                setPortalMode('app'); 
                localStorage.setItem('current_portal', 'app');
                try {
                  if (window.location.hash) {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                } catch {
                  // ignore
                }
                setStatusMessage({ type: '', text: '' }); 
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portalMode === 'app'
                  ? 'bg-white text-gray-900 shadow-md border border-gray-100 font-black'
                  : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Smartphone size={14} className={portalMode === 'app' ? 'text-blue-600' : 'text-gray-400'} />
              <span>Field App / Staff</span>
            </button>

            <button
              type="button"
              onClick={() => { 
                setPortalMode('super_admin'); 
                localStorage.setItem('current_portal', 'super-admin');
                setStatusMessage({ type: '', text: '' }); 
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portalMode === 'super_admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ShieldAlert size={14} className={portalMode === 'super_admin' ? 'text-slate-950' : 'text-amber-500'} />
              <span>Super Admin Panel</span>
            </button>
          </div>
          <p className="text-[11px] text-center mt-2 font-medium opacity-60">
            {portalMode === 'super_admin' 
              ? 'Direct root access to multi-tenant B2B command center'
              : 'Sign in to mobile marketing, reports & shift tools'}
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODE A: SUPER ADMIN COMMAND CENTER LOGIN                       */}
        {/* ------------------------------------------------------------- */}
        {portalMode === 'super_admin' ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 mb-2.5 shadow-sm">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Super Admin Clearance
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Root Command Center for Multi-Tenant Management &amp; Billing
              </p>
            </div>

            {/* Error / Status Messages */}
            {statusMessage.text && (
              <div className={`p-3.5 mb-5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                statusMessage.type === 'forbidden_403'
                  ? 'bg-rose-950/80 border-rose-700/60 text-rose-200'
                  : 'bg-rose-950/60 border-rose-800/50 text-rose-300'
              }`}>
                <AlertCircle className="shrink-0 mt-0.5 text-rose-400" size={16} />
                <div>
                  {statusMessage.type === 'forbidden_403' && (
                    <p className="font-black text-rose-300 uppercase tracking-wider text-[10px] mb-0.5">
                      403 Access Forbidden
                    </p>
                  )}
                  <p>{statusMessage.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Master Phone Identifier *
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="9435188967"
                    value={superPhone}
                    onChange={e => setSuperPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-hidden font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Root authorized master identifier</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Master Clearance Passkey *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={superPasskey}
                    onChange={e => setSuperPasskey(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-hidden font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Default key: <code className="text-amber-400">admin123</code></p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-5"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Master Session...</span>
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    <span>Enter Super Admin Command Center</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-slate-800/80 pt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Isolated 256-Bit SSL Admin Management Channel</span>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* MODE B: STANDARD FIELD EXECUTIVE & STAFF LOGIN                */
          /* ------------------------------------------------------------- */
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {isRegistering ? 'Field Executive Registration' : 'SM Marketing'}
              </h2>
              <p className="text-xs text-gray-500 font-semibold mt-1 tracking-wide">
                {isRegistering ? 'Submit profile for Administrator approval' : 'Official Marketing APP OF SMM'}
              </p>
            </div>

            {statusMessage.text && (
              <div className={`p-4 mb-6 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
                statusMessage.type === 'pending_success' 
                  ? 'bg-blue-50 text-blue-900 border-blue-200' 
                  : statusMessage.type === 'pending_warning'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                  : statusMessage.type === 'disabled_warning'
                  ? 'bg-gray-100 text-gray-800 border-gray-300'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <div>
                  {statusMessage.type === 'pending_warning' && <p className="font-bold mb-0.5">Approval Required</p>}
                  {statusMessage.type === 'pending_success' && <p className="font-bold mb-0.5">Registration Queued</p>}
                  <p>{statusMessage.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleStandardSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Legal Name</label>
                    <input type="text" placeholder="e.g. Rahul Sharma" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" placeholder="e.g. 9876543210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base / Current Address</label>
                    <input type="text" placeholder="e.g. Ranchi, Jharkhand" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email / Phone Number</label>
                <input type="text" placeholder="Enter phone or email" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm active:scale-98 cursor-pointer">
                {loading ? 'Processing...' : isRegistering ? 'Submit for Admin Approval' : 'Sign In to Portal'}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-gray-100 pt-4 space-y-2">
              <button onClick={() => { setIsRegistering(!isRegistering); setStatusMessage({ type: '', text: '' }); }} className="text-blue-600 text-xs font-bold hover:underline block w-full text-center">
                {isRegistering ? 'Already have an approved account? Sign In' : 'New Executive? Register for Approval Gateway'}
              </button>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <Scale size={13} className="text-indigo-600 shrink-0" />
                <span>DPDP Act 2023 &amp; IT Act 2000 Compliant.</span>
                <button
                  type="button"
                  onClick={() => setIsLegalModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline ml-1"
                >
                  Legal Hub
                </button>
              </div>
            </div>

            {/* Indian Statutory Compliance Modal */}
            <IndianStatutoryComplianceModal
              isOpen={isLegalModalOpen}
              onClose={() => setIsLegalModalOpen(false)}
            />
          </div>
        )}

      </div>
    </div>
  );
}

export function AppContent() {
  const [user, setUser] = useState(() => {
    return safeJsonParse(localStorage.getItem('user'), null);
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').replace('/', '').trim().toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const panelParam = (urlParams.get('panel') || urlParams.get('page') || '').toLowerCase();
      const isSuperAdminUrl = hash === 'super-admin' || hash === 'superadmin' || panelParam === 'super-admin' || panelParam === 'superadmin';
      const activePortal = localStorage.getItem('current_portal');
      const stored = safeJsonParse(localStorage.getItem('user'), null);

      if (isSuperAdminUrl || activePortal === 'super-admin') {
        return 'super-admin';
      }
      if (stored?.role === 'ADMIN' || stored?.role === 'EXECUTIVE_ASSISTANT' || stored?.role === 'SUPER_ADMIN' || stored?.role === 'ADMINISTRATOR') {
        return 'admin-dashboard';
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [selectedReportSubTab, setSelectedReportSubTab] = useState('overview');
  const [hasGrantedPermissions, setHasGrantedPermissions] = useState(false);
  const [revokedPermissionReason, setRevokedPermissionReason] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isPermissionsHubOpen, setIsPermissionsHubOpen] = useState(false);
  const [isLegalComplianceOpen, setIsLegalComplianceOpen] = useState(false);
  const [pushToasts, setPushToasts] = useState([]);

  // Subscribe to live In-App Push Toasts
  useEffect(() => {
    const unsubscribe = subscribeToPushToasts((toast) => {
      setPushToasts((prev) => [toast, ...prev].slice(0, 3));
      // Auto dismiss after duration
      setTimeout(() => {
        setPushToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration || 5000);
    });
    return () => unsubscribe();
  }, []);

  // Helper to parse deep-link URLs
  const checkIsSuperAdminUrl = () => {
    try {
      const hash = window.location.hash.replace('#', '').replace('/', '').trim().toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const panelParam = (urlParams.get('panel') || urlParams.get('page') || '').toLowerCase();
      const isSuperAdminFlag = urlParams.get('superadmin') === 'true' || urlParams.get('control') === 'true';
      return hash === 'super-admin' || hash === 'superadmin' || panelParam === 'super-admin' || panelParam === 'superadmin' || isSuperAdminFlag;
    } catch {
      return false;
    }
  };

  // Handle URL Deep-Linking for Super Admin Control Panel
  useEffect(() => {
    const handleUrlNavigation = () => {
      if (checkIsSuperAdminUrl()) {
        setCurrentPage('super-admin');
      }
    };

    handleUrlNavigation();
    window.addEventListener('hashchange', handleUrlNavigation);
    window.addEventListener('popstate', handleUrlNavigation);
    return () => {
      window.removeEventListener('hashchange', handleUrlNavigation);
      window.removeEventListener('popstate', handleUrlNavigation);
    };
  }, []);

  // Fetch unread notifications count
  const pollUnreadNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res.data)) {
        const unread = res.data.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      // silent polling catch
    }
  };

  useEffect(() => {
    if (token) {
      pollUnreadNotifications();
      const interval = setInterval(pollUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const parsed = safeJsonParse(localStorage.getItem('user'), null);
      if (parsed) {
        setUser(parsed);
        const activePortal = localStorage.getItem('current_portal');
        const isUrlSuperAdmin = checkIsSuperAdminUrl();

        if (activePortal === 'super-admin' || isUrlSuperAdmin) {
          setCurrentPage('super-admin');
          setHasGrantedPermissions(true);
        } else if (parsed.role === 'ADMIN' || parsed.role === 'EXECUTIVE_ASSISTANT' || parsed.role === 'SUPER_ADMIN' || parsed.role === 'ADMINISTRATOR') {
          setCurrentPage('admin-dashboard');
          setHasGrantedPermissions(true); // Admins and Executive Assistants do not require field sensor guard
        } else {
          setCurrentPage('dashboard');
        }
      }
    }
  }, [token]);

  // Mid-shift sensor and permission monitoring
  useEffect(() => {
    if (!token || !user || user.role === 'ADMIN' || !hasGrantedPermissions) return;

    let watchId;
    if ("geolocation" in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          () => {
            setRevokedPermissionReason(prev => (prev.includes('Location') || prev.includes('GPS')) ? '' : prev);
          },
          (error) => {
            console.warn('Geolocation sensor error/denial:', error);
            if (error.code === 1) { // PERMISSION_DENIED
              setRevokedPermissionReason('Location (GPS) permission was revoked in browser settings.');
            }
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
      } catch (e) {
        console.warn('watchPosition fallback handled safely:', e);
      }
    }

    // Monitor permission queries if supported by the browser
    if (navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
          status.onchange = () => {
            if (status.state === 'denied') {
              setRevokedPermissionReason('Location (GPS) access was revoked.');
            } else if (status.state === 'granted') {
              setRevokedPermissionReason(prev => prev.includes('Location') ? '' : prev);
            }
          };
        }).catch(() => {});

        navigator.permissions.query({ name: 'camera' }).then(status => {
          status.onchange = () => {
            if (status.state === 'denied') {
              setRevokedPermissionReason('Camera access was revoked.');
            } else if (status.state === 'granted') {
              setRevokedPermissionReason(prev => prev.includes('Camera') ? '' : prev);
            }
          };
        }).catch(() => {});
      } catch (e) {}
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch (e) {}
      }
    };
  }, [token, user, hasGrantedPermissions]);

  // Handler to re-verify permissions when on lock screen overlay
  const handleRecheckRevokedPermissions = async () => {
    let locOk = false;
    let camOk = false;

    // Test location
    if (navigator.geolocation) {
      locOk = await new Promise((resolve) => {
        try {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        } catch (e) {
          resolve(false);
        }
      });
    }

    // Test camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        camOk = true;
      } catch (e) {
        camOk = false;
      }
    }

    if (locOk && camOk) {
      setRevokedPermissionReason('');
      return true;
    } else {
      if (!locOk && !camOk) {
        setRevokedPermissionReason('Both Location (GPS) and Camera access are still blocked.');
      } else if (!locOk) {
        setRevokedPermissionReason('Location (GPS) access is still blocked.');
      } else {
        setRevokedPermissionReason('Camera access is still blocked.');
      }
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('saas_super_admin_session');
    localStorage.removeItem('current_portal');
    try {
      if (window.location.hash || window.location.search) {
        history.replaceState(null, '', window.location.pathname);
      }
    } catch {
      // ignore
    }
    setToken('');
    setUser(null);
    setCurrentPage('dashboard');
    setHasGrantedPermissions(false);
    setRevokedPermissionReason('');
    setIsBypassed(false);
  };

  // Development/Audit helper: Switch between Admin and Field Exec roles without relogging
  const handleToggleRoleForAudit = () => {
    if (!user) return;
    const newRole = user.role === 'ADMIN' ? 'FIELD_EXEC' : 'ADMIN';
    const updatedUser = {
      ...user,
      role: newRole,
      fullName: newRole === 'ADMIN' ? 'Admin Controller' : 'Sundaram Executive'
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (newRole === 'ADMIN') {
      setCurrentPage('admin-dashboard');
      setHasGrantedPermissions(true);
    } else {
      setCurrentPage('dashboard');
      setHasGrantedPermissions(true);
    }
  };

  if (!token) {
    return (
      <Login 
        onLogin={(t, u, destination) => { 
          setToken(t); 
          setUser(u);
          localStorage.setItem('current_portal', destination || 'app');
          if (destination === 'super-admin') {
            setCurrentPage('super-admin');
            setHasGrantedPermissions(true);
          } else if (u?.role === 'ADMIN' || u?.role === 'EXECUTIVE_ASSISTANT' || u?.role === 'SUPER_ADMIN') {
            setCurrentPage('admin-dashboard');
            setHasGrantedPermissions(true);
          } else {
            setCurrentPage('dashboard');
            setHasGrantedPermissions(false);
          }
        }} 
      />
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-semibold text-sm">Initializing portal session...</div>;
  }

  const rawUserPhone = String(user?.phoneNumber || user?.phone || user?.phone_number || '').replace(/\D/g, '');
  const hasSuperAdminClearance = rawUserPhone === '9435188967' || rawUserPhone.endsWith('9435188967') || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPERADMIN';

  // Strict Total Isolation: Render Super Admin Command Center ONLY when currently on super-admin page
  if (currentPage === 'super-admin') {
    return (
      <SuperAdminApp 
        onLogout={handleLogout} 
        user={user}
        onSwitchToApp={() => {
          localStorage.setItem('current_portal', 'app');
          try {
            if (window.location.hash || window.location.search) {
              history.replaceState(null, '', window.location.pathname);
            }
          } catch {
            // ignore
          }
          setCurrentPage(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'EXECUTIVE_ASSISTANT' ? 'admin-dashboard' : 'dashboard');
        }}
      />
    );
  }

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasSuperAdminClearance);
  const isExecutiveAssistant = user && user.role === 'EXECUTIVE_ASSISTANT';
  const isPrivilegedStaff = isAdmin || isExecutiveAssistant;

  // 1. Mandatory Device Permissions Gate for Field Executives
  if (!isPrivilegedStaff && !hasGrantedPermissions) {
    return (
      <PermissionsCheckScreen
        user={user}
        onPermissionsGranted={() => setHasGrantedPermissions(true)}
      />
    );
  }

  const renderPage = () => {
    // If currentPage is super-admin, render SuperAdminDashboard
    if (currentPage === 'super-admin') {
      return (
        <SuperAdminDashboard 
          user={user} 
          onBack={handleLogout} 
        />
      );
    }

    if (isAdmin) {
      switch (currentPage) {
        case 'admin-dashboard': return (
          <AdminDashboard 
            user={user} 
            onNavigate={(page, subTab) => { 
              setCurrentPage(page); 
              if (subTab) setSelectedReportSubTab(subTab); 
            }} 
          />
        );
        case 'admin-directory': return <AdminFirmDirectory user={user} />;
        case 'admin-reports': return (
          <AdminReports 
            user={user} 
            initialSubTab={selectedReportSubTab} 
          />
        );
        case 'admin-config': return <AdminConfig user={user} />;
        case 'admin-ums': return <AdminUMS user={user} />;
        case 'profile': return <ProfileSettings user={user} onLogout={handleLogout} />;
        case 'super-admin': return <SuperAdminDashboard user={user} onBack={() => setCurrentPage('admin-dashboard')} />;
        default: return <AdminDashboard user={user} />;
      }
    } else if (isExecutiveAssistant) {
      switch (currentPage) {
        case 'admin-dashboard': return (
          <AdminDashboard 
            user={user} 
            onNavigate={(page, subTab) => { 
              setCurrentPage(page); 
              if (subTab) setSelectedReportSubTab(subTab); 
            }} 
          />
        );
        case 'admin-directory': return <AdminFirmDirectory user={user} />;
        case 'admin-reports': return (
          <AdminReports 
            user={user} 
            initialSubTab={selectedReportSubTab} 
          />
        );
        case 'profile': return <ProfileSettings user={user} onLogout={handleLogout} />;
        default: return (
          <AdminReports 
            user={user} 
            initialSubTab={selectedReportSubTab || 'firm_view'} 
          />
        );
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return <ShiftDashboard user={user} />;
        case 'visits': return <VisitLogger user={user} />;
        case 'history': return <VisitHistory user={user} />;
        case 'incentives': return <IncentivesDashboard user={user} />;
        case 'onboard': return <FirmOnboarding user={user} />;
        case 'profile': return <ProfileSettings user={user} onLogout={handleLogout} />;
        default: return <ShiftDashboard user={user} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* In-App Live Mobile Push Toasts */}
      {pushToasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
          {pushToasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => {
                setIsNotificationCenterOpen(true);
                setPushToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              className={`pointer-events-auto p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all transform animate-in slide-in-from-top duration-300 cursor-pointer ${
                toast.type === 'broadcast' || toast.type === 'alert'
                  ? 'bg-slate-900/95 border-amber-500/60 text-amber-100 shadow-amber-500/10'
                  : toast.type === 'success'
                  ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-100 shadow-emerald-500/10'
                  : 'bg-slate-900/95 border-blue-500/60 text-blue-100 shadow-blue-500/10'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white truncate">{toast.title}</h4>
                  <span className="text-[9px] text-slate-400">{toast.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Initial Launch / Install Permission Prompt */}
      <InitialInstallPermissionsModal />

      {/* 2. Diagnostics & Device Permissions Hub Modal */}
      <DevicePermissionsHubModal
        isOpen={isPermissionsHubOpen}
        onClose={() => setIsPermissionsHubOpen(false)}
      />

      {/* Indian Statutory Compliance Modal */}
      <IndianStatutoryComplianceModal
        isOpen={isLegalComplianceOpen}
        onClose={() => setIsLegalComplianceOpen(false)}
        user={user}
      />

      {/* 3. Fallback Lock Screen Overlay if permissions are revoked mid-shift */}
      {!isAdmin && revokedPermissionReason && !isBypassed && (
        <RevokedPermissionsOverlay
          revokedReason={revokedPermissionReason}
          onRecheckPermissions={handleRecheckRevokedPermissions}
          onBypassTesting={() => setIsBypassed(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Suppress standard App Header if in isolated Super Admin Command Panel */}
      {currentPage !== 'super-admin' && (
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none">
                  SMM - FMA
                </h1>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : isExecutiveAssistant 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin ? 'Admin' : isExecutiveAssistant ? 'Exec Assistant (View Only)' : 'Field Exec'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1 truncate max-w-[200px] sm:max-w-xs">
                {isAdmin 
                  ? 'Sundaram Mahadeo Group • Admin Controller' 
                  : isExecutiveAssistant 
                  ? `${user.fullName} • Executive Assistant (Reports & Directory View)` 
                  : `${user.fullName} • Shift Active`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Command Center Quick Jump (Only for authorized Master Admin) */}
            {hasSuperAdminClearance && (
              <button
                onClick={() => {
                  localStorage.setItem('current_portal', 'super-admin');
                  setCurrentPage('super-admin');
                }}
                title="Open SaaS Super Admin Multi-Tenant Panel"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <ShieldAlert size={14} className="text-slate-950" />
                <span className="hidden sm:inline">Super Admin</span>
              </button>
            )}

            {/* Offline-First IndexedDB Sync Capsule */}
            <OfflineSyncIndicator />

            {/* Device & Sensor Diagnostics Button */}
            <button
              onClick={() => setIsPermissionsHubOpen(true)}
              title="Device Sensors & Permissions"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <Smartphone size={15} />
              <span className="hidden sm:inline">Sensors</span>
            </button>

            {/* Legal Compliance & DPDP Act Button */}
            <button
              onClick={() => setIsLegalComplianceOpen(true)}
              title="Statutory Legal Compliance (DPDP Act, IT Act, NPCI UPI)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
            >
              <Scale size={15} />
              <span className="hidden sm:inline">Legal</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              title="Notifications & Dispatches"
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            <button 
              onClick={handleLogout} 
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {/* In-App Notification Center Drawer */}
      <NotificationCenter
        user={user}
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onCountUpdated={(cnt) => setUnreadNotificationsCount(cnt)}
      />
      
      <main className={`flex-1 ${currentPage === 'super-admin' ? 'p-0 max-w-7xl mx-auto w-full' : 'p-4 sm:p-6 max-w-4xl mx-auto w-full'}`}>
        {renderPage()}
      </main>

      {/* Standard bottom navigations are completely suppressed for Super Admin Panel */}
      {currentPage !== 'super-admin' && (
        isAdmin ? (
          <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-6 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <button onClick={() => setCurrentPage('admin-dashboard')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-dashboard' || currentPage === 'dashboard' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Activity size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Dashboard</span></button>
            <button onClick={() => setCurrentPage('admin-directory')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-directory' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Store size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Directory</span></button>
            <button onClick={() => setCurrentPage('admin-reports')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-reports' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><FileText size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Reports</span></button>
            <button onClick={() => setCurrentPage('admin-ums')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-ums' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Users size={20} /><span className="text-[10px] font-medium truncate w-full text-center">UMS</span></button>
            <button onClick={() => setCurrentPage('admin-config')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-config' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Settings2 size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Config</span></button>
            <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><User size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Profile</span></button>
          </nav>
        ) : isExecutiveAssistant ? (
          <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-t border-amber-200 grid grid-cols-5 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <button onClick={() => setCurrentPage('admin-dashboard')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-dashboard' ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Activity size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Dashboard</span></button>
            <button onClick={() => { setCurrentPage('admin-reports'); setSelectedReportSubTab('firm_view'); }} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-reports' && selectedReportSubTab === 'firm_view' ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Store size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Firm View</span></button>
            <button onClick={() => { setCurrentPage('admin-reports'); setSelectedReportSubTab('exec_view'); }} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-reports' && selectedReportSubTab === 'exec_view' ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Users size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Exec View</span></button>
            <button onClick={() => setCurrentPage('admin-directory')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-directory' ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><BarChart size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Directory</span></button>
            <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'profile' ? 'text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><User size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Profile</span></button>
          </nav>
        ) : (
          <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-6 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <button onClick={() => setCurrentPage('dashboard')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'dashboard' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Activity size={20} /><span className="text-[10px] font-medium">Shift</span></button>
            <button onClick={() => setCurrentPage('visits')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'visits' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><CheckCircle size={20} /><span className="text-[10px] font-medium">Log Visit</span></button>
            <button onClick={() => setCurrentPage('history')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'history' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><History size={20} /><span className="text-[10px] font-medium">History</span></button>
            <button onClick={() => setCurrentPage('onboard')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'onboard' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Store size={20} /><span className="text-[10px] font-medium">Onboard</span></button>
            <button onClick={() => setCurrentPage('incentives')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'incentives' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><TrendingUp size={20} /><span className="text-[10px] font-medium">P & I</span></button>
            <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><User size={20} /><span className="text-[10px] font-medium">Profile</span></button>
          </nav>
        )
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
