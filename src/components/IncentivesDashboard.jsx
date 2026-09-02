import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, IndianRupee, Navigation, CheckCircle2, 
  Calendar, Layers, RefreshCw, AlertCircle, ShoppingBag, ShieldCheck,
  CreditCard, FileText, PlusCircle, Check, ArrowDownRight, ArrowUpRight,
  Filter, Search, Building2, Wallet, DollarSign, X, Calculator, Utensils,
  History, Award, ChevronRight, UserCheck, User, MapPin, Phone, Car
} from 'lucide-react';
import { api } from '../lib/api';

export default function IncentivesDashboard({ user }) {
  // 1. STATE & PERSISTENCE
  const [visits, setVisits] = useState(() => {
    try {
      const saved = localStorage.getItem('user_visits');
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

  const [shiftsHistory, setShiftsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('shifts_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [reimbursementSettlements, setReimbursementSettlements] = useState(() => {
    try {
      const saved = localStorage.getItem('reimbursement_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [executivesList, setExecutivesList] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState(() => {
    return user?.userId || user?.user_id || user?.id || '';
  });

  // Active view tab inside dashboard: 'summary' | 'shifts_trail' | 'product_breakdown' | 'settlement_history'
  const [activeTab, setActiveTab] = useState('summary');

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
  }, [selectedExecutiveId]);

  const fetchIncentivesAndData = async () => {
    setLoading(true);
    try {
      const promises = [
        api.get('/visits'),
        api.get('/shifts/history'),
        api.get('/config')
      ];

      if (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE_ASSISTANT') {
        promises.push(api.get('/users'));
      }

      const results = await Promise.allSettled(promises);
      const visitsRes = results[0];
      const shiftsRes = results[1];
      const cfgRes = results[2];
      const usersRes = results[3];

      if (cfgRes?.status === 'fulfilled' && cfgRes.value.data) {
        setGlobalConfig(cfgRes.value.data);
        localStorage.setItem('app_config', JSON.stringify(cfgRes.value.data));
      }

      if (visitsRes?.status === 'fulfilled' && Array.isArray(visitsRes.value.data?.visits)) {
        setVisits(visitsRes.value.data.visits);
        localStorage.setItem('user_visits', JSON.stringify(visitsRes.value.data.visits));
      }

      if (shiftsRes?.status === 'fulfilled' && Array.isArray(shiftsRes.value.data?.shifts)) {
        setShiftsHistory(shiftsRes.value.data.shifts);
        localStorage.setItem('shifts_history', JSON.stringify(shiftsRes.value.data.shifts));
      }

      if (usersRes?.status === 'fulfilled' && Array.isArray(usersRes.value.data?.users)) {
        const activeUsers = usersRes.value.data.users.filter(u => u.role !== 'ADMIN');
        setExecutivesList(activeUsers);
      }
    } catch (err) {
      console.warn('API error in Incentives, loaded cached state.');
    } finally {
      setLoading(false);
    }
  };

  // Determine active profile details
  const activeUserId = selectedExecutiveId || user?.userId || user?.user_id || user?.id;
  const activeExecutiveObj = useMemo(() => {
    if (activeUserId === (user?.userId || user?.user_id || user?.id)) {
      return user;
    }
    const found = executivesList.find(u => (u.user_id === activeUserId || u.id === activeUserId || u.userId === activeUserId));
    return found || user;
  }, [activeUserId, user, executivesList]);

  // Dynamically configured rates for KM & Food Allowance
  const kmRate = Number(globalConfig?.kmRate ?? globalConfig?.km_rate ?? 5);
  const foodingAllowanceRate = Number(globalConfig?.foodingAllowance ?? globalConfig?.fooding_allowance ?? 250);

  // Dynamic product incentives matrix from system configuration
  const productMatrix = useMemo(() => {
    if (Array.isArray(globalConfig?.incentives) && globalConfig.incentives.length > 0) {
      return globalConfig.incentives;
    }
    return [
      { id: '1', name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 },
      { id: '2', name: 'TMT Steel (Tata Tiscon / Jindal)', unit: 'MT', rate: 50 },
      { id: '3', name: 'Pipes & Fittings', unit: 'Pcs', rate: 10 },
      { id: '4', name: 'Sand & Aggregates', unit: 'CFT', rate: 2 },
      { id: '5', name: 'Bricks & Blocks', unit: 'Pcs', rate: 1 }
    ];
  }, [globalConfig]);

  // Filter shifts strictly for the selected user profile
  const userShifts = useMemo(() => {
    return shiftsHistory.filter(s => s.userId === activeUserId || s.user_id === activeUserId);
  }, [shiftsHistory, activeUserId]);

  // Filter visits strictly for the selected user profile
  const userVisits = useMemo(() => {
    return visits.filter(v => v.userId === activeUserId || v.user_id === activeUserId || v.exec_id === activeUserId);
  }, [visits, activeUserId]);

  // Filter settlements strictly for the selected user profile
  const userSettlements = useMemo(() => {
    return reimbursementSettlements.filter(r => r.userId === activeUserId || r.user_id === activeUserId || !r.userId);
  }, [reimbursementSettlements, activeUserId]);

  // Compute verified KMs, duty days, and financial ledger strictly from authentic user shift logs
  const shiftStats = useMemo(() => {
    let totalKms = 0;
    const uniqueDays = new Set();

    userShifts.forEach(s => {
      let shiftKm = 0;
      if (s.closingOdometer !== undefined && s.closingOdometer !== null && s.openingOdometer !== undefined && s.openingOdometer !== null) {
        shiftKm = Math.max(0, parseFloat(s.closingOdometer) - parseFloat(s.openingOdometer));
      } else if (s.totalKms || s.total_kms) {
        shiftKm = parseFloat(s.totalKms || s.total_kms || 0);
      }
      totalKms += shiftKm;

      const dayStr = (s.startTime || s.start_time || s.createdAt || '').split('T')[0];
      if (dayStr) uniqueDays.add(dayStr);
    });

    // Check if user has an active shift today
    try {
      const active = localStorage.getItem('activeShiftData');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed.status === 'ACTIVE' && (parsed.userId === activeUserId || parsed.user_id === activeUserId)) {
          const today = new Date().toISOString().split('T')[0];
          uniqueDays.add(today);
        }
      }
    } catch (e) {}

    const dutyDaysCount = uniqueDays.size;
    const earnedKMPayout = totalKms * kmRate;
    const earnedFoodPayout = dutyDaysCount * foodingAllowanceRate;
    const totalEarnedReimbursements = earnedKMPayout + earnedFoodPayout;

    // Deduct previously recorded reimbursement settlements for this user
    const totalSettled = userSettlements.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const unclaimedBalance = Math.max(0, totalEarnedReimbursements - totalSettled);

    return {
      totalKms: parseFloat(totalKms.toFixed(1)),
      dutyDaysCount,
      earnedKMPayout,
      earnedFoodPayout,
      totalEarnedReimbursements,
      totalSettled,
      unclaimedBalance
    };
  }, [userShifts, kmRate, foodingAllowanceRate, userSettlements, activeUserId]);

  // Month-filtered visits for this user
  const monthVisits = useMemo(() => {
    return userVisits.filter(v => (v.paymentDate || v.transactionDate || v.timestamp || '').startsWith(selectedMonth));
  }, [userVisits, selectedMonth]);

  // Product Incentive breakdown for this user in selected month
  const productBreakdown = useMemo(() => {
    const result = [];
    let totalIncentiveSum = 0;

    productMatrix.forEach(prod => {
      const matchingVisits = monthVisits.filter(v => {
        const pName = (v.product || v.productDiscussed || '').toLowerCase();
        return pName.includes(prod.name.toLowerCase().split(' ')[0]);
      });

      const totalUnits = matchingVisits.reduce((sum, v) => sum + (parseFloat(v.quantity) || 0), 0);
      const bagIncentives = matchingVisits.reduce((sum, v) => sum + (parseFloat(v.bagIncentive) || 0), 0);
      const calculatedIncentive = bagIncentives > 0 ? bagIncentives : (totalUnits * prod.rate);

      totalIncentiveSum += calculatedIncentive;
      result.push({
        id: prod.id,
        name: prod.name,
        unit: prod.unit,
        rate: prod.rate,
        unitsSold: totalUnits,
        earnedIncentive: calculatedIncentive,
        visitsCount: matchingVisits.length
      });
    });

    return { items: result, totalIncentiveSum };
  }, [productMatrix, monthVisits]);

  const totalBilledMonth = useMemo(() => {
    return monthVisits.reduce((sum, v) => sum + (parseFloat(v.orderValue || v.billingAmount) || 0), 0);
  }, [monthVisits]);

  const totalCollectedMonth = useMemo(() => {
    return monthVisits.reduce((sum, v) => sum + (parseFloat(v.collectedAmount) || 0), 0);
  }, [monthVisits]);

  const totalOrdersCountMonth = useMemo(() => {
    return monthVisits.filter(v => (v.purpose || '').toLowerCase().includes('sale') || (parseFloat(v.orderValue) > 0)).length;
  }, [monthVisits]);

  // Open Executive Reimbursement Settlement Modal
  const handleOpenReimbursementModal = () => {
    setClaimType('ALL');
    setClaimAmount(shiftStats.unclaimedBalance > 0 ? shiftStats.unclaimedBalance.toString() : '0');
    setSettlePaymentMode('Google Pay / UPI');
    const execTag = (activeExecutiveObj?.fullName || 'EXEC').split(' ')[0].toUpperCase();
    setSettleTxnId(`REIMB-${execTag}-${Date.now().toString().slice(-4)}`);
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleNotes(`Travel (${shiftStats.totalKms} KM) & Fooding (${shiftStats.dutyDaysCount} duty days) settlement for ${activeExecutiveObj?.fullName || 'Field Executive'}`);
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
      setErrorMsg(`Amount exceeds available unclaimed balance (₹${shiftStats.unclaimedBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setSettling(true);
    const nowISO = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord = {
      id: 'reimb_settle_' + Date.now(),
      userId: activeUserId,
      execName: activeExecutiveObj?.fullName || activeExecutiveObj?.full_name || 'Field Executive',
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
        userId: activeUserId,
        execName: activeExecutiveObj?.fullName,
        amount: parsedAmt,
        paymentMode: settlePaymentMode,
        txnId: settleTxnId,
        date: settleDate,
        notes: settleNotes
      });
      setSuccessMsg(`Reimbursement settlement of ₹${parsedAmt.toLocaleString('en-IN')} recorded successfully for ${activeExecutiveObj?.fullName || 'executive'}!`);
    } catch (err) {
      setSuccessMsg(`Reimbursement settlement of ₹${parsedAmt.toLocaleString('en-IN')} recorded in local ledger.`);
    } finally {
      setSettling(false);
      setShowReimbursementModal(false);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

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

      {/* EXECUTIVE PROFILE HEADER & ACCOUNT SELECTOR */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 px-3 py-1 rounded-full text-blue-200 border border-blue-400/20 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-blue-400" />
                Verified Executive Account Ledger
              </span>
              <span className="text-[11px] font-mono bg-white/10 px-2.5 py-0.5 rounded-full text-slate-300">
                ID: {activeUserId}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              {activeExecutiveObj?.fullName || activeExecutiveObj?.full_name || 'Field Executive'}
            </h2>

            <div className="flex items-center gap-4 text-xs text-blue-200/90 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-blue-400" />
                {activeExecutiveObj?.phoneNumber || activeExecutiveObj?.phone || '9435188967'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-blue-400" />
                {activeExecutiveObj?.currentAddress || activeExecutiveObj?.territory || 'Jharkhand Territory'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                {activeExecutiveObj?.role || 'EXECUTIVE'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
            {/* ADMIN EXECUTIVE SWITCHER */}
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE_ASSISTANT') && executivesList.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] uppercase font-bold text-blue-300 mb-1">Switch Executive Account</label>
                <select
                  value={selectedExecutiveId}
                  onChange={(e) => setSelectedExecutiveId(e.target.value)}
                  className="w-full sm:w-56 bg-slate-800/90 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-blue-400/30 focus:ring-2 focus:ring-blue-400"
                >
                  <option value={user?.userId || user?.user_id || user?.id}>My Account ({user?.fullName || 'Admin'})</option>
                  {executivesList.map(exec => (
                    <option key={exec.user_id || exec.id} value={exec.user_id || exec.id}>
                      {exec.fullName || exec.full_name} ({exec.phone_number || exec.phoneNumber || 'Executive'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={handleOpenReimbursementModal}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Wallet size={15} /> Settle Payout
              </button>
              <button
                onClick={fetchIncentivesAndData}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                title="Refresh Ledger"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY FINANCIAL KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Unclaimed Reimbursement</p>
            <p className="text-lg sm:text-2xl font-black mt-0.5 text-emerald-300 font-mono">
              ₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-emerald-200/80 mt-0.5 block">Ready for settlement</span>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Travel Travel Payout</p>
            <p className="text-lg sm:text-2xl font-black mt-0.5 text-white font-mono">
              ₹{shiftStats.earnedKMPayout.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-blue-200/80 mt-0.5 block">{shiftStats.totalKms} KM Verified</span>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Food Allowance</p>
            <p className="text-lg sm:text-2xl font-black mt-0.5 text-blue-200 font-mono">
              ₹{shiftStats.earnedFoodPayout.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-blue-200/80 mt-0.5 block">{shiftStats.dutyDaysCount} Duty Days</span>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <p className="text-[10px] uppercase font-bold text-blue-200">Monthly Product Bonus</p>
            <p className="text-lg sm:text-2xl font-black mt-0.5 text-amber-300 font-mono">
              ₹{productBreakdown.totalIncentiveSum.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-amber-200/80 mt-0.5 block">{totalOrdersCountMonth} Orders Billed</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD SUB-NAVIGATION TABS */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp size={15} />
          <span>Earnings & Allowance Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts_trail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'shifts_trail'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Navigation size={15} />
          <span>Shift & KM Travel Trail ({userShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('product_breakdown')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'product_breakdown'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShoppingBag size={15} />
          <span>Product Volume Rates ({productMatrix.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settlement_history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'settlement_history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History size={15} />
          <span>Disbursement Records ({userSettlements.length})</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY & ALLOWANCES */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KM Travel Reimbursement */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Navigation size={17} className="text-blue-600" />
                  Verified KM Travel Reimbursement
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
                Calculated strictly from odometer readings submitted at shift start and close for <strong>{activeExecutiveObj?.fullName || 'this executive'}</strong>.
              </p>
            </div>

            {/* Daily Fooding Allowance */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Utensils size={17} className="text-emerald-600" />
                  Daily Duty Food Allowance
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  ₹{foodingAllowanceRate} / Duty Day
                </span>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-semibold">Verified Duty Days</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {shiftStats.dutyDaysCount} Days
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
                Standard daily food allowance is credited for each distinct verified duty shift completed on ground.
              </p>
            </div>
          </div>

          {/* MONTHLY PERFORMANCE & VOLUME INCENTIVES CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-indigo-600" />
                  Monthly Product Volume & Sales Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance metrics for {activeExecutiveObj?.fullName || 'Executive'} during {selectedMonth}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">Total Monthly Sales Billed</p>
                <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">₹{totalBilledMonth.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-slate-500 mt-1 block">{totalOrdersCountMonth} Orders Logged</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold">Payment Collections Cleared</p>
                <p className="text-xl font-black text-blue-700 mt-0.5 font-mono">₹{totalCollectedMonth.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-slate-500 mt-1 block">{monthVisits.length} Total Visits Logged</span>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-800 font-semibold">Product Volume Incentives</p>
                <p className="text-xl font-black text-amber-900 mt-0.5 font-mono">₹{productBreakdown.totalIncentiveSum.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-amber-700 mt-1 block">Calculated from dynamic rate matrix</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFTS & TRAVEL AUDIT TRAIL */}
      {activeTab === 'shifts_trail' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Navigation size={18} className="text-blue-600" />
                Shift & KM Travel Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Logged shift records for {activeExecutiveObj?.fullName || 'Executive'} ({userShifts.length} Shifts Recorded)
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Total Travel: {shiftStats.totalKms} KM (₹{shiftStats.earnedKMPayout.toLocaleString('en-IN')})
            </span>
          </div>

          {userShifts.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <Car size={24} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No shifts recorded yet for this executive profile.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Shifts started and closed in the Shift Dashboard will automatically record odometer readings, travel KMs, and fooding allowances here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Start Odo</th>
                    <th className="py-3 px-3">Close Odo</th>
                    <th className="py-3 px-3">Net Travel</th>
                    <th className="py-3 px-3">Travel Payout (₹{kmRate}/KM)</th>
                    <th className="py-3 px-3">Food Allowance</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userShifts.map((s, idx) => {
                    const oStart = parseFloat(s.openingOdometer || s.opening_odometer || 0);
                    const oEnd = s.closingOdometer !== undefined && s.closingOdometer !== null ? parseFloat(s.closingOdometer) : (s.closing_odometer ? parseFloat(s.closing_odometer) : null);
                    const netKms = oEnd !== null ? Math.max(0, oEnd - oStart) : parseFloat(s.totalKms || s.total_kms || 0);
                    const sDate = (s.startTime || s.start_time || s.createdAt || '').replace('T', ' ').substring(0, 16);

                    return (
                      <tr key={s.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {sDate || 'Today'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{oStart} KM</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{oEnd !== null ? `${oEnd} KM` : 'Active / Pending'}</td>
                        <td className="py-3 px-3 font-bold font-mono text-blue-700">{netKms.toFixed(1)} KM</td>
                        <td className="py-3 px-3 font-bold font-mono text-emerald-700">₹{(netKms * kmRate).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 font-bold font-mono text-slate-700">₹{foodingAllowanceRate}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'ACTIVE' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCT INCENTIVES MATRIX */}
      {activeTab === 'product_breakdown' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="text-blue-600" size={18} />
                Dynamic Product Incentive Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Rate configured per unit with breakdown of units sold by {activeExecutiveObj?.fullName || 'Executive'} in {selectedMonth}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Total Earned: ₹{productBreakdown.totalIncentiveSum.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productBreakdown.items.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold">Unit: {item.unit}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-100/60 px-2 py-0.5 rounded-lg">
                    ₹{item.rate} / {item.unit}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500">Volume Sold</p>
                    <p className="font-bold text-slate-800">{item.unitsSold} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">Incentive Earned</p>
                    <p className="font-black text-emerald-700 font-mono">₹{item.earnedIncentive.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REIMBURSEMENT SETTLEMENT / DISBURSEMENT HISTORY */}
      {activeTab === 'settlement_history' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Executive Reimbursement Disbursement History</h3>
                <p className="text-xs text-slate-500">History of claimed KM travel and fooding allowance settlements for this profile</p>
              </div>
            </div>

            <button
              onClick={handleOpenReimbursementModal}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <PlusCircle size={13} />
              Settle New Payout
            </button>
          </div>

          {userSettlements.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <Wallet size={24} className="mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No reimbursement settlements claimed yet for this account.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Current available unclaimed balance is <strong className="text-emerald-700">₹{shiftStats.unclaimedBalance.toLocaleString('en-IN')}</strong>. Click "Settle Payout" to record a reimbursement disbursement.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userSettlements.map((item) => (
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
                      {item.execName && (
                        <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.execName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Date: {item.date} {item.txnId && `• Ref: ${item.txnId}`} {item.notes && `• "${item.notes}"`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold">Disbursed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXECUTIVE REIMBURSEMENT SETTLEMENT MODAL */}
      {showReimbursementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Reimbursement Settlement
                </span>
                <h3 className="text-lg font-black text-white mt-1">Record KM & Fooding Disbursement</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Executive: <strong>{activeExecutiveObj?.fullName || activeExecutiveObj?.full_name}</strong> (ID: {activeUserId})
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
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
