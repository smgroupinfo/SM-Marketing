import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, IndianRupee, Navigation, CheckCircle2, 
  Calendar, Layers, RefreshCw, AlertCircle, ShoppingBag, ShieldCheck,
  CreditCard, FileText, PlusCircle, Check, ArrowDownRight, ArrowUpRight,
  Filter, Search, Building2, Wallet, DollarSign, X, Calculator
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default function IncentivesDashboard({ user }) {
  // 1. LOCAL STORAGE STATE FALLBACKS
  const [visits, setVisits] = useState(() => {
    try {
      const saved = localStorage.getItem('user_visits');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [firmsList, setFirmsList] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarded_firms');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [incentiveData, setIncentiveData] = useState(() => {
    try {
      const saved = localStorage.getItem('user_incentives');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [shiftsHistory, setShiftsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('shifts_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settlement Form Modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settleFirmName, setSettleFirmName] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState('Google Pay / UPI');
  const [settleTxnId, setSettleTxnId] = useState('');
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // Monthly Report Selector
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [ledgerSearch, setLedgerSearch] = useState('');

  useEffect(() => {
    fetchIncentivesAndData();
  }, []);

  const fetchIncentivesAndData = async () => {
    setLoading(true);
    try {
      const [incRes, visitsRes, firmsRes] = await Promise.allSettled([
        api.get('/incentives/my'),
        api.get('/visits'),
        api.get('/firms')
      ]);

      if (incRes.status === 'fulfilled' && incRes.value.data?.summary) {
        setIncentiveData(incRes.value.data.summary);
        localStorage.setItem('user_incentives', JSON.stringify(incRes.value.data.summary));
      }

      if (visitsRes.status === 'fulfilled' && Array.isArray(visitsRes.value.data?.visits)) {
        setVisits(visitsRes.value.data.visits);
        localStorage.setItem('user_visits', JSON.stringify(visitsRes.value.data.visits));
      }

      if (firmsRes.status === 'fulfilled' && Array.isArray(firmsRes.value.data?.firms)) {
        setFirmsList(firmsRes.value.data.firms);
        localStorage.setItem('onboarded_firms', JSON.stringify(firmsRes.value.data.firms));
      }
    } catch (err) {
      console.warn('API error in Incentives, computed from cache.');
    } finally {
      setLoading(false);
    }
  };

  // Travel Reimbursement Calculations
  const kmRate = incentiveData?.kmRate || 5;
  const foodingAllowanceRate = incentiveData?.dailyFoodingAllowance || 250;

  // Total KMs from shift records or cached
  const totalKMsTravelled = shiftsHistory.reduce((sum, s) => {
    if (s.closingOdometer && s.openingOdometer) {
      return sum + Math.max(0, s.closingOdometer - s.openingOdometer);
    }
    return sum;
  }, 0);
  const totalKMReimbursement = totalKMsTravelled * kmRate;

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => (v.paymentDate || v.timestamp || '').startsWith(todayStr));
  const monthVisits = visits.filter(v => (v.paymentDate || v.timestamp || '').startsWith(selectedMonth));

  // Payment Receipts totals
  const totalCollectedToday = todayVisits.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const totalCollectedMonth = monthVisits.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const totalBilledMonth = monthVisits.reduce((sum, v) => sum + (v.orderValue || 0), 0);
  const totalBagIncentivesMonth = monthVisits.reduce((sum, v) => sum + (v.bagIncentive || 0), 0);

  // Payment Instrument Breakdown for Selected Month (or all)
  const instrumentBreakdown = {
    'Google Pay / UPI': 0,
    'Cash': 0,
    'Cheque': 0,
    'Fleet Cards': 0,
    'Smart Cards': 0,
    'NEFT / NetBanking': 0,
    'Other Modes': 0
  };

  monthVisits.forEach(v => {
    const amt = v.collectedAmount || 0;
    if (amt <= 0) return;
    const mode = (v.paymentMode || '').toLowerCase();
    if (mode.includes('google') || mode.includes('upi') || mode.includes('gpay')) {
      instrumentBreakdown['Google Pay / UPI'] += amt;
    } else if (mode.includes('cash')) {
      instrumentBreakdown['Cash'] += amt;
    } else if (mode.includes('cheque') || mode.includes('check')) {
      instrumentBreakdown['Cheque'] += amt;
    } else if (mode.includes('fleet')) {
      instrumentBreakdown['Fleet Cards'] += amt;
    } else if (mode.includes('smart')) {
      instrumentBreakdown['Smart Cards'] += amt;
    } else if (mode.includes('neft') || mode.includes('net') || mode.includes('bank')) {
      instrumentBreakdown['NEFT / NetBanking'] += amt;
    } else {
      instrumentBreakdown['Other Modes'] += amt;
    }
  });

  // Firm-Wise Ledger Calculation
  const firmLedgerMap = {};
  
  // Seed with firmsList first
  firmsList.forEach(f => {
    firmLedgerMap[f.name] = {
      firmId: f.id,
      firmName: f.name,
      gstin: f.gstin || 'URP',
      address: f.address || 'Market Location',
      billedAmount: 0,
      totalCollected: 0
    };
  });

  // Calculate totals from all visits
  visits.forEach(v => {
    const name = v.firmName || 'Unknown Firm';
    if (!firmLedgerMap[name]) {
      firmLedgerMap[name] = {
        firmId: 'f_' + Math.random().toString(36).substr(2, 6),
        firmName: name,
        gstin: 'URP',
        address: 'Market Area',
        billedAmount: 0,
        totalCollected: 0
      };
    }
    firmLedgerMap[name].billedAmount += (v.orderValue || 0);
    firmLedgerMap[name].totalCollected += (v.collectedAmount || 0);
  });

  const firmLedgerList = Object.values(firmLedgerMap).map(f => ({
    ...f,
    netBalanceDue: Math.max(0, f.billedAmount - f.totalCollected)
  }));

  const filteredFirmLedger = firmLedgerList.filter(f => {
    if (!ledgerSearch.trim()) return true;
    const q = ledgerSearch.toLowerCase();
    return f.firmName.toLowerCase().includes(q) || f.gstin.toLowerCase().includes(q);
  });

  // Open Settlement Modal with prefilled firm
  const handleOpenSettlement = (firm) => {
    if (firm) {
      setSettleFirmName(firm.firmName);
      setSettleAmount(firm.netBalanceDue > 0 ? firm.netBalanceDue.toString() : '');
    } else {
      setSettleFirmName('');
      setSettleAmount('');
    }
    setSettlePaymentMode('Google Pay / UPI');
    setSettleTxnId(`SETTLE-${Date.now().toString().slice(-6)}`);
    setSettleDate(todayStr);
    setSettleNotes('');
    setShowSettlementModal(true);
  };

  // Submit Settlement Entry
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!settleFirmName.trim() || !settleAmount || parseFloat(settleAmount) <= 0) {
      setErrorMsg('Please select a firm and enter a valid positive settlement amount.');
      return;
    }

    setSettling(true);

    const parsedAmt = parseFloat(settleAmount);
    const nowISO = new Date().toISOString();
    const settlementReceipt = {
      id: 'settle_' + Date.now(),
      userId: user?.userId || user?.user_id,
      exec_id: user?.userId || user?.user_id,
      firmName: settleFirmName.trim(),
      purpose: 'Payment Settlement',
      product: 'Balance Due Settlement',
      quantity: 0,
      unit: 'N/A',
      bagIncentive: 0,
      orderValue: 0,
      collectedAmount: parsedAmt,
      paymentMode: settlePaymentMode,
      txnId: settleTxnId.trim() || `STL-${Date.now().toString().slice(-6)}`,
      paymentDate: settleDate || todayStr,
      notes: settleNotes.trim() || 'Direct ledger clearance settlement against dues.',
      location: { lat: 23.3441, lng: 85.3096 },
      status: 'VERIFIED',
      timestamp: nowISO,
      createdAt: nowISO
    };

    // Update local state & localStorage immediately
    const updatedVisits = [settlementReceipt, ...visits];
    setVisits(updatedVisits);
    localStorage.setItem('user_visits', JSON.stringify(updatedVisits));

    try {
      await api.post('/payments/settle', {
        firmName: settleFirmName.trim(),
        amount: parsedAmt,
        paymentMode: settlePaymentMode,
        txnId: settleTxnId.trim(),
        paymentDate: settleDate,
        notes: settleNotes.trim()
      });
      setSuccessMsg(`₹${parsedAmt.toLocaleString('en-IN')} payment settlement recorded for ${settleFirmName.trim()}!`);
    } catch (err) {
      setSuccessMsg(`Payment settlement of ₹${parsedAmt.toLocaleString('en-IN')} recorded locally.`);
    } finally {
      setSettling(false);
      setShowSettlementModal(false);
      fetchIncentivesAndData();
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  const productMatrix = incentiveData?.productMatrix || [
    { id: '1', name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 },
    { id: '2', name: 'TMT Steel (Tata / Jindal)', unit: 'MT', rate: 50 },
    { id: '3', name: 'Pipes & Fittings (Astral / Supreme)', unit: 'Pcs', rate: 10 }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-blue-200 border border-white/10">
              Payments & Incentives (P & I) Dashboard
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 text-white">{user?.fullName || 'Field Executive'}</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Live financial ledger, payment receipts tracking & statutory reimbursements
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenSettlement(null)}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <PlusCircle size={15} /> Record Settlement
            </button>
            <button
              onClick={fetchIncentivesAndData}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="Refresh P&I Calculations"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* PRIMARY FINANCIAL METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Receipts Today</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-emerald-300">
              ₹{totalCollectedToday.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Receipts This Month</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-white">
              ₹{totalCollectedMonth.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Monthly Billing Issued</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-blue-200">
              ₹{totalBilledMonth.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Product Incentives</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-amber-300">
              ₹{totalBagIncentivesMonth.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: KM & FOODING REIMBURSEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KM Travel Reimbursement */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Navigation size={17} className="text-blue-600" />
              KM Travel Reimbursement
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              Rate: ₹{kmRate} / KM
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Verified Shift Distance</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalKMsTravelled} KM</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold">Travel Payout</p>
              <p className="text-xl font-black text-emerald-700 mt-0.5">
                ₹{totalKMReimbursement.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Calculated automatically from shift start/close verified odometer readings.
          </p>
        </div>

        {/* Daily Fooding Allowance */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-600" />
              Daily Fooding Allowance Entitlement
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              ₹{foodingAllowanceRate} / Duty Day
            </span>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Active Shift Status</p>
              <p className="text-sm font-black text-emerald-800 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Eligible & Active
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600 font-semibold">Allowance Rate</p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">
                ₹{foodingAllowanceRate}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Credited automatically into executive ledger upon end-of-day shift settlement.
          </p>
        </div>
      </div>

      {/* SECTION 2: PAYMENT RECEIPTS & INSTRUMENT BREAKDOWN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Receipts Ledger Tracker</h3>
              <p className="text-xs text-slate-500">Collected funds categorized by payment instrument</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* INSTRUMENT TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(instrumentBreakdown).map(([mode, amt]) => (
            <div key={mode} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={mode}>
                {mode}
              </p>
              <p className="text-sm font-black text-slate-900 font-mono">
                ₹{amt.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: FIRM-WISE PAYMENT DUE & RECEIVED LEDGER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              <span>Firm-Wise Payment Due & Received Ledger</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                {filteredFirmLedger.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Live tracking of Billed Amount, Total Collected, and Net Balance Due per firm
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search firm in ledger..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Firm / Client Name</th>
                <th className="py-3 px-4">Billed Amount (₹)</th>
                <th className="py-3 px-4">Total Collected (₹)</th>
                <th className="py-3 px-4">Net Balance Due (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFirmLedger.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No firm ledger records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredFirmLedger.map((firm) => (
                  <tr key={firm.firmId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{firm.firmName}</p>
                      <span className="text-[10px] font-mono text-slate-400">{firm.gstin}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{firm.billedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{firm.totalCollected.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-black">
                      <span className={firm.netBalanceDue > 0 ? 'text-rose-600 font-mono text-sm' : 'text-slate-400'}>
                        ₹{firm.netBalanceDue.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {firm.netBalanceDue === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check size={10} /> Fully Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Dues
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenSettlement(firm)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors border border-blue-200"
                      >
                        Settle Dues
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: MONTHLY PAYMENT LEDGER REPORT */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Monthly Payment Ledger Report
            </h3>
            <p className="text-xs text-slate-500">Summary of billing issued vs payments collected for {selectedMonth}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-600">Collection Efficiency: </span>
            <span className="text-sm font-black text-emerald-700">
              {totalBilledMonth > 0 ? `${Math.min(100, Math.round((totalCollectedMonth / totalBilledMonth) * 100))}%` : '100%'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Month Invoices</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">₹{totalBilledMonth.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Month Receipts</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">₹{totalCollectedMonth.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Uncollected Balance</p>
            <p className="text-lg font-black text-rose-600 mt-0.5">
              ₹{Math.max(0, totalBilledMonth - totalCollectedMonth).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Transactional Receipts Stream for Selected Month */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Monthly Transactions & Receipts Stream ({monthVisits.length} Records)
          </p>
          {monthVisits.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No transactions recorded for this month.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {monthVisits.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 text-xs transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{v.firmName}</p>
                    <p className="text-[10px] text-slate-500">
                      {(v.paymentDate || v.timestamp || '').split('T')[0]} &bull; Mode: {v.paymentMode || 'Cash'} {v.txnId ? `(${v.txnId})` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">₹{(v.collectedAmount || 0).toLocaleString('en-IN')}</p>
                    {v.orderValue > 0 && (
                      <p className="text-[10px] text-slate-400">Order: ₹{v.orderValue.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: PRODUCT INCENTIVES MATRIX */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" size={18} />
          Product Volume Incentive Rates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {productMatrix.map((item) => (
            <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{item.name}</p>
                <span className="text-[10px] text-slate-500 font-semibold">Unit: {item.unit}</span>
              </div>
              <p className="text-sm font-black text-emerald-700">₹{item.rate} / {item.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SETTLEMENT ENTRY MODAL */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Payment Collection Entry
                </span>
                <h3 className="text-lg font-black text-white mt-1">Record Settlement Against Due</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update firm payment ledger balance down to zero upon receipt
                </p>
              </div>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSettlementSubmit} className="p-6 space-y-4 text-xs">
              {/* Firm Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Firm / Client Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={settleFirmName}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSettleFirmName(chosen);
                    const firmObj = firmLedgerList.find(f => f.firmName === chosen);
                    if (firmObj && firmObj.netBalanceDue > 0) {
                      setSettleAmount(firmObj.netBalanceDue.toString());
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Onboarded Firm --</option>
                  {firmLedgerList.map((f) => (
                    <option key={f.firmId} value={f.firmName}>
                      {f.firmName} (Due: ₹{f.netBalanceDue.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Settlement Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="₹ 0.00"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={settlePaymentMode}
                    onChange={(e) => setSettlePaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Google Pay / UPI">Google Pay / UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Fleet Cards">Fleet Cards</option>
                    <option value="Smart Cards">Smart Cards</option>
                    <option value="NEFT / NetBanking">NEFT / NetBanking</option>
                  </select>
                </div>
              </div>

              {/* Date & Reference ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Txn ID / UTR / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-9982104"
                    value={settleTxnId}
                    onChange={(e) => setSettleTxnId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Settlement Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Full invoice clearance paid via Google Pay QR"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettlementModal(false)}
                  className="w-1/3 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {settling ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Record & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
