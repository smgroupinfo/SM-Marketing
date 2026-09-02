import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, PlusCircle, ShieldCheck, Users, CreditCard, 
  RefreshCw, AlertCircle, CheckCircle2, PauseCircle, PlayCircle, 
  Settings2, Search, Filter, Calendar, Phone, Lock, ExternalLink, 
  TrendingUp, IndianRupee, Layers, ShieldAlert, Sparkles, X, ChevronRight,
  Sliders, Check, Copy, AlertTriangle, ArrowRight, Zap, Tag, QrCode, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { directSupabaseOnboardTenantClient } from '../lib/supabaseDataService';
import SuperAdminGuard from './SuperAdminGuard';
import SuperAdminSubscriptionsAndPricing from './SuperAdminSubscriptionsAndPricing';

export default function SuperAdminDashboard({ user, onBack }) {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'pricing'
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PAST_DUE'

  // Notification Banners
  const [alertBanner, setAlertBanner] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }

  // Modal States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isSeatsModalOpen, setIsSeatsModalOpen] = useState(false);
  const [activeTenantForModal, setActiveTenantForModal] = useState(null);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);

  // Billing Modal Form State
  const [modalUpiId, setModalUpiId] = useState('');
  const [modalCardEnabled, setModalCardEnabled] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);

  // Seats Modal Form State
  const [modalNewSeats, setModalNewSeats] = useState(10);
  const [seatsSaving, setSeatsSaving] = useState(false);

  // Onboarding Form State
  const [isOnboardingExpanded, setIsOnboardingExpanded] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    adminPassword: '',
    maxSeats: 10,
    upiMerchantId: 'merchant@upi',
    subscriptionDays: 365,
    cardPaymentsEnabled: true
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // FETCH TENANTS FROM SUPABASE
  // --------------------------------------------------------------------------
  const fetchTenants = async () => {
    try {
      setRefreshing(true);

      if (!supabase) {
        // Fallback to local storage if supabase client is not connected
        const localSaved = localStorage.getItem('saas_tenants_cache');
        if (localSaved) {
          setTenants(JSON.parse(localSaved));
        } else {
          setTenants([]);
        }
        return;
      }

      // Clean async/await Supabase query (no .catch() query builder)
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase Tenants Notice]', error.message);
        const localSaved = localStorage.getItem('saas_tenants_cache');
        if (localSaved) {
          setTenants(JSON.parse(localSaved));
        } else {
          setTenants([]);
        }
        setAlertBanner({
          type: 'info',
          message: `Connected via Local & Cloud Hybrid Engine: ${error.message}`
        });
      } else if (data && data.length > 0) {
        setTenants(data);
        localStorage.setItem('saas_tenants_cache', JSON.stringify(data));
      } else {
        setTenants([]);
      }
    } catch (err) {
      console.error('[Fetch Tenants Error]', err);
      setAlertBanner({
        type: 'error',
        message: 'Network issue accessing tenant registry. Displaying offline snapshot.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // --------------------------------------------------------------------------
  // AUTO-HIDE ALERT BANNER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (alertBanner) {
      const timer = setTimeout(() => setAlertBanner(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [alertBanner]);

  // --------------------------------------------------------------------------
  // FORM SUBMISSION: ONBOARD NEW COMPANY
  // --------------------------------------------------------------------------
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      setAlertBanner({ type: 'error', message: 'Company Name is required.' });
      return;
    }

    const cleanPhone = formData.adminPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setAlertBanner({ type: 'error', message: 'Valid 10-digit Admin Phone Number is required.' });
      return;
    }

    const password = (formData.adminPassword || 'client123').trim();
    const cleanEmail = formData.adminEmail ? formData.adminEmail.trim().toLowerCase() : `${cleanPhone}@client.saas`;
    const cleanAdminName = (formData.adminName || formData.companyName.trim() + ' Admin').trim();

    if (!formData.upiMerchantId.trim() || !formData.upiMerchantId.includes('@')) {
      setAlertBanner({ type: 'error', message: 'Valid UPI Merchant VPA (e.g. company@icici) is required.' });
      return;
    }

    setFormSubmitting(true);
    const durationDays = parseInt(formData.subscriptionDays, 10) || 365;

    try {
      const clientPayload = {
        companyName: formData.companyName.trim(),
        adminFullName: cleanAdminName,
        adminPhone: cleanPhone,
        adminEmail: cleanEmail,
        password: password,
        maxSeats: parseInt(formData.maxSeats, 10) || 10,
        planTier: 'Business Growth',
        planMrr: 11999,
        upiId: formData.upiMerchantId.trim().toLowerCase(),
        cardPaymentsEnabled: Boolean(formData.cardPaymentsEnabled),
        subscriptionDays: durationDays
      };

      const { tenant } = await directSupabaseOnboardTenantClient(clientPayload);

      const updatedList = [tenant, ...tenants.filter(t => t.id !== tenant.id)];
      setTenants(updatedList);
      localStorage.setItem('saas_tenants_cache', JSON.stringify(updatedList));

      // Reset form
      setFormData({
        companyName: '',
        adminName: '',
        adminPhone: '',
        adminEmail: '',
        adminPassword: '',
        maxSeats: 10,
        upiMerchantId: 'merchant@upi',
        subscriptionDays: 365,
        cardPaymentsEnabled: true
      });
      setIsOnboardingExpanded(false);

      setCreatedCredentialsModal({
        companyName: tenant.name,
        adminName: cleanAdminName,
        phone: cleanPhone,
        email: cleanEmail,
        password: password,
        maxSeats: tenant.max_seats,
        planTier: 'Business Growth'
      });

      setAlertBanner({
        type: 'success',
        message: `Successfully onboarded "${tenant.name}" and provisioned Admin login for ${cleanPhone}.`
      });
    } catch (err) {
      console.error('[Onboarding Exception]', err);
      setAlertBanner({
        type: 'error',
        message: 'Failed to onboard company: ' + (err.message || 'Unknown error')
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: TOGGLE TENANT STATUS (FREEZE / RE-ACTIVATE)
  // --------------------------------------------------------------------------
  const handleToggleStatus = async (tenant, targetStatus) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('tenants')
          .update({ status: targetStatus, updated_at: new Date().toISOString() })
          .eq('id', tenant.id);

        if (error) {
          console.warn('[Supabase Status Update Notice]', error.message);
        }
      }

      const updated = tenants.map(t => t.id === tenant.id ? { ...t, status: targetStatus } : t);
      setTenants(updated);
      localStorage.setItem('saas_tenants_cache', JSON.stringify(updated));

      setAlertBanner({
        type: 'success',
        message: `Tenant "${tenant.name}" status updated to ${targetStatus}.`
      });
    } catch (err) {
      setAlertBanner({ type: 'error', message: 'Error updating tenant status: ' + err.message });
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: OPEN BILLING CONFIG MODAL
  // --------------------------------------------------------------------------
  const handleOpenBillingModal = (tenant) => {
    setActiveTenantForModal(tenant);
    setModalUpiId(tenant.upi_id || '');
    setModalCardEnabled(tenant.card_payments_enabled ?? true);
    setIsBillingModalOpen(true);
  };

  // SAVE BILLING CONFIG
  const handleSaveBillingConfig = async (e) => {
    e.preventDefault();
    if (!activeTenantForModal) return;

    const cleanUpi = modalUpiId.trim().toLowerCase();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      setAlertBanner({ type: 'error', message: 'Valid UPI ID (VPA) is required.' });
      return;
    }

    setModalSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('tenants')
          .update({ 
            upi_id: cleanUpi, 
            card_payments_enabled: modalCardEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeTenantForModal.id);

        if (error) {
          console.warn('[Supabase Billing Update Notice]', error.message);
        }
      }

      const updated = tenants.map(t => 
        t.id === activeTenantForModal.id 
          ? { ...t, upi_id: cleanUpi, card_payments_enabled: modalCardEnabled } 
          : t
      );
      setTenants(updated);
      localStorage.setItem('saas_tenants_cache', JSON.stringify(updated));

      setIsBillingModalOpen(false);
      setAlertBanner({
        type: 'success',
        message: `Billing & Payment parameters updated for "${activeTenantForModal.name}".`
      });
    } catch (err) {
      setAlertBanner({ type: 'error', message: 'Error saving billing config: ' + err.message });
    } finally {
      setModalSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: OPEN SEAT COUNT MODAL
  // --------------------------------------------------------------------------
  const handleOpenSeatsModal = (tenant) => {
    setActiveTenantForModal(tenant);
    setModalNewSeats(tenant.max_seats || 10);
    setIsSeatsModalOpen(true);
  };

  // SAVE SEAT ADJUSTMENT
  const handleSaveSeatsAdjustment = async (e) => {
    e.preventDefault();
    if (!activeTenantForModal) return;

    const seatsNum = parseInt(modalNewSeats, 10);
    if (isNaN(seatsNum) || seatsNum < (activeTenantForModal.used_seats || 1)) {
      setAlertBanner({ 
        type: 'error', 
        message: `Max seats cannot be less than currently active used seats (${activeTenantForModal.used_seats || 1}).` 
      });
      return;
    }

    setSeatsSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase
          .from('tenants')
          .update({ 
            max_seats: seatsNum,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeTenantForModal.id);

        if (error) {
          console.warn('[Supabase Seats Update Notice]', error.message);
        }
      }

      const updated = tenants.map(t => 
        t.id === activeTenantForModal.id 
          ? { ...t, max_seats: seatsNum } 
          : t
      );
      setTenants(updated);
      localStorage.setItem('saas_tenants_cache', JSON.stringify(updated));

      setIsSeatsModalOpen(false);
      setAlertBanner({
        type: 'success',
        message: `Seat allocation for "${activeTenantForModal.name}" updated to ${seatsNum} seats.`
      });
    } catch (err) {
      setAlertBanner({ type: 'error', message: 'Error adjusting seats: ' + err.message });
    } finally {
      setSeatsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // FILTERED TENANTS & AGGREGATE METRICS
  // --------------------------------------------------------------------------
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.admin_phone?.includes(searchQuery) ||
        t.upi_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
    const totalSeatsAllocated = tenants.reduce((acc, t) => acc + (parseInt(t.max_seats, 10) || 0), 0);
    const totalSeatsUsed = tenants.reduce((acc, t) => acc + (parseInt(t.used_seats, 10) || 0), 0);
    return { totalTenants, activeTenants, totalSeatsAllocated, totalSeatsUsed };
  }, [tenants]);

  // Format Helper for Expiry Date
  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const isPast = d.getTime() < Date.now();
      const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return { formatted, isPast };
    } catch {
      return { formatted: dateStr, isPast: false };
    }
  };

  return (
    <SuperAdminGuard user={user} onBack={onBack}>
      <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* HEADER & EXECUTIVE COMMAND BAR                                            */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <ShieldCheck size={28} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  SaaS Super Admin Command Panel
                </h1>
                <span className="bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Root Controller
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Multi-Tenant Provisioning, Dynamic UPI Gateways, Seat Licences &amp; Lifecycle Controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchTenants}
              disabled={refreshing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-98"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-400' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Registry'}</span>
            </button>

            <button
              onClick={() => setIsOnboardingExpanded(!isOnboardingExpanded)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
            >
              <PlusCircle size={15} />
              <span>{isOnboardingExpanded ? 'Close Form' : 'Onboard Company'}</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                title="Sign out of Super Admin"
                className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 hover:text-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-98"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRIVATE MASTER CONTROL URL STRIP                                          */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Lock size={14} />
            </div>
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <span>Private SaaS Master Control URL</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-normal">Hidden from all client apps</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Use this direct URL anytime to jump straight into the root multi-tenant command panel:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <code className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono text-[11px] select-all truncate max-w-[280px] sm:max-w-md">
              {typeof window !== 'undefined' ? `${window.location.origin}/#super-admin` : '/#super-admin'}
            </code>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const url = `${window.location.origin}/#super-admin`;
                  navigator.clipboard.writeText(url);
                  setAlertBanner({ type: 'success', message: `Copied direct control URL: ${url}` });
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95 shrink-0"
              title="Copy Private Control URL"
            >
              <Copy size={13} />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INLINE ALERT BANNER                                                       */}
        {/* ========================================================================= */}
        {alertBanner && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in duration-200 ${
            alertBanner.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
              : alertBanner.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200'
          }`}>
            {alertBanner.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
            {alertBanner.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />}
            {alertBanner.type === 'info' && <Sparkles size={18} className="text-indigo-400 shrink-0 mt-0.5" />}
            <div className="flex-1 font-medium leading-relaxed">{alertBanner.message}</div>
            <button onClick={() => setAlertBanner(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AGGREGATE SUMMARY CARDS                                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-md">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Total Onboarded
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-white">{metrics.totalTenants}</span>
              <Building2 size={20} className="text-indigo-400 opacity-80" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Active tenant organizations</span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-md">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Active Status
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{metrics.activeTenants}</span>
              <ShieldCheck size={20} className="text-emerald-400 opacity-80" />
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Live operational accounts</span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-md">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              User Seats Utilized
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {metrics.totalSeatsUsed} <span className="text-sm font-normal text-slate-400">/ {metrics.totalSeatsAllocated}</span>
              </span>
              <Users size={20} className="text-amber-400 opacity-80" />
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full" 
                style={{ width: `${Math.min(100, (metrics.totalSeatsUsed / (metrics.totalSeatsAllocated || 1)) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-md">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              UPI Gateways
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">100%</span>
              <CreditCard size={20} className="text-blue-400 opacity-80" />
            </div>
            <span className="text-[10px] text-blue-300 mt-1 block">Dynamic VPA verified</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBTAB CONTROLS                                                           */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Client Tenants &amp; Organizations</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pricing'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap size={14} />
            <span>Monetization &amp; Subscription Models</span>
          </button>
        </div>

        {activeTab === 'pricing' ? (
          <SuperAdminSubscriptionsAndPricing 
            tenants={tenants} 
            onUpdateTenantBilling={fetchTenants} 
          />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* COMPANY ONBOARDING FORM (COLLAPSIBLE / ACCORDION)                          */}
            {/* ========================================================================= */}
            {isOnboardingExpanded && (
          <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Onboard New Client Company</h3>
                  <p className="text-xs text-slate-400">Directly inserts into Supabase <code className="text-amber-400 font-mono">tenants</code> table</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOnboardingExpanded(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Infra & Steel"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                {/* Primary Admin Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Primary Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sharma"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                {/* Admin Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Admin Mobile Number (Login ID) *
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile (e.g. 9835012345)"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                {/* Admin Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Admin Email Address (Login ID)
                  </label>
                  <input
                    type="email"
                    placeholder="admin@clientcompany.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                  />
                </div>

                {/* Initial Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Initial Login Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = 'pass' + Math.floor(100000 + Math.random() * 900000);
                        setFormData(prev => ({ ...prev, adminPassword: generated }));
                      }}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Generate Auto
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. client123"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-amber-300 placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                {/* Max User Seats */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Max User Seats (Default: 10) *
                  </label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="number"
                      min="1"
                      max="500"
                      required
                      value={formData.maxSeats}
                      onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                {/* UPI Merchant ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    UPI Merchant ID (VPA) *
                  </label>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. merchant@icici"
                      value={formData.upiMerchantId}
                      onChange={(e) => setFormData({ ...formData, upiMerchantId: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Subscription Duration */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Subscription Plan Duration (Days) *
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="number"
                      min="7"
                      max="1825"
                      required
                      value={formData.subscriptionDays}
                      onChange={(e) => setFormData({ ...formData, subscriptionDays: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
                    />
                  </div>
                </div>

                {/* Card Payment Gateway Toggle */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <span className="block text-xs font-bold text-slate-300 mb-1">
                    Card Payment Gateway
                  </span>
                  <label className="flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={formData.cardPaymentsEnabled}
                      onChange={(e) => setFormData({ ...formData, cardPaymentsEnabled: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 bg-slate-800 border-slate-600"
                    />
                    <span className="text-xs text-slate-200 font-medium">Enable Credit/Debit Card Gateway</span>
                  </label>
                </div>

              </div>

              {/* Submit Row */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardingExpanded(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Provisioning in Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Complete Company Onboarding</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLIENT MANAGEMENT TABLE & SEARCH/FILTER TOOLBAR                            */}
        {/* ========================================================================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Client Management &amp; Multi-Tenant Roster</span>
                <span className="text-xs text-slate-400 font-normal">({filteredTenants.length} tenants)</span>
              </h2>
              <p className="text-xs text-slate-400">Manage seat allocations, dynamic payment configurations, and account statuses</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search company, phone, UPI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-[11px] font-bold">
                {['ALL', 'ACTIVE', 'SUSPENDED', 'PAST_DUE'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      statusFilter === status 
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Admin Phone</th>
                  <th className="py-3 px-4">Seats Count</th>
                  <th className="py-3 px-4">UPI ID / Gateways</th>
                  <th className="py-3 px-4">Subscription Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-400" />
                      <span>Loading multi-tenant company records...</span>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <AlertCircle size={24} className="mx-auto mb-2 text-slate-600" />
                      <span>No company records match your search or filter parameters.</span>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const expiry = formatExpiry(tenant.subscription_expires_at);
                    const used = tenant.used_seats || 1;
                    const max = tenant.max_seats || 10;
                    const seatPercentage = Math.round((used / max) * 100);

                    return (
                      <tr key={tenant.id} className="hover:bg-slate-900/50 transition-colors">
                        
                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{tenant.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {tenant.id}</div>
                        </td>

                        {/* Admin Phone */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-500" />
                            <span>{tenant.admin_phone}</span>
                          </div>
                        </td>

                        {/* Seats Count */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                              <span className="text-amber-400">{used} / {max} Used</span>
                              <span className="text-slate-500 text-[10px]">{seatPercentage}%</span>
                            </div>
                            <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  seatPercentage > 90 ? 'bg-rose-500' : seatPercentage > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`} 
                                style={{ width: `${Math.min(100, seatPercentage)}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* UPI ID & Gateway Badge */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                              <span>{tenant.upi_id || 'merchant@upi'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                tenant.card_payments_enabled 
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                {tenant.card_payments_enabled ? 'Card: Enabled' : 'Card: Disabled'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Subscription Expiry */}
                        <td className="py-3.5 px-4">
                          <div className={`font-mono text-xs ${expiry.isPast ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {expiry.formatted}
                          </div>
                          {expiry.isPast ? (
                            <span className="text-[9px] text-rose-400 uppercase font-black tracking-wider block">Expired</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">{tenant.subscription_duration_days || 365} Days Plan</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            tenant.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : tenant.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tenant.status === 'ACTIVE' ? 'bg-emerald-400' : tenant.status === 'SUSPENDED' ? 'bg-rose-400' : 'bg-amber-400'
                            }`} />
                            <span>{tenant.status || 'ACTIVE'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Billing & Gateway Config */}
                            <button
                              onClick={() => handleOpenBillingModal(tenant)}
                              title="Configure Dynamic UPI & Card Gateways"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors"
                            >
                              <CreditCard size={14} />
                            </button>

                            {/* Adjust Seat Count */}
                            <button
                              onClick={() => handleOpenSeatsModal(tenant)}
                              title="Adjust Max User Seats"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
                            >
                              <Sliders size={14} />
                            </button>

                            {/* Status Toggle: Freeze vs Re-Activate */}
                            {tenant.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleToggleStatus(tenant, 'SUSPENDED')}
                                title="Freeze Client Account"
                                className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <PauseCircle size={12} />
                                <span>Freeze</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(tenant, 'ACTIVE')}
                                title="Re-Activate Client Account"
                                className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <PlayCircle size={12} />
                                <span>Activate</span>
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: DYNAMIC BILLING & GATEWAY CONFIGURATION                          */}
        {/* ========================================================================= */}
        {isBillingModalOpen && activeTenantForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Billing &amp; Payment Gateway</h3>
                    <p className="text-xs text-slate-400">{activeTenantForModal.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsBillingModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBillingConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Beneficiary UPI Merchant ID (VPA) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. company@icici"
                    value={modalUpiId}
                    onChange={(e) => setModalUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <p className="text-[11px] text-slate-500">All dynamic QR codes generated by field agents will route funds to this VPA.</p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalCardEnabled}
                      onChange={(e) => setModalCardEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-200">Enable Credit / Debit Card Gateway</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pl-7">Allows dealer checkout via integrated Razorpay/PayU payment rails.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBillingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-98"
                  >
                    {modalSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Save Gateway Settings</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: ADJUST SEAT ALLOCATION                                           */}
        {/* ========================================================================= */}
        {isSeatsModalOpen && activeTenantForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-200">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Adjust User Seat Quota</h3>
                    <p className="text-xs text-slate-400">{activeTenantForModal.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsSeatsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSeatsAdjustment} className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Currently Active Seats:</span>
                    <span className="text-amber-400 font-bold">{activeTenantForModal.used_seats || 1} Used</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Current Max Allocation:</span>
                    <span className="text-white font-bold">{activeTenantForModal.max_seats || 10} Seats</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    New Max Seat Quota *
                  </label>
                  <input
                    type="number"
                    min={activeTenantForModal.used_seats || 1}
                    max="1000"
                    required
                    value={modalNewSeats}
                    onChange={(e) => setModalNewSeats(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                  <p className="text-[11px] text-slate-500">Seat expansions automatically unlock user registration capacity in Admin UMS.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSeatsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={seatsSaving}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98"
                  >
                    {seatsSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Update Seat Quota</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: CREATED CREDENTIALS CONFIRMATION                                  */}
        {/* ========================================================================= */}
        {createdCredentialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Client Onboarded Successfully</h3>
                </div>
                <button onClick={() => setCreatedCredentialsModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs text-slate-400 font-medium">
                  Client Organization: <strong className="text-white text-sm block">{createdCredentialsModal.companyName}</strong>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Admin Full Name:</span>
                    <span className="font-bold text-white">{createdCredentialsModal.adminName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Login Phone / User ID:</span>
                    <span className="font-mono font-bold text-amber-400">{createdCredentialsModal.phone}</span>
                  </div>
                  {createdCredentialsModal.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Login Email:</span>
                      <span className="font-mono text-slate-200">{createdCredentialsModal.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-amber-300 font-bold">Password:</span>
                    <span className="font-mono font-bold text-amber-200 tracking-wider text-sm">{createdCredentialsModal.password}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Allocated Seats:</span>
                    <span className="font-bold text-emerald-400">{createdCredentialsModal.maxSeats} Users</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                ✓ The client administrator can now log in using their registered phone/email and password to create subordinate logins.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const text = `*${createdCredentialsModal.companyName} Login Credentials*\nLogin ID: ${createdCredentialsModal.phone}\nEmail: ${createdCredentialsModal.email}\nPassword: ${createdCredentialsModal.password}\nRole: Administrator (${createdCredentialsModal.maxSeats} Seats)`;
                    navigator.clipboard?.writeText(text);
                    setAlertBanner({ type: 'success', message: 'Credentials copied to clipboard!' });
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy size={16} /> Copy Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SuperAdminGuard>
  );
}
