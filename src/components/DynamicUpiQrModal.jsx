import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  IndianRupee, QrCode, Copy, Check, ExternalLink, ShieldCheck, 
  RefreshCw, Building2, Smartphone, Download, X, AlertCircle, ArrowRight,
  Lock, KeyRound, ShieldAlert
} from 'lucide-react';
import { buildDynamicUpiUri } from '../lib/offlineSyncEngine';

export default function DynamicUpiQrModal({
  user,
  isOpen,
  onClose,
  firmName = 'Sundaram Mahadeo Group',
  firmUpiId = '',
  amount = '',
  invoiceNote = '',
  onPaymentConfirmed
}) {
  // Determine if active session user has Administrator authorization
  const isAdmin = Boolean(
    user?.role === 'ADMIN' || 
    user?.role === 'admin' ||
    user?.userId === 'usr-admin-01' || 
    user?.id === 'admin-001' ||
    (() => {
      try {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored)?.role === 'ADMIN' : false;
      } catch (e) {
        return false;
      }
    })()
  );

  const [activeUpiId, setActiveUpiId] = useState(firmUpiId || 'sundarammahadeo@icici');
  const [customAmount, setCustomAmount] = useState(amount ? amount.toString() : '');
  const [customNote, setCustomNote] = useState(invoiceNote || '');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [vpaCopied, setVpaCopied] = useState(false);
  const [enteredTxnRef, setEnteredTxnRef] = useState(() => `UPI-UTR-${Date.now().toString().slice(-6)}`);
  const [generating, setGenerating] = useState(false);
  const [adminOverrideMode, setAdminOverrideMode] = useState(false);

  useEffect(() => {
    if (firmUpiId) {
      setActiveUpiId(firmUpiId);
    } else {
      setActiveUpiId('sundarammahadeo@icici');
    }
  }, [firmUpiId, isOpen]);

  useEffect(() => {
    if (amount !== undefined && amount !== null && amount !== '') {
      setCustomAmount(amount.toString());
    }
  }, [amount]);

  useEffect(() => {
    if (isOpen) {
      generateQrCode();
    }
  }, [isOpen, activeUpiId, customAmount, customNote, firmName]);

  const upiDetails = buildDynamicUpiUri({
    upiId: activeUpiId || 'sundarammahadeo@icici',
    firmName: firmName || 'Sundaram Mahadeo Group',
    amount: customAmount,
    transactionNote: customNote || `Payment for ${firmName}`
  });

  const generateQrCode = async () => {
    setGenerating(true);
    try {
      const url = await QRCode.toDataURL(upiDetails.uri, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('[QR Code Generation Error]', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiDetails.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmAndFill = () => {
    if (onPaymentConfirmed) {
      onPaymentConfirmed({
        paymentMode: 'UPI',
        amount: parseFloat(customAmount) || 0,
        upiId: activeUpiId,
        txnId: enteredTxnRef.trim() || `UPI-UTR-${Date.now().toString().slice(-6)}`,
        note: customNote
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={12} />
                NPCI Dynamic BharatPe / UPI QR
              </span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Scan & Pay via UPI
            </h3>
            <p className="text-xs text-blue-200/90 truncate max-w-[280px]">
              {firmName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* AMOUNT BANNER */}
          <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Requested Invoice Amount</span>
              <p className="text-2xl font-black text-slate-900 font-mono flex items-center">
                <span className="text-lg mr-0.5">₹</span>
                {parseFloat(customAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Zero Surcharge
              </span>
            </div>
          </div>

          {/* DYNAMIC QR CODE DISPLAY */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <div className="relative p-2 bg-white rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center">
              {generating ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <RefreshCw size={28} className="animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Dynamic NPCI UPI QR" 
                  className="w-56 h-56 rounded-xl object-contain select-none"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs">
                  Error generating QR
                </div>
              )}
            </div>

            {/* ACCEPTED APPS LOGO PILLS */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1 text-[10px] text-slate-500 font-bold">
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-blue-700">Google Pay</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-indigo-700">PhonePe</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-cyan-700">Paytm</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-emerald-700">BHIM UPI</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-purple-700">Cred</span>
            </div>
          </div>

          {/* FIRM UPI ID & SECURITY LOCK */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] uppercase font-bold text-slate-700 flex items-center gap-1">
                  <span>Firm Beneficiary UPI ID (VPA)</span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                      <KeyRound size={10} />
                      Admin Access
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-0.5">
                      <Lock size={10} />
                      Admin Locked
                    </span>
                  )}
                </label>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAdminOverrideMode(!adminOverrideMode)}
                    className="text-[10px] text-blue-700 font-bold hover:underline"
                  >
                    {adminOverrideMode ? 'Lock VPA' : 'Edit as Admin'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={activeUpiId}
                    onChange={(e) => isAdmin && adminOverrideMode && setActiveUpiId(e.target.value)}
                    readOnly={!isAdmin || !adminOverrideMode}
                    disabled={!isAdmin && !adminOverrideMode}
                    placeholder="e.g. sundaramsteel@icici"
                    className={`w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                      isAdmin && adminOverrideMode
                        ? 'border-amber-400 bg-amber-50/50 text-slate-900 focus:ring-2 focus:ring-amber-500'
                        : 'border-slate-200 bg-slate-100/90 text-slate-800 cursor-not-allowed select-all'
                    }`}
                  />
                  <div className="absolute left-2.5 top-2.5 text-slate-400">
                    {isAdmin && adminOverrideMode ? (
                      <KeyRound size={14} className="text-amber-600" />
                    ) : (
                      <Lock size={14} className="text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Quick Copy VPA button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeUpiId);
                    setVpaCopied(true);
                    setTimeout(() => setVpaCopied(false), 2500);
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center gap-1 transition-all active:scale-95 text-[11px]"
                  title="Copy UPI ID"
                >
                  {vpaCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{vpaCopied ? 'Copied' : 'UPI ID'}</span>
                </button>

                {/* Copy Deep Link */}
                <button
                  type="button"
                  onClick={handleCopyUpiLink}
                  className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center gap-1 transition-all active:scale-95 text-[11px]"
                  title="Copy Full NPCI UPI Deep Link"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <ExternalLink size={14} />}
                  <span>{copied ? 'Copied' : 'Link'}</span>
                </button>
              </div>

              {/* SECURITY NOTICE BANNER */}
              <div className={`mt-2 p-2 rounded-xl text-[10px] flex items-start gap-1.5 ${
                isAdmin && adminOverrideMode
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border border-emerald-200/80 text-emerald-900'
              }`}>
                {isAdmin && adminOverrideMode ? (
                  <>
                    <KeyRound size={13} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Admin Override Active: </span>
                      You are editing the destination UPI ID. Any changes will immediately update the generated QR code.
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Admin Security Verified: </span>
                      This UPI ID is configured exclusively by Group Administrators. Field staff cannot modify the destination account.
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Adjust Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  UTR / Reference ID
                </label>
                <input
                  type="text"
                  value={enteredTxnRef}
                  onChange={(e) => setEnteredTxnRef(e.target.value)}
                  placeholder="e.g. UTR-491823"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition-all text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleConfirmAndFill}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-xs transition-all active:scale-95"
          >
            <Check size={16} />
            <span>Mark Received & Fill Form</span>
          </button>
        </div>
      </div>
    </div>
  );
}
