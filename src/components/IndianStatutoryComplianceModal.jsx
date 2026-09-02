import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Scale, Lock, Eye, AlertCircle, 
  CheckCircle2, X, Download, HelpCircle, Building2, Smartphone, 
  ExternalLink, ChevronRight, UserCheck
} from 'lucide-react';

export default function IndianStatutoryComplianceModal({ isOpen, onClose, user }) {
  const [activeTab, setActiveTab] = useState('dpdp'); // 'dpdp' | 'itact' | 'npci' | 'labor' | 'grievance'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Statutory & Legal Compliance Hub
                </h3>
                <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  India Law Compliant
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sundaram Mahadeo Group • DPDP Act 2023, IT Act 2000, NPCI & Labour Guidelines
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto gap-2 py-2.5">
          <button
            onClick={() => setActiveTab('dpdp')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'dpdp'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Lock size={14} />
            <span>DPDP Act 2023 (Privacy)</span>
          </button>

          <button
            onClick={() => setActiveTab('npci')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'npci'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <ShieldCheck size={14} />
            <span>NPCI UPI & Payments</span>
          </button>

          <button
            onClick={() => setActiveTab('itact')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'itact'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <FileText size={14} />
            <span>IT Act 2000 & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('labor')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'labor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Smartphone size={14} />
            <span>Field GPS & Labour Law</span>
          </button>

          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'grievance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <UserCheck size={14} />
            <span>Grievance Officer</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: DPDP ACT 2023 */}
          {activeTab === 'dpdp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h4>Digital Personal Data Protection Act (DPDP Act), 2023 Notice</h4>
                </div>
                <p className="text-xs text-blue-800">
                  This enterprise application processes personal information strictly for legitimate commercial field operations, attendance logging, and dealer visit verification for the Sundaram Mahadeo Group entities.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  1. Purpose Specification & Data Minimization (Section 4 & 6)
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li><strong>Location Data (GPS):</strong> Collected strictly during active shift hours (between Shift Start and Shift Close) to calculate official travel distance (KM) and verify dealer visit attendance. No tracking occurs after shift closure.</li>
                  <li><strong>Camera & Media:</strong> Used solely to capture physical odometer readings and shopfront visit proof.</li>
                  <li><strong>Dealer Information:</strong> GSTIN, phone numbers, and location coordinates are stored purely for business-to-business order recording and ledger transparency.</li>
                </ul>

                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mt-4">
                  2. Rights of Data Principals (Field Staff & Dealers)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">Right to Access (Sec 11)</span>
                    <span>Every executive can view their full shift history, captured kilometers, and visit logs anytime.</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">Right to Correction (Sec 12)</span>
                    <span>Field executives may request correction of erroneous odometer numbers or visit notes via Admin UMS.</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">Right to Grievance Redressal</span>
                    <span>Direct statutory access to the Data Protection Grievance Officer within 48 hours.</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">Data Storage in India</span>
                    <span>All records, logs, and database snapshots are housed in Indian cloud infrastructure.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NPCI UPI GUIDELINES */}
          {activeTab === 'npci' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm mb-1">
                  <ShieldCheck size={18} className="text-emerald-700" />
                  <h4>NPCI UPI Procedural Guidelines & RBI Digital Payment Mandate</h4>
                </div>
                <p className="text-xs text-emerald-800">
                  Compliant with National Payments Corporation of India (NPCI) UPI Merchant Specifications and Reserve Bank of India (RBI) circulars on digital collection security.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <p><strong>1. Dynamic VPA Encryption & Deep-Linking:</strong> All generated QR codes generate authentic <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">upi://pay</code> intents populated exclusively with verified merchant firm names (e.g. Sundaram Mahadeo Group entities) and exact invoice totals.</p>
                <p><strong>2. Admin-Only VPA Mutation:</strong> To eliminate unauthorized redirection, fraud, or diversion of dealer receipts, beneficiary VPAs (UPI IDs) can only be set or modified by authorized Administrators with secure credential verification.</p>
                <p><strong>3. Transaction Ledgering:</strong> Every digital collection requires recording the bank-provided UTR (Unique Transaction Reference) / UPI Ref Number for real-time GST and financial reconciliation.</p>
              </div>
            </div>
          )}

          {/* TAB 3: IT ACT 2000 & AUDIT */}
          {activeTab === 'itact' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm mb-1">
                  <Scale size={18} className="text-amber-800" />
                  <h4>Information Technology Act, 2000 (Section 43A & Reasonable Security Practices)</h4>
                </div>
                <p className="text-xs text-amber-900">
                  Sundaram Mahadeo Group maintains Reasonable Security Practices and Procedures (RSPP) under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block">End-to-End Session Signing:</span>
                  <span>All API traffic uses JSON Web Tokens (JWT) signed with 256-bit cryptographically secure keys. Sessions are audited and time-stamped.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block">Tamper-Evident Geofencing:</span>
                  <span>Visit confirmations log exact GPS latitude, longitude, reverse-geocoded landmarks, and device timestamps to prevent fraudulent invoice logging.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LABOUR LAW & GPS TRACKING POLICY */}
          {activeTab === 'labor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-950 font-bold text-sm mb-1">
                  <Smartphone size={18} className="text-purple-800" />
                  <h4>Indian Labour Law & Transparent Shift Monitoring Policy</h4>
                </div>
                <p className="text-xs text-purple-900">
                  Governed under Indian employment principles ensuring worker dignity, consent-based shift tracking, and fair travel reimbursement.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <p><strong>1. Explicit Shift Bounds:</strong> Location tracking only activates when the employee presses "Start Shift" with opening odometer confirmation. Tracking is instantly terminated when "Close Shift" is executed.</p>
                <p><strong>2. Fair Travel Allowance & Fooding:</strong> Kilometers logged are multiplied at the statutory enterprise rate (₹5.00/KM) alongside daily fooding allowance (₹250/day) as mandated in enterprise agreements.</p>
                <p><strong>3. Offline Protection:</strong> Field staff working in non-network zones (Jharkhand rural dealers) are protected via local IndexedDB buffering, preventing loss of attendance records or allowance payouts.</p>
              </div>
            </div>
          )}

          {/* TAB 5: GRIEVANCE REDRESSAL OFFICER */}
          {activeTab === 'grievance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-amber-400">
                  <UserCheck size={18} />
                  <h4>Designated Grievance & Data Protection Officer</h4>
                </div>
                <p className="text-xs text-slate-300">
                  In compliance with Rule 5(9) of the IT Rules 2011 and Section 8(10) of the DPDP Act 2023:
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Officer Name</span>
                    <span className="font-bold text-slate-900 text-sm">Grievance Redressal Officer</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Enterprise Entity</span>
                    <span className="font-bold text-slate-900">Sundaram Mahadeo Group (SMST, SMBNC, SMGH, PSS, SMM)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                    <span className="font-bold text-blue-600 font-mono">info@sundarammahadeogroup.com</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Jurisdiction & Address</span>
                    <span className="font-bold text-slate-900">Ranchi, Jharkhand, India (834001)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Complaints or data modification requests received will be acknowledged within 24 hours and addressed within 15 working days.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
            <Building2 size={13} />
            <span>Sundaram Mahadeo Group • Legal & Statutory Affairs</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}
