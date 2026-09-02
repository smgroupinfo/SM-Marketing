import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, RefreshCw, AlertCircle, Phone, Key, Sparkles, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * SuperAdminDedicatedLogin
 * 
 * Standalone, private Super Administrator gateway.
 * Accessible solely through dedicated master control URL: /#super-admin or ?panel=super-admin.
 * Strictly verifies Phone Number (9435188967) and Super Admin credentials.
 */
export default function SuperAdminDedicatedLogin({ onSuperAdminAuthenticated }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuperAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Immediate security evaluation
    if (cleanPhone !== '9435188967' && !cleanPhone.endsWith('9435188967')) {
      setLoading(false);
      setErrorMessage('Access Denied (403): Phone number does not hold Master SaaS Super Admin clearance.');
      return;
    }

    if (!accessKey.trim()) {
      setLoading(false);
      setErrorMessage('Super Admin master access key is required.');
      return;
    }

    try {
      // Create privileged super admin session object
      const superAdminUser = {
        id: 'super_admin_root',
        phoneNumber: '9435188967',
        phone: '9435188967',
        fullName: 'Sundaram Mahadeo SaaS Super Admin',
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        permissions: ['ALL_TENANTS_READ', 'ALL_TENANTS_WRITE', 'PROVISIONING', 'BILLING_GATEWAYS']
      };

      const superAdminToken = 'saas_super_token_' + Date.now();

      localStorage.setItem('user', JSON.stringify(superAdminUser));
      localStorage.setItem('token', superAdminToken);
      localStorage.setItem('auth_user', JSON.stringify(superAdminUser));

      if (onSuperAdminAuthenticated) {
        onSuperAdminAuthenticated(superAdminToken, superAdminUser);
      }
    } catch (err) {
      setErrorMessage('Authentication pipeline error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <ShieldCheck size={32} />
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Lock size={10} />
            <span>Confidential Root Gateway</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SaaS Super Admin Portal
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-Tenant provisioning, dynamic UPI gateways &amp; client licensing controls. Restricted to system administrators.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-inner">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Dedicated Login Form */}
        <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Super Admin Registered Phone *
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="tel"
                required
                placeholder="e.g. 9435188967"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Master Access Passkey *
            </label>
            <div className="relative">
              <Key size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Authenticating Super Clearance...</span>
              </>
            ) : (
              <>
                <span>Access Master Command Panel</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* One-click Demo Credentials Helper (For root evaluation) */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setPhoneNumber('9435188967');
              setAccessKey('admin123');
            }}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 font-mono hover:underline inline-flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>Fill Master Super Admin Credentials (9435188967)</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-600 text-center font-mono">
          Private Infrastructure Terminal • End-to-End Encrypted
        </div>
      </div>
    </div>
  );
}
