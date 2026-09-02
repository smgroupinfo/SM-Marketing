import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, KeyRound, Edit, Check, X, Shield, 
  Search, RefreshCw, AlertTriangle, Phone, Mail, User as UserIcon,
  UserPlus, Copy, CheckCircle2, Lock
} from 'lucide-react';
import { api } from '../lib/api';
import { directSupabaseCreateSubordinateUser } from '../lib/supabaseDataService';

export default function AdminUMS({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, ACTIVE, DISABLED
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Subordinate Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: 'EXECUTIVE',
    supervisor: '',
    password: '',
    currentAddress: ''
  });
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);

  // Edit User Modal State
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: 'EXECUTIVE',
    supervisor: '',
    status: 'ACTIVE'
  });

  // Reset Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const rawUsers = Array.isArray(res.data?.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []);
      const normalizedUsers = rawUsers.map(u => ({
        ...u,
        status: u.status || (u.role === 'ADMIN' ? 'ACTIVE' : 'PENDING')
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setMessage({ type: 'error', text: 'Failed to load users list.' });
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Status Update (Approve / Disable / Activate)
  const handleQuickStatusChange = async (targetUser, newStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${targetUser.user_id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.user_id === targetUser.user_id ? { ...u, status: newStatus } : u));
      setMessage({ 
        type: 'success', 
        text: `User ${targetUser.full_name} is now ${newStatus === 'ACTIVE' ? 'APPROVED & ACTIVE' : newStatus}.` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update user status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (u) => {
    setEditUser(u);
    setEditForm({
      fullName: u.full_name || '',
      phoneNumber: u.phone_number || '',
      email: u.email || '',
      role: u.role || 'EXECUTIVE',
      supervisor: u.supervisor || '',
      status: u.status || 'ACTIVE'
    });
  };

  // Save Edit User Details
  const handleSaveUserDetails = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${editUser.user_id}`, editForm);
      setMessage({ type: 'success', text: `Profile updated for ${editForm.fullName}.` });
      setEditUser(null);
      fetchUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (u) => {
    setPasswordModalUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // Generate random strong password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Smm@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setPasswordError('');
  };

  // Submit Admin Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setActionLoading(true);
    setPasswordError('');
    try {
      await api.post(`/admin/users/${passwordModalUser.user_id}/reset-password`, { newPassword });
      setMessage({ 
        type: 'success', 
        text: `Password for ${passwordModalUser.full_name} was reset to "${newPassword}".` 
      });
      setPasswordModalUser(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Create Subordinate User
  const handleCreateSubordinateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Full Name and Phone Number are required.' });
      return;
    }

    const cleanPhone = createForm.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    const password = (createForm.password || 'exec123').trim();
    const cleanEmail = createForm.email ? createForm.email.trim().toLowerCase() : `${cleanPhone}@smm.com`;

    setActionLoading(true);
    try {
      const payload = {
        fullName: createForm.fullName.trim(),
        phoneNumber: cleanPhone,
        email: cleanEmail,
        password: password,
        role: createForm.role || 'EXECUTIVE',
        supervisor: createForm.supervisor?.trim() || '',
        currentAddress: createForm.currentAddress?.trim() || 'Field Operations',
        status: 'ACTIVE'
      };

      try {
        await api.post('/admin/users', payload);
      } catch (apiErr) {
        console.warn('API route failed, falling back to direct service:', apiErr);
        await directSupabaseCreateSubordinateUser(payload);
      }

      setCreatedCredentialsModal({
        fullName: payload.fullName,
        phone: cleanPhone,
        email: cleanEmail,
        password: password,
        role: payload.role
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        phoneNumber: '',
        email: '',
        role: 'EXECUTIVE',
        supervisor: '',
        password: '',
        currentAddress: ''
      });

      fetchUsers();
      setMessage({
        type: 'success',
        text: `Subordinate account created for ${payload.fullName} (${cleanPhone}).`
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to create subordinate user.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone_number?.includes(searchQuery) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countPending = users.filter(u => u.status === 'PENDING').length;
  const countActive = users.filter(u => u.status === 'ACTIVE').length;
  const countDisabled = users.filter(u => u.status === 'DISABLED').length;

  const isExecutiveAssistant = user && user.role === 'EXECUTIVE_ASSISTANT';

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" size={24} /> User Management System (UMS)
            </h2>
            {isExecutiveAssistant && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Read-Only Access
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isExecutiveAssistant 
              ? 'View all registered field executives, assistants, and account statuses (Read-Only).' 
              : 'Control employee gateway, approve new executive registrations, and manage duty credentials.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!isExecutiveAssistant && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <UserPlus size={16} /> Add Subordinate / Executive
            </button>
          )}
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
      </div>

      {isExecutiveAssistant && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center gap-2 font-medium">
          <Shield size={16} className="text-indigo-600 shrink-0" />
          <span>Executive Assistant profile active: You can inspect employee records, supervisors, and duty roles in read-only mode. Modifying accounts and password resets require Administrator authorization.</span>
        </div>
      )}

      {/* Global Status Message Toast */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm max-w-md">
          <button 
            onClick={() => setStatusFilter('ALL')} 
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">{users.length}</span>
          </button>
          <button 
            onClick={() => setStatusFilter('PENDING')} 
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Pending {countPending > 0 && <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">{countPending}</span>}
          </button>
          <button 
            onClick={() => setStatusFilter('ACTIVE')} 
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'ACTIVE' ? 'bg-green-600 text-white shadow-sm' : 'text-green-700 hover:bg-green-50'
            }`}
          >
            Active <span className="text-[10px] opacity-80">({countActive})</span>
          </button>
          <button 
            onClick={() => setStatusFilter('DISABLED')} 
            className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              statusFilter === 'DISABLED' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Disabled <span className="text-[10px] opacity-80">({countDisabled})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone, email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading user database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Executive / User Details</th>
                  <th className="p-4">Role & Supervisor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => {
                  const isPending = u.status === 'PENDING';
                  const isActive = u.status === 'ACTIVE';
                  const isDisabled = u.status === 'DISABLED';
                  const isAdminUser = u.role === 'ADMIN';
                  const isEAUser = u.role === 'EXECUTIVE_ASSISTANT';

                  return (
                    <tr key={u.user_id} className={`hover:bg-blue-50/40 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isAdminUser ? 'bg-purple-100 text-purple-700' :
                            isEAUser ? 'bg-indigo-100 text-indigo-700' :
                            isActive ? 'bg-blue-100 text-blue-700' :
                            isPending ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-1.5">
                              {u.full_name}
                              {isAdminUser && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Admin</span>}
                              {isEAUser && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Exec Assistant</span>}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone size={12} className="text-gray-400" /> {u.phone_number || 'No phone'}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail size={12} className="text-gray-400" /> {u.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                          isAdminUser ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          isEAUser ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role === 'EXECUTIVE_ASSISTANT' ? 'Executive Assistant' : u.role === 'ADMIN' ? 'Administrator' : u.role || 'EXECUTIVE'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="text-gray-400">Supervisor:</span> {u.supervisor || <span className="text-gray-400 italic">Unassigned</span>}
                        </p>
                      </td>

                      <td className="p-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Pending Approval
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span> Active
                          </span>
                        )}
                        {isDisabled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Disabled
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isExecutiveAssistant ? (
                          <span className="text-xs text-gray-400 italic font-medium px-2 py-1 bg-gray-50 rounded-lg">
                            Read-Only Record
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick 1-Click Approve / Activate */}
                            {isPending && (
                              <button
                                onClick={() => handleQuickStatusChange(u, 'ACTIVE')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                                title="Grant instant login access"
                              >
                                <UserCheck size={14} /> Approve
                              </button>
                            )}

                            {isDisabled && (
                              <button
                                onClick={() => handleQuickStatusChange(u, 'ACTIVE')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                                title="Re-activate user"
                              >
                                <Check size={14} /> Activate
                              </button>
                            )}

                            {isActive && !isAdminUser && (
                              <button
                                onClick={() => handleQuickStatusChange(u, 'DISABLED')}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors"
                                title="Disable executive access"
                              >
                                <UserX size={14} /> Disable
                              </button>
                            )}

                            {/* Edit User Details */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                              title="Edit User Details"
                            >
                              <Edit size={14} /> Edit
                            </button>

                            {/* Admin Reset Password Override */}
                            <button
                              onClick={() => openResetPasswordModal(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition-colors"
                              title="Admin Reset Password"
                            >
                              <KeyRound size={14} /> Password
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500">
                      No users match the selected status filter or search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL 1: EDIT USER DETAILS                */}
      {/* ========================================== */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="text-blue-600" size={20} /> Edit User Details: {editUser.full_name}
              </h3>
              <button onClick={() => setEditUser(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm?.fullName ?? ''} 
                    onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={editForm?.phoneNumber ?? ''} 
                    onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={editForm?.email ?? ''} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duty / Role</label>
                  <select 
                    value={editForm?.role ?? 'EXECUTIVE'} 
                    onChange={e => setEditForm({...editForm, role: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="EXECUTIVE">Field Executive</option>
                    <option value="EXECUTIVE_ASSISTANT">Executive Assistant (Read-Only Reports & Audit)</option>
                    <option value="MANAGER">Manager / Supervisor</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Gateway Status</label>
                  <select 
                    value={editForm?.status ?? 'ACTIVE'} 
                    onChange={e => setEditForm({...editForm, status: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (Authorized to Login)</option>
                    <option value="PENDING">PENDING (Blocked until Approved)</option>
                    <option value="DISABLED">DISABLED (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Supervisor / Manager</label>
                <input 
                  type="text" 
                  value={editForm?.supervisor ?? ''} 
                  onChange={e => setEditForm({...editForm, supervisor: e.target.value})} 
                  placeholder="e.g. Rajesh Sharma (Zonal Manager)" 
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm"
                >
                  {actionLoading ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditUser(null)} 
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: ADMIN RESET PASSWORD OVERRIDE    */}
      {/* ========================================== */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="text-purple-600" size={20} /> Override Password
              </h3>
              <button onClick={() => setPasswordModalUser(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 mb-4">
              <p className="text-xs font-semibold text-purple-900">
                Target User: <span className="font-bold">{passwordModalUser.full_name}</span>
              </p>
              <p className="text-xs text-purple-700 mt-0.5">
                Email / Login: {passwordModalUser.email}
              </p>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                <AlertTriangle size={16} /> {passwordError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">New Password</label>
                  <button 
                    type="button" 
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline"
                  >
                    Auto-Generate Strong Password
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter new password" 
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="text" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter new password" 
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-purple-500" 
                  required 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm"
                >
                  {actionLoading ? 'Updating Password...' : 'Save & Overwrite Password'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPasswordModalUser(null)} 
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: CREATE SUBORDINATE USER / EXEC   */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={20} /> Create Subordinate User
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubordinateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={createForm.fullName} 
                    onChange={e => setCreateForm({...createForm, fullName: e.target.value})} 
                    placeholder="e.g. Ramesh Kumar" 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile / Login ID *</label>
                  <input 
                    type="tel" 
                    required 
                    value={createForm.phoneNumber} 
                    onChange={e => setCreateForm({...createForm, phoneNumber: e.target.value})} 
                    placeholder="10-digit mobile number" 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={createForm.email} 
                    onChange={e => setCreateForm({...createForm, email: e.target.value})} 
                    placeholder="subordinate@company.com" 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Operational Role *</label>
                  <select 
                    value={createForm.role} 
                    onChange={e => setCreateForm({...createForm, role: e.target.value})} 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="EXECUTIVE">Field Executive</option>
                    <option value="EXECUTIVE_ASSISTANT">Executive Assistant</option>
                    <option value="MANAGER">Branch / Operations Manager</option>
                    <option value="AUDITOR">Financial Auditor</option>
                    <option value="ADMIN">Co-Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Initial Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const pass = 'sub' + Math.floor(100000 + Math.random() * 900000);
                        setCreateForm(prev => ({ ...prev, password: pass }));
                      }}
                      className="text-[10px] text-blue-600 underline hover:text-blue-800 cursor-pointer"
                    >
                      Generate Auto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={createForm.password} 
                    onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                    placeholder="e.g. exec123" 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Supervisor</label>
                  <input 
                    type="text" 
                    value={createForm.supervisor} 
                    onChange={e => setCreateForm({...createForm, supervisor: e.target.value})} 
                    placeholder="e.g. Area Sales Manager" 
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Territory / Address</label>
                <input 
                  type="text" 
                  value={createForm.currentAddress} 
                  onChange={e => setCreateForm({...createForm, currentAddress: e.target.value})} 
                  placeholder="e.g. Guwahati Central Zone" 
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Subordinate...' : 'Create & Authorize User'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: CREATED SUBORDINATE CONFIRMATION  */}
      {/* ========================================== */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} className="text-green-600" />
                <h3 className="font-bold text-gray-900 text-base">User Created Successfully</h3>
              </div>
              <button onClick={() => setCreatedCredentialsModal(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <div className="text-xs text-gray-500 font-medium">
                User Full Name: <strong className="text-gray-900 text-sm block">{createdCredentialsModal.fullName}</strong>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Login Mobile:</span>
                  <span className="font-mono font-bold text-blue-600">{createdCredentialsModal.phone}</span>
                </div>
                {createdCredentialsModal.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-mono text-gray-700">{createdCredentialsModal.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <span className="text-blue-900 font-bold">Password:</span>
                  <span className="font-mono font-bold text-blue-700 tracking-wider text-sm">{createdCredentialsModal.password}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Assigned Role:</span>
                  <span className="font-bold text-gray-800">{createdCredentialsModal.role}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
              ✓ Subordinate account is immediately active. The user can now log into the application using their phone number and password.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const text = `*New Account Created*\nName: ${createdCredentialsModal.fullName}\nLogin Mobile: ${createdCredentialsModal.phone}\nPassword: ${createdCredentialsModal.password}\nRole: ${createdCredentialsModal.role}`;
                  navigator.clipboard?.writeText(text);
                  setMessage({ type: 'success', text: 'Credentials copied to clipboard!' });
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Copy size={15} /> Copy Credentials
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentialsModal(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
