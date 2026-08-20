const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Navigation, Play, Square, FileText, CheckCircle, History, Search, TrendingUp, IndianRupee, User, Store, MapPin, Calendar, Settings, Users, Activity, BarChart, Settings2 } from 'lucide-react';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = \\\`Bearer \\\${token}\\\`;
  }
  return config;
});

// ==========================================
// ADMIN COMPONENTS
// ==========================================

function AdminUMS({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, ACTIVE, DISABLED
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'EXECUTIVE', supervisor: '', status: 'ACTIVE' });
  const [message, setMessage] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const normalizedUsers = res.data.users.map(u => ({ ...u, status: u.status || (u.role === 'ADMIN' ? 'ACTIVE' : 'PENDING') }));
      setUsers(normalizedUsers);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.put(\\\`/admin/users/\\\${editUser.user_id}/approve\\\`, editForm);
      setMessage('User updated successfully.');
      setEditUser(null);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update user.');
    }
  };

  const filteredUsers = users.filter(u => u.status === statusFilter);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-white border border-gray-200 rounded-xl max-w-sm shadow-sm">
        {['PENDING', 'ACTIVE', 'DISABLED'].map(status => (
          <button 
            key={status}
            onClick={() => setStatusFilter(status)} 
            className={\\\`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors \\\${statusFilter === status ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}\\\`}
          >
            {status}
          </button>
        ))}
      </div>

      {message && (
        <div className={\\\`p-4 rounded-xl text-sm font-medium \\\${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}\\\`}>
          {message}
        </div>
      )}

      {editUser && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in zoom-in-95">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User: {editUser.full_name}</h3>
          <form onSubmit={handleApprove} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="PENDING">Pending Approval</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duty / Role</label>
              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="EXECUTIVE">Field Executive</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Supervisor</label>
              <input type="text" value={editForm.supervisor} onChange={e => setEditForm({...editForm, supervisor: e.target.value})} placeholder="e.g. Ramesh Kumar" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg">Save Changes</button>
              <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-gray-500">
              <th className="p-4 font-medium">Name / Contact</th>
              <th className="p-4 font-medium">Role / Supervisor</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-semibold text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.phone_number}</p>
                </td>
                <td className="p-4">
                  <p className="font-medium text-gray-800">{u.role}</p>
                  <p className="text-xs text-gray-500">{u.supervisor || 'Unassigned'}</p>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => {
                      setEditUser(u);
                      setEditForm({ role: u.role, supervisor: u.supervisor || '', status: u.status });
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    {u.status === 'PENDING' ? 'Approve User' : 'Manage'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">No users found in this status.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
          <div className={\\\`p-4 rounded-xl mb-6 text-sm font-medium \\\${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}\\\`}>
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
            <p className="text-3xl font-black text-green-700">₹{data.salesReport?.totalBilling.toLocaleString()}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Quantities by Unit</p>
            {data.salesReport?.byUnit.map((u, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-700">{u.unit}</span>
                <span className="font-bold text-gray-900">{u.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IndianRupee size={20} className="text-green-600"/> Payment Collections
          </h3>
          <div className="mb-4">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-3xl font-black text-blue-700">₹{data.paymentReport?.totalCollections.toLocaleString()}</p>
          </div>
          <div className="space-y-3">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">By Mode</p>
             <div className="grid grid-cols-2 gap-2">
               {data.paymentReport?.byMode.map((m, i) => (
                 <div key={i} className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                   <p className="text-xs text-blue-600 font-semibold">{m.mode} ({m.count})</p>
                   <p className="font-bold text-blue-900">₹{m.amount.toLocaleString()}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-red-500"/> Field Inspector
          </h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setInspectorMode('live')} className={\`px-3 py-1 text-xs font-bold uppercase rounded-md \\\${inspectorMode === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}\\\`}>Live Tracking</button>
             <button onClick={() => setInspectorMode('history')} className={\`px-3 py-1 text-xs font-bold uppercase rounded-md \\\${inspectorMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}\\\`}>Route History</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-1 border-r border-gray-100 pr-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Executive</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.activity.map(exec => (
                  <button 
                    key={exec.id} 
                    onClick={() => setSelectedExec(exec)}
                    className={\`w-full text-left p-3 rounded-xl border transition-colors \\\${selectedExec?.id === exec.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}\\\`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{exec.name}</p>
                    <p className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span className={\`font-medium \\\${exec.status === 'Active' ? 'text-green-600' : 'text-gray-400'}\\\`}>{exec.status}</span>
                      <span>Visits: {exec.totalVisitsToday}</span>
                    </p>
                  </button>
                ))}
              </div>
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
          <div className={\\\`p-4 rounded-xl mb-6 text-sm font-medium \\\${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}\\\`}>
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

function ShiftDashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, {user?.fullName}</h2>
        <p className="text-sm text-gray-500 mb-6">Field Executive Dashboard</p>
        <button className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
          <Play size={20} /> START SHIFT
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 text-center">
          <p className="text-xs text-gray-500 font-bold uppercase">Visits Today</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-50 text-center">
          <p className="text-xs text-gray-500 font-bold uppercase">KMs Travelled</p>
          <p className="text-2xl font-bold text-green-600 mt-1">0.0</p>
        </div>
      </div>
    </div>
  );
}

function VisitLogger({ user }) {
  return <div className="p-6 bg-white rounded-2xl shadow-sm">Visit Logger Placeholder</div>;
}
function VisitHistory({ user }) {
  return <div className="p-6 bg-white rounded-2xl shadow-sm">Visit History Placeholder</div>;
}
function IncentivesDashboard({ user }) {
  return <div className="p-6 bg-white rounded-2xl shadow-sm">Incentives Placeholder</div>;
}
function FirmOnboarding({ user }) {
  return <div className="p-6 bg-white rounded-2xl shadow-sm">Firm Onboarding Placeholder</div>;
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await api.post('/auth/register', { fullName, phoneNumber, currentAddress, email: emailOrPhone, password });
        setError('Registration successful! Please wait for Admin approval to login.');
        setIsRegistering(false);
      } else {
        const res = await api.post('/auth/login', { emailOrPhone, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{isRegistering ? 'Field Exec Registration' : 'SMM Portal Login'}</h2>
        {error && <div className={\\\`p-4 mb-6 rounded-lg text-sm \\\${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}\\\`}>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" required />
              <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" required />
              <input type="text" placeholder="Current Address" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" required />
            </>
          )}
          <input type="text" placeholder="Email Address" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">{loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-blue-600 text-sm font-medium hover:underline">
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [locationError, setLocationError] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let watchId;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        () => setLocationError(false),
        (error) => {
          console.error('Geolocation error:', error.message || error);
          setLocationError(true);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      setLocationError(true);
    }
    return () => { if (watchId !== undefined) navigator.geolocation.clearWatch(watchId); };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  if (!token) return <Login onLogin={(t, u) => { setToken(t); setUser(u); }} />;
  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>;

  if (locationError && !isBypassed) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6"><Navigation size={32} /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">GPS Required</h2>
          <p className="text-gray-600 mb-6 text-sm">Please enable location services.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-3">Check Again</button>
          <button onClick={() => setIsBypassed(true)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors">Bypass for Testing</button>
        </div>
      </div>
    );
  }

  const isAdmin = user && user.role === 'ADMIN';

  const renderPage = () => {
    if (isAdmin) {
      switch (currentPage) {
        case 'admin-dashboard': return <AdminDashboard user={user} />;
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">{isAdmin ? 'ADMIN CONTROL' : 'SMM PORTAL'}</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">{isAdmin ? 'Sundaram Mahadeo Group' : \\\`\\\${user.fullName} • Field Exec\\\`}</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><LogOut size={20} /></button>
      </header>
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {renderPage()}
      </main>

      {isAdmin ? (
        <nav className="fixed bottom-0 w-full max-w-4xl mx-auto bg-white border-t border-gray-200 grid grid-cols-4 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <button onClick={() => setCurrentPage('admin-dashboard')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'admin-dashboard' || currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><Activity size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Dashboard</span></button>
          <button onClick={() => setCurrentPage('admin-config')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'admin-config' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><Settings2 size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Config</span></button>
          <button onClick={() => setCurrentPage('admin-ums')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'admin-ums' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><Users size={20} /><span className="text-[10px] font-medium truncate w-full text-center">UMS</span></button>
          <button onClick={() => setCurrentPage('profile')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><User size={20} /><span className="text-[10px] font-medium truncate w-full text-center">Profile</span></button>
        </nav>
      ) : (
        <nav className="fixed bottom-0 w-full max-w-4xl mx-auto bg-white border-t border-gray-200 grid grid-cols-5 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <button onClick={() => setCurrentPage('dashboard')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'dashboard' || currentPage === 'admin-dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><Activity size={20} /><span className="text-[10px] font-medium">Home</span></button>
          <button onClick={() => setCurrentPage('visits')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'visits' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><CheckCircle size={20} /><span className="text-[10px] font-medium">Log</span></button>
          <button onClick={() => setCurrentPage('history')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><History size={20} /><span className="text-[10px] font-medium">History</span></button>
          <button onClick={() => setCurrentPage('onboard')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'onboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><Store size={20} /><span className="text-[10px] font-medium">Onboard</span></button>
          <button onClick={() => setCurrentPage('profile')} className={\\\`flex flex-col items-center justify-center space-y-1 \\\${currentPage === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}\\\`}><User size={20} /><span className="text-[10px] font-medium">Profile</span></button>
        </nav>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', code);
