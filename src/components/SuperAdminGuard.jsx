import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, Phone, UserCheck, AlertTriangle } from 'lucide-react';

/**
 * SuperAdminGuard
 * 
 * Production-ready route and view wrapper for SaaS Super Administrator functionality.
 * Access is restricted to users with phone number "9435188967" or role "SUPER_ADMIN".
 * Unauthorized requests render a clean, high-contrast 403 Forbidden interface.
 */
export default function SuperAdminGuard({ user, children, onBack }) {
  // Normalize user identification data from props or session storage
  const activeUser = user || (() => {
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const rawPhone = String(activeUser?.phone_number || activeUser?.phone || '').replace(/\D/g, '');
  const userRole = String(activeUser?.role || '').toUpperCase();

  // Super Admin validation rule
  const isSuperAdminPhone = rawPhone.endsWith('9435188967') || rawPhone === '9435188967';
  const isSuperAdminRole = userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN';
  const isAuthorized = isSuperAdminPhone || isSuperAdminRole;

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 text-white rounded-3xl border border-slate-800 shadow-2xl my-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
            <ShieldAlert size={40} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
              <Lock size={12} />
              <span>403 Forbidden Access</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Super Admin Privilege Required
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This SaaS Command Panel contains multi-tenant provisioning and billing controls. Access is strictly restricted to verified Super Administrator credentials.
            </p>
          </div>

          {/* User Session Info */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-left text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Current Identity:</span>
              <span className="text-slate-200 font-bold">{activeUser?.full_name || activeUser?.name || 'Unauthenticated'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phone Identifier:</span>
              <span className="text-slate-200 font-bold">{rawPhone || 'Not Provided'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Assigned Role:</span>
              <span className="text-amber-400 font-bold">{userRole || 'FIELD_EXECUTIVE'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm"
              >
                <ArrowLeft size={15} />
                <span>Return to Dashboard</span>
              </button>
            )}
            <a
              href="mailto:info@sundarammahadeogroup.com"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
            >
              <UserCheck size={15} />
              <span>Contact System Admin</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
