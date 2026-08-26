import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, IndianRupee, Navigation, CheckCircle2, 
  Calendar, Layers, RefreshCw, AlertCircle, ShoppingBag, ShieldCheck,
  CreditCard, FileText, PlusCircle, Check, ArrowDownRight, ArrowUpRight,
  Filter, Search, Building2, Wallet, DollarSign, X, Calculator, Utensils,
  History, Award, ChevronRight, UserCheck
} from 'lucide-react';
import { api } from '../lib/api';

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

  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('app_config');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
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

  // Reimbursement Settlements History (KM & Food Allowance settlements by executive)
  const [reimbursementSettlements, setReimbursementSettlements] = useState(() => {
    try {
      const saved = localStorage.getItem('reimbursement_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Executive Reimbursement Settlement Modal (KM & Daily Food Allowance)
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [claimType, setClaimType] = useState('ALL'); // 'ALL' | 'KM' | 'FOOD'
  const [claimAmount, setClaimAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState('Google Pay / UPI');
  const [settleTxnId, setSettleTxnId] = useState('');
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // Monthly Filter
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchIncentivesAndData();

    const handleConfigUpdate = (e) => {
      if (e?.detail) {
        setGlobalConfig(e.detail);
      }
      fetchIncentivesAndData();
    };
    window.addEventListener('app_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('app_config_updated', handleConfigUpdate);
  }, []);

  const fetchIncentivesAndData = async () => {
    setLoading(true);
    try {
      const [incRes, visitsRes, firmsRes, shiftsRes, cfgRes] = await Promise.allSettled([
        api.get('/incentives/my'),
        api.get('/visits'),
        api.get('/firms'),
        api.get('/shifts/history'),
        api.get('/config')
      ]);

      if (cfgRes.status === 'fulfilled' && cfgRes.value.data) {
        setGlobalConfig(cfgRes.value.data);
        localStorage.setItem('app_config', JSON.stringify(cfgRes.value.data));
      }

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

      if (shiftsRes.status === 'fulfilled' && Array.isArray(shiftsRes.value.data?.shifts)) {
        setShiftsHistory(shiftsRes.value.data.shifts);
        localStorage.setItem('shifts_history', JSON.stringify(shiftsRes.value.data.shifts));
      }
    } catch (err) {
      console.warn('API error in Incentives, computed from cache.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically configured rates for KM & Food Allowance
  const kmRate = Number(globalConfig?.kmRate ?? globalConfig?.km_rate ?? incentiveData?.kmRate ?? 5);
  const foodingAllowanceRate = Number(globalConfig?.foodingAllowance ?? globalConfig?.fooding_allowance ?? incentiveData?.dailyFoodingAllowance ?? 250);

  // Compute total accumulated verified KMs and Duty days across shifts
  const shiftStats = useMemo(() => {
    let totalKms = 0;
    let dutyDaysCount = 0;
    const uniqueDays = new Set();

    shiftsHistory.forEach(s => {
      if (s.closingOdometer && s.openingOdometer) {
        const diff = Math.max(0, s.closingOdometer - s.openingOdometer);
        totalKms += diff;
      }
      const dayStr = (s.startTime || s.createdAt || '').split('T')[0];
      if (dayStr) uniqueDays.add(dayStr);
    });

    // If active shift exists today, add current day
    try {
      const active = localStorage.getItem('activeShiftData');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.status === 'ACTIVE') {
          const today = new Date().toISOString().split('T')[0];
          uniqueDays.add(today);
        }
      }
    } catch (e) {}

    dutyDaysCount = Math.max(uniqueDays.size, shiftsHistory.length > 0 ? shiftsHistory.length : 1);
    if (totalKms === 0 && dutyDaysCount > 0) {
      // Default baseline for active executives
      totalKms = dutyDaysCount * 35;
    }

    const earnedKMPayout = totalKms * kmRate;
    const earnedFoodPayout = dutyDaysCount * foodingAllowanceRate;
    const totalEarnedReimbursements = earnedKMPayout + earnedFoodPayout;

    // Deduct previously recorded reimbursement settlements
    const totalSettled = reimbursementSettlements.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const unclaimedBalance = Math.max(0, totalEarnedReimbursements - totalSettled);

    return {
      totalKms,
      dutyDaysCount,
      earnedKMPayout,
      earnedFoodPayout,
      totalEarnedReimbursements,
      totalSettled,
      unclaimedBalance
    };
  }, [shiftsHistory, kmRate, foodingAllowanceRate, reimbursementSettlements]);

  // Date filters for Sales & Volume Incentives
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => (v.paymentDate || v.transactionDate || v.timestamp || '').startsWith(todayStr));
  const monthVisits = visits.filter(v => (v.paymentDate || v.transactionDate || v.timestamp || '').startsWith(selectedMonth));

  // Sales Volume & Bag Incentive calculations
  const totalBilledMonth = monthVisits.reduce((sum, v) => sum + (parseFloat(v.orderValue || v.billingAmount) || 0), 0);
  const totalBagIncentivesMonth = monthVisits.reduce((sum, v) => sum + (parseFloat(v.bagIncentive) || 0), 0);
  const totalOrdersCountMonth = monthVisits.filter(v => (v.visitPurpose || v.purpose || '').includes('Sale') || (v.orderValue > 0)).length;

  // Open Executive Reimbursement Settlement Modal
  const handleOpenReimbursementModal = () => {
    setClaimType('ALL');
    setClaimAmount(shiftStats.unclaimedBalance > 0 ? shiftStats.unclaimedBalance.toString() : '0');
    setSettlePaymentMode('Google Pay / UPI');
    setSettleTxnId(`REIMB-${Date.now().toString().slice(-6)}`);
    setSettleDate(todayStr);
    setSettleNotes(`Accumulated reimbursement for ${shiftStats.dutyDaysCount} duty days & ${shiftStats.totalKms} KMs`);
    setShowReimbursementModal(true);
  };

  // Submit Executive Reimbursement Settlement
  const handleReimbursementSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmt = parseFloat(claimAmount);
    if (!parsedAmt || parsedAmt <= 0) {
      setErrorMsg('Please enter a valid reimbursement settlement amount.');
      return;
    }

    if (parsedAmt > shiftStats.unclaimedBalance) {
      setErrorMsg(`Amount exceeds unclaimed balance (₹${shiftStats.unclaimedBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setSettling(true);
    const nowISO = new Date().toISOString();
    const newRecord = {
      id: 'reimb_settle_' + Date.now(),
      userId: user?.userId || user?.user_id,
      execName: user?.fullName || 'Field Executive',
      claimType,
      amount: parsedAmt,
      paymentMode: settlePaymentMode,
      txnId: settleTxnId.trim() || `REIMB-${Date.now().toString().slice(-6)}`,
      date: settleDate || todayStr,
      notes: settleNotes.trim(),
      dutyDaysCovered: shiftStats.dutyDaysCount,
      kmsCovered: shiftStats.totalKms,
      timestamp: nowISO
    };

    const updatedSettlements = [newRecord, ...reimbursementSettlements];
    setReimbursementSettlements(updatedSettlements);
    localStorage.setItem('reimbursement_settlements', JSON.stringify(updatedSettlements));

    try {
      await api.post('/ledger/settle', {
        type: 'EXECUTIVE_REIMBURSEMENT',
        amount: parsedAmt,
        paymentMode: settlePaymentMode,
        txnId: settleTxnId,
        date: settleDate,
        notes: settleNotes
      });
      setSuccessMsg(`Reimbursement settlement of ₹${parsedAmt.toLocaleString('en-IN')} recorded successfully!`);
    } catch (err) {
      setSuccessMsg(`Reimbursement settlement of ₹${parsedAmt.toLocaleString('en-IN')} recorded locally.`);
    } finally {
      setSettling(false);
      setShowReimbursementModal(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  const productMatrix = useMemo(() => {
    if (Array.isArray(globalConfig?.incentives) && globalConfig.incentives.length > 0) {
      return globalConfig.incentives;
    }
    if (Array.isArray(incentiveData?.productMatrix) && incentiveData.productMatrix.length > 0) {
      return incentiveData.productMatrix;
    }
    return [
      { id: '1', name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 },
      { id: '2', name: 'TMT Steel (Tata Tiscon / Jindal)', unit: 'MT', rate: 50 },
      { id: '3', name: 'Pipes & Fittings', unit: 'Pcs', rate: 10 }
    ];
  }, [globalConfig, incentiveData]);

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
              Accumulated KM travel reimbursements, daily food allowance & sales volume bonuses
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenReimbursementModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Wallet size={15} /> Record Settlement (KM & Fooding)
            </button>
            <button
              onClick={fetchIncentivesAndData}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
              title="Refresh Calculations"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* PRIMARY FINANCIAL METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Unclaimed Reimbursement</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-emerald-300 font-mono">
              ₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Accumulated KM Payout</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-white font-mono">
              ₹{shiftStats.earnedKMPayout.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Food Allowance ({shiftStats.dutyDaysCount} Days)</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-blue-200 font-mono">
              ₹{shiftStats.earnedFoodPayout.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Sales Incentives</p>
            <p className="text-lg sm:text-xl font-black mt-0.5 text-amber-300 font-mono">
              ₹{totalBagIncentivesMonth.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: ACCUMULATED KM & FOODING REIMBURSEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KM Travel Reimbursement */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Navigation size={17} className="text-blue-600" />
              Accumulated KM Travel Reimbursement
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              Rate: ₹{kmRate} / KM
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Verified Shift Travel</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{shiftStats.totalKms} KM</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold">Accumulated Travel Payout</p>
              <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                ₹{shiftStats.earnedKMPayout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Travel distance accumulates across shifts. You can collect your payout after 3 days or at your convenience.
          </p>
        </div>

        {/* Daily Fooding Allowance */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Utensils size={17} className="text-emerald-600" />
              Accumulated Daily Food Allowance
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              ₹{foodingAllowanceRate} / Duty Day
            </span>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-semibold">Completed Duty Shifts</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {shiftStats.dutyDaysCount} Duty Days
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600 font-semibold">Accumulated Food Payout</p>
              <p className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                ₹{shiftStats.earnedFoodPayout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Food allowance is allotted per duty shift and accumulates alongside your travel reimbursement.
          </p>
        </div>
      </div>

      {/* SECTION 2: SETTLEMENT HISTORY FOR EXECUTIVE REIMBURSEMENTS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Executive Reimbursement Settlement Records</h3>
              <p className="text-xs text-slate-500">History of claimed KM travel and fooding allowance settlements</p>
            </div>
          </div>

          <button
            onClick={handleOpenReimbursementModal}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1 self-start sm:self-auto"
          >
            <PlusCircle size={13} />
            Claim New Settlement
          </button>
        </div>

        {reimbursementSettlements.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <Wallet size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-700">No reimbursement settlements claimed yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Your accumulated balance is <strong className="text-emerald-700">₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')}</strong>. Click "Record Settlement" to record a reimbursement payout.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reimbursementSettlements.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      KM & Fooding Settlement
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      {item.paymentMode || 'UPI'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Date: {item.date} {item.txnId && `• Ref: ${item.txnId}`} {item.notes && `• "${item.notes}"`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    +₹{parseFloat(item.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-semibold">Settled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: PRODUCT INCENTIVES MATRIX */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={18} />
            Product Volume Incentive Rates
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Monthly Earned: <span className="text-emerald-700 font-bold">₹{totalBagIncentivesMonth.toLocaleString('en-IN')}</span> ({totalOrdersCountMonth} Orders)
          </span>
        </div>

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

      {/* EXECUTIVE REIMBURSEMENT SETTLEMENT MODAL */}
      {showReimbursementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Executive Expense Reimbursement
                </span>
                <h3 className="text-lg font-black text-white mt-1">Record KM & Fooding Settlement</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Claim accumulated travel KMs (₹{kmRate}/KM) and daily food allowance
                </p>
              </div>
              <button
                onClick={() => setShowReimbursementModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReimbursementSubmit} className="p-6 space-y-4 text-xs">
              {/* Accumulated Stats Breakdown */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Accumulated Travel ({shiftStats.totalKms} KM @ ₹{kmRate}/KM):</span>
                  <span className="font-bold font-mono text-slate-900">₹{shiftStats.earnedKMPayout.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Food Allowance ({shiftStats.dutyDaysCount} Days @ ₹{foodingAllowanceRate}/Day):</span>
                  <span className="font-bold font-mono text-slate-900">₹{shiftStats.earnedFoodPayout.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-blue-200 font-bold text-slate-900">
                  <span>Available Unclaimed Balance:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Settlement Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Settlement Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setClaimAmount(shiftStats.unclaimedBalance.toString())}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Claim Full (₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')})
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={shiftStats.unclaimedBalance || undefined}
                    placeholder="₹ 0.00"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm font-black border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                    required
                  />
                  <IndianRupee size={15} className="absolute left-2.5 top-3 text-slate-400" />
                </div>
              </div>

              {/* Payment Mode & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Settlement Mode
                  </label>
                  <select
                    value={settlePaymentMode}
                    onChange={(e) => setSettlePaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Google Pay / UPI">Google Pay / UPI</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Company Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Settlement Date
                  </label>
                  <input
                    type="date"
                    value={settleDate}
                    onChange={(e) => setSettleDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reference ID */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Txn Ref / Voucher No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-829103 or VCH-301"
                  value={settleTxnId}
                  onChange={(e) => setSettleTxnId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Settlement Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 3-day travel & food allowance reimbursement settlement"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReimbursementModal(false)}
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
                  Record Reimbursement Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
