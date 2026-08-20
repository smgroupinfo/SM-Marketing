import React, { useState, useEffect, useCallback, Component } from 'react';
import axios from 'axios';
import { 
  LogOut, Navigation, Play, Square, FileText, CheckCircle, History, Search, 
  TrendingUp, IndianRupee, User, Store, MapPin, Calendar, Settings, Users, 
  Activity, BarChart, Settings2, Download, AlertCircle, AlertTriangle, Camera, 
  Database, ShieldAlert, Lock, RefreshCw, Smartphone, ShieldCheck, ArrowRight
} from 'lucide-react';
import AdminUMS from './components/AdminUMS';
import AdminReports from './components/AdminReports';
import ShiftDashboard from './components/ShiftDashboard';
import VisitLogger from './components/VisitLogger';
import VisitHistory from './components/VisitHistory';
import IncentivesDashboard from './components/IncentivesDashboard';
import FirmOnboarding from './components/FirmOnboarding';
import { PermissionsCheckScreen, RevokedPermissionsOverlay } from './components/DevicePermissionsGuard';

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
    this.state = { hasError: false, error: null, errorInfo: null };
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
            <p className="text-sm text-slate-400 mt-2 mb-6">
              A temporary runtime issue was caught safely. Your session data is intact.
            </p>
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

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// ADMIN CONFIGURATION & DASHBOARD
// ==========================================

function AdminConfig({ user }) {
  const [config, setConfig] = useState({ kmRate: '', foodingAllowance: '', incentives: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'Bags', rate: '' });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      let parsedConfig = res.data;
      if (!Array.isArray(parsedConfig.incentives)) {
        parsedConfig.incentives = Object.entries(parsedConfig.incentives || {}).map(([name, rate], idx) => ({
          id: String(idx+1), name, unit: 'Units', rate
        }));
      }
      setConfig(parsedConfig);
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
      const res = await api.put('/admin/config', config);
      setConfig(res.data.config);
      setMessage('Configuration saved successfully. Globally applied.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.rate) return;
    setConfig(prev => ({
      ...prev,
      incentives: [...prev.incentives, { ...newProduct, id: Date.now().toString(), rate: parseFloat(newProduct.rate) }]
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
        <p className="text-sm text-gray-500 mb-6">Values updated here instantly reflect across all executive devices.</p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 max-w-lg">
            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Reimbursement Settings</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per-KM Reimbursement Rate (₹)</label>
              <input 
                type="number" step="0.1"
                value={config.kmRate}
                onChange={(e) => setConfig({...config, kmRate: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Fooding Allowance (₹)</label>
              <input 
                type="number" step="1"
                value={config.foodingAllowance}
                onChange={(e) => setConfig({...config, foodingAllowance: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Advanced Product Incentive Matrix</h4>
            <div className="space-y-2">
              {config.incentives.map((product) => (
                <div key={product.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex-1 font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.unit}</div>
                  <div className="font-bold text-green-600 w-24 text-right">₹{product.rate}</div>
                  <button type="button" onClick={() => removeProduct(product.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Square size={16} /> 
                  </button>
                </div>
              ))}
              {config.incentives.length === 0 && <p className="text-sm text-gray-500">No products configured.</p>}
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4 space-y-4">
              <h5 className="text-sm font-semibold text-blue-800">Add Custom Product</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Paint" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Type</label>
                  <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                    <option value="Bags">Bags</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Pcs">Pcs</option>
                    <option value="MT">MT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Incentive Rate (₹)</label>
                  <div className="flex gap-2">
                    <input type="number" value={newProduct.rate} onChange={e => setNewProduct({...newProduct, rate: e.target.value})} placeholder="Rate" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                    <button type="button" onClick={addProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full max-w-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mt-2"
          >
            {saving ? 'Saving Configurations...' : 'Save Global Configurations'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExec, setSelectedExec] = useState(null);
  const [inspectorMode, setInspectorMode] = useState('live');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading admin dashboard...</div>;
  if (!data) return <div className="py-8 text-center text-red-500">Failed to load admin data.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Active Execs</p>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.activeExecutives}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Total KMs (Today)</p>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.totalFieldKmsToday} km</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-center">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wider mb-1">Visits Today</p>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.totalVisitsToday}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-yellow-100 flex flex-col justify-center">
          <p className="text-xs text-yellow-600 font-medium uppercase tracking-wider mb-1">Pending Verifs</p>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.pendingVerifications}</p>
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
    </div>
  );
}

// ==========================================
// AUTH & MAIN APP
// ==========================================

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed';
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {isRegistering ? 'Field Executive Registration' : 'Sundaram Mahadeo Group'}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {isRegistering ? 'Submit profile for Administrator approval' : 'Official Financial & Operational Portal'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input type="text" placeholder="9435188967 or name@domain.com" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" required />
          </div>

          {!isRegistering && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">Admin Login Credentials</p>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">Phone: 9435188967 | Pass: admin123</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmailOrPhone('9435188967');
                  setPassword('admin123');
                }}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs"
              >
                Auto-fill
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm active:scale-98">
            {loading ? 'Processing...' : isRegistering ? 'Submit for Admin Approval' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <button onClick={() => { setIsRegistering(!isRegistering); setStatusMessage({ type: '', text: '' }); }} className="text-blue-600 text-xs font-bold hover:underline">
            {isRegistering ? 'Already have an approved account? Sign In' : 'New Executive? Register for Approval Gateway'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppContent() {
  const [user, setUser] = useState(() => {
    return safeJsonParse(localStorage.getItem('user'), null);
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentPage, setCurrentPage] = useState('admin-dashboard');
  const [hasGrantedPermissions, setHasGrantedPermissions] = useState(false);
  const [revokedPermissionReason, setRevokedPermissionReason] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);

  useEffect(() => {
    if (token) {
      const parsed = safeJsonParse(localStorage.getItem('user'), null);
      if (parsed) {
        setUser(parsed);
        if (parsed.role === 'ADMIN') {
          setCurrentPage('admin-dashboard');
          setHasGrantedPermissions(true); // Admins do not require field sensor guard
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
    setToken('');
    setUser(null);
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
        onLogin={(t, u) => { 
          setToken(t); 
          setUser(u); 
          if (u.role === 'ADMIN') {
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

  const isAdmin = user && user.role === 'ADMIN';

  // 1. Mandatory Device Permissions Gate for Field Executives
  if (!isAdmin && !hasGrantedPermissions && !isBypassed) {
    return (
      <PermissionsCheckScreen
        user={user}
        onPermissionsGranted={() => setHasGrantedPermissions(true)}
        onBypassTesting={() => {
          setIsBypassed(true);
          setHasGrantedPermissions(true);
        }}
      />
    );
  }

  const renderPage = () => {
    if (isAdmin) {
      switch (currentPage) {
        case 'admin-dashboard': return <AdminDashboard user={user} />;
        case 'admin-reports': return <AdminReports user={user} />;
        case 'admin-config': return <AdminConfig user={user} />;
        case 'admin-ums': return <AdminUMS user={user} />;
        case 'profile': return <ProfileSettings user={user} onLogout={handleLogout} />;
        default: return <AdminDashboard user={user} />;
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
      
      {/* 2. Fallback Lock Screen Overlay if permissions are revoked mid-shift */}
      {!isAdmin && revokedPermissionReason && !isBypassed && (
        <RevokedPermissionsOverlay
          revokedReason={revokedPermissionReason}
          onRecheckPermissions={handleRecheckRevokedPermissions}
          onBypassTesting={() => setIsBypassed(true)}
          onLogout={handleLogout}
        />
      )}

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none">
                {isAdmin ? 'ADMIN CONTROL' : 'SMM PORTAL'}
              </h1>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isAdmin ? 'Admin' : 'Field Exec'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1 truncate max-w-[200px] sm:max-w-xs">
              {isAdmin ? 'Sundaram Mahadeo Group' : `${user.fullName} • Shift Active`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Role Switcher for Audit & Testing */}
          <button
            onClick={handleToggleRoleForAudit}
            title="Switch View Mode"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-all"
          >
            <RefreshCw size={12} className="text-slate-500" />
            <span className="hidden sm:inline">Switch to</span> {isAdmin ? 'Exec' : 'Admin'}
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
      
      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {renderPage()}
      </main>

      {isAdmin ? (
        <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-5 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <button onClick={() => setCurrentPage('admin-dashboard')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-dashboard' || currentPage === 'dashboard' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Activity size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Dashboard</span></button>
          <button onClick={() => setCurrentPage('admin-reports')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-reports' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><FileText size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Reports</span></button>
          <button onClick={() => setCurrentPage('admin-config')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-config' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Settings2 size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Config</span></button>
          <button onClick={() => setCurrentPage('admin-ums')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'admin-ums' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><Users size={20} /><span className="text-[10px] font-medium truncate w-full text-center">UMS</span></button>
          <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center justify-center space-y-1 ${currentPage === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'}`}><User size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Profile</span></button>
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
