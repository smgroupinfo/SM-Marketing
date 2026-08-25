import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, Calendar, Users, TrendingUp, 
  IndianRupee, CheckCircle, RefreshCw, Layers, CreditCard, 
  Car, UserCheck, AlertCircle, Eye, FileSpreadsheet, Award,
  Clock, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Building2, Phone, MapPin, Search, Star, ShieldCheck, ChevronRight, User
} from 'lucide-react';
import { api } from '../lib/api';

// Safe number & currency formatting utilities
const formatINR = (val) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

const formatNum = (val) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

export default function AdminReports({ user, initialSubTab = 'overview' }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeSubPage, setActiveSubPage] = useState(initialSubTab); // 'overview' | 'top_execs' | 'top_buyers' | 'timely_payments' | 'lowest_buyers' | 'slow_payments'
  
  const [rangePreset, setRangePreset] = useState('monthly'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(todayStr);
  const [executiveId, setExecutiveId] = useState('all');
  const [rankingSearch, setRankingSearch] = useState('');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubPage(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    fetchReport();
  }, [rangePreset, executiveId, startDate, endDate]);

  const handlePresetChange = (preset) => {
    setRangePreset(preset);
    const now = new Date();
    if (preset === 'daily') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'weekly') {
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(pastWeek);
      setEndDate(todayStr);
    } else if (preset === 'monthly') {
      const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(pastMonth);
      setEndDate(todayStr);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        range: rangePreset,
        startDate,
        endDate,
        executiveId,
        _t: Date.now()
      };
      const res = await api.get('/admin/reports', { params });
      if (res.data) {
        // Ensure complete defensive structure
        const d = res.data;
        setReportData({
          ...d,
          kpis: {
            totalSalesValue: d.kpis?.totalSalesValue || 0,
            totalVolumeUnits: d.kpis?.totalVolumeUnits || 0,
            totalCollections: d.kpis?.totalCollections || 0,
            totalKmTravelled: d.kpis?.totalKmTravelled || 0,
            netSettledAmount: d.kpis?.netSettledAmount || 0,
            totalVisitsCount: d.kpis?.totalVisitsCount || 0,
            verifiedCount: d.kpis?.verifiedCount || 0,
            rejectionRate: d.kpis?.rejectionRate || '0.0%'
          },
          salesSummary: {
            totalSalesValue: d.salesSummary?.totalSalesValue || 0,
            totalVolumeUnits: d.salesSummary?.totalVolumeUnits || 0,
            byProduct: Array.isArray(d.salesSummary?.byProduct) ? d.salesSummary.byProduct : []
          },
          collectionsSummary: {
            totalCollections: d.collectionsSummary?.totalCollections || 0,
            byMode: Array.isArray(d.collectionsSummary?.byMode) ? d.collectionsSummary.byMode : [],
            transactions: Array.isArray(d.collectionsSummary?.transactions) ? d.collectionsSummary.transactions : []
          },
          reimbursementsSummary: {
            kmRate: d.reimbursementsSummary?.kmRate || 5,
            totalKmTravelled: d.reimbursementsSummary?.totalKmTravelled || 0,
            totalKmPayout: d.reimbursementsSummary?.totalKmPayout || 0,
            totalFoodingAllowance: d.reimbursementsSummary?.totalFoodingAllowance || 0,
            totalMiscExpenses: d.reimbursementsSummary?.totalMiscExpenses || 0,
            netSettledAmount: d.reimbursementsSummary?.netSettledAmount || 0,
            byExecutive: Array.isArray(d.reimbursementsSummary?.byExecutive) ? d.reimbursementsSummary.byExecutive : []
          },
          visitPerformance: {
            rejectionRate: d.visitPerformance?.rejectionRate || '0.0%',
            byExecutive: Array.isArray(d.visitPerformance?.byExecutive) ? d.visitPerformance.byExecutive : []
          },
          topPerformersExecs: Array.isArray(d.topPerformersExecs) ? d.topPerformersExecs : [],
          top10PurchasingCompanies: Array.isArray(d.top10PurchasingCompanies) ? d.top10PurchasingCompanies : [],
          top10TimelyPaymentCompanies: Array.isArray(d.top10TimelyPaymentCompanies) ? d.top10TimelyPaymentCompanies : [],
          top10LowestPurchasingCompanies: Array.isArray(d.top10LowestPurchasingCompanies) ? d.top10LowestPurchasingCompanies : [],
          top10SlowPaymentCompanies: Array.isArray(d.top10SlowPaymentCompanies) ? d.top10SlowPaymentCompanies : [],
          rankingsSummary: d.rankingsSummary || {
            topBuyerGrossVolume: 0,
            totalOverdueInSlowAccounts: 0,
            avgGroupTurnaroundDays: '0.0'
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    setRangePreset('custom');
    fetchReport();
  };

  // Comprehensive CSV Export Engine
  const handleDownloadCSV = () => {
    if (!reportData) return;
    setExporting(true);

    try {
      const selectedExecName = executiveId === 'all' 
        ? 'All Executives' 
        : reportData.executives?.find(e => e.id === executiveId)?.name || executiveId;

      let csv = [];
      csv.push(`SUNDARAM MAHADEO GROUP - FINANCIAL AUDIT & RECONCILIATION REPORT`);
      csv.push(`Report Scope: ${rangePreset.toUpperCase()} (${startDate} to ${endDate})`);
      csv.push(`Executive Filter: ${selectedExecName}`);
      csv.push(`Active Sub-Page Export: ${activeSubPage.toUpperCase()}`);
      csv.push(`Generated At: ${new Date().toLocaleString()}`);
      csv.push(``);

      if (activeSubPage === 'overview' || activeSubPage === 'all') {
        // Section 1: KPI Overview
        csv.push(`=== 1. EXECUTIVE KPI SUMMARY ===`);
        csv.push(`Metric,Value`);
        csv.push(`Total Sales Value (INR),${reportData.kpis.totalSalesValue}`);
        csv.push(`Total Volume Units Sold,${reportData.kpis.totalVolumeUnits}`);
        csv.push(`Total Collections (INR),${reportData.kpis.totalCollections}`);
        csv.push(`Total Field Travel (KMs),${reportData.kpis.totalKmTravelled}`);
        csv.push(`Net Reimbursements Settled (INR),${reportData.kpis.netSettledAmount}`);
        csv.push(`Total Visits Logged,${reportData.kpis.totalVisitsCount}`);
        csv.push(`Verified Visits,${reportData.kpis.verifiedCount}`);
        csv.push(`Rejection Rate,${reportData.kpis.rejectionRate}`);
        csv.push(``);

        // Section 2: Sales & Volume Summary
        csv.push(`=== 2. SALES & VOLUME SUMMARY BY PRODUCT ===`);
        csv.push(`Product Name,Unit Type,Quantity Sold,Unit Price (INR),Total Sales Value (INR)`);
        (reportData.salesSummary?.byProduct || []).forEach(p => {
          csv.push(`"${p.productName}",${p.unit},${p.quantity},${p.unitPrice},${p.totalSalesValue}`);
        });
        csv.push(`TOTAL VOLUME,,${reportData.salesSummary?.totalVolumeUnits || 0},,${reportData.salesSummary?.totalSalesValue || 0}`);
        csv.push(``);

        // Section 3: Collections by Mode
        csv.push(`=== 3. COLLECTIONS SUMMARY BY PAYMENT INSTRUMENT ===`);
        csv.push(`Payment Mode,Transaction Count,Total Amount (INR),Percentage Share (%)`);
        (reportData.collectionsSummary?.byMode || []).forEach(m => {
          csv.push(`${m.mode},${m.count},${m.amount},${m.percentage}%`);
        });
        csv.push(`TOTAL COLLECTIONS,,${reportData.collectionsSummary?.totalCollections || 0},100%`);
        csv.push(``);

        // Section 4: Transactions Ledger
        csv.push(`=== 4. PAYMENT TRANSACTIONS LEDGER ===`);
        csv.push(`Transaction ID,Date/Time,Executive Name,Client / Firm Name,Payment Mode,Reference / UTR No,Amount (INR),Clearance Status`);
        (reportData.collectionsSummary?.transactions || []).forEach(tx => {
          csv.push(`"${tx.id}","${tx.dateTime}","${tx.execName}","${tx.clientName}",${tx.mode},"${tx.refNumber}",${tx.amount},"${tx.status}"`);
        });
        csv.push(``);

        // Section 5: Reimbursements & Claims
        csv.push(`=== 5. REIMBURSEMENTS & FIELD CLAIMS ===`);
        csv.push(`Executive Name,KM Travelled,Rate (INR/KM),KM Payout (INR),Fooding Allowance (INR),Misc Expenses (INR),Net Settled Total (INR),Settlement Status`);
        (reportData.reimbursementsSummary?.byExecutive || []).forEach(r => {
          csv.push(`"${r.execName}",${r.kms},${r.kmRate},${r.kmPayout},${r.foodingAllowance},${r.miscExpenses},${r.netSettled},"${r.status}"`);
        });
        csv.push(`GROUP TOTALS,${reportData.reimbursementsSummary?.totalKmTravelled || 0},,${reportData.reimbursementsSummary?.totalKmPayout || 0},${reportData.reimbursementsSummary?.totalFoodingAllowance || 0},${reportData.reimbursementsSummary?.totalMiscExpenses || 0},${reportData.reimbursementsSummary?.netSettledAmount || 0},`);
        csv.push(``);

        // Section 6: Visit Performance
        csv.push(`=== 6. VISIT PERFORMANCE & AUDIT STATUS ===`);
        csv.push(`Executive Name,Total Visits Logged,Verified Count,Rejected Count,Pending Verification,Rejection Rate`);
        (reportData.visitPerformance?.byExecutive || []).forEach(v => {
          csv.push(`"${v.execName}",${v.totalVisits},${v.verified},${v.rejected},${v.pending},${v.rejectionRate}`);
        });
        csv.push(``);
      }

      if (activeSubPage === 'top_execs' || activeSubPage === 'all') {
        csv.push(`=== TOP PERFORMERS IN EXECUTIVES ===`);
        csv.push(`Rank,Executive Name,Phone Number,Territory,Sales Value (INR),Volume Units,Collections (INR),Incentives (INR),Total KMs,Total Payout (INR),Visits Count,Performance Rating,Score`);
        (reportData.topPerformersExecs || []).forEach(e => {
          csv.push(`${e.rank},"${e.execName}","${e.phoneNumber}","${e.territory}",${e.salesValue},${e.volumeUnits},${e.collections},${e.incentives},${e.kms},${e.netReimbursement},${e.visitsCount},"${e.rating}",${e.score}`);
        });
        csv.push(``);
      }

      if (activeSubPage === 'top_buyers' || activeSubPage === 'all') {
        csv.push(`=== TOP 10 PURCHASING COMPANIES ===`);
        csv.push(`Rank,Firm Name,GSTIN,Contact Person,Phone,Total Purchased (INR),Total Units,Primary Brand,Orders Count,Total Paid (INR),Outstanding Dues (INR),Last Order Date,Account Tier`);
        (reportData.top10PurchasingCompanies || []).forEach(f => {
          csv.push(`${f.rank},"${f.firmName}","${f.gstin}","${f.contactPerson}","${f.phone}",${f.totalPurchased},${f.totalVolume},"${f.primaryProduct}",${f.orderCount},${f.totalPaid},${f.outstandingDues},"${f.lastOrderDate}","${f.tier}"`);
        });
        csv.push(``);
      }

      if (activeSubPage === 'timely_payments' || activeSubPage === 'all') {
        csv.push(`=== TOP 10 TIMELY PAYMENT COMPANIES (ORDER DATE vs PAYMENT DATE) ===`);
        csv.push(`Rank,Firm Name,GSTIN,Contact Person,Phone,Avg Days to Pay,Turnaround Category,On-Time Rate (%),Total Paid (INR),Total Purchased (INR),Outstanding Dues (INR),Payment Modes`);
        (reportData.top10TimelyPaymentCompanies || []).forEach(f => {
          csv.push(`${f.rank},"${f.firmName}","${f.gstin}","${f.contactPerson}","${f.phone}",${f.avgDaysToPay},"${f.turnaroundCategory}",${f.onTimeRatePercent}%,${f.totalPaid},${f.totalPurchased},${f.outstandingDues},"${f.paymentModes}"`);
        });
        csv.push(``);
      }

      if (activeSubPage === 'lowest_buyers' || activeSubPage === 'all') {
        csv.push(`=== TOP 10 LOWEST PURCHASING COMPANIES ===`);
        csv.push(`Rank,Firm Name,GSTIN,Contact Person,Phone,Total Purchased (INR),Total Units,Orders Count,Last Order Date,Days Inactive,Status,Recommended Action`);
        (reportData.top10LowestPurchasingCompanies || []).forEach(f => {
          csv.push(`${f.rank},"${f.firmName}","${f.gstin}","${f.contactPerson}","${f.phone}",${f.totalPurchased},${f.totalVolume},${f.orderCount},"${f.lastOrderDate}",${f.daysSinceLastOrder},"${f.status}","${f.recommendedAction}"`);
        });
        csv.push(``);
      }

      if (activeSubPage === 'slow_payments' || activeSubPage === 'all') {
        csv.push(`=== TOP 10 SLOW PAYMENT COMPANIES ===`);
        csv.push(`Rank,Firm Name,GSTIN,Contact Person,Phone,Avg Days to Pay,Outstanding Dues (INR),Total Purchased (INR),Total Paid (INR),Risk Level,Overdue Bracket,Recovery Action`);
        (reportData.top10SlowPaymentCompanies || []).forEach(f => {
          csv.push(`${f.rank},"${f.firmName}","${f.gstin}","${f.contactPerson}","${f.phone}",${f.avgDaysToPay},${f.outstandingDues},${f.totalPurchased},${f.totalPaid},"${f.riskLevel}","${f.overdueAgeBracket}","${f.recoveryAction}"`);
        });
        csv.push(``);
      }

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join("\n"));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", csvContent);
      downloadAnchor.setAttribute("download", `SMM_${activeSubPage.toUpperCase()}_Report_${rangePreset}_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error generating CSV export', err);
    } finally {
      setExporting(false);
    }
  };

  // Filter rankings lists based on search query
  const filterList = (list) => {
    if (!list || !Array.isArray(list)) return [];
    if (!rankingSearch.trim()) return list;
    const q = rankingSearch.toLowerCase();
    return list.filter(item => 
      (item.execName && item.execName.toLowerCase().includes(q)) ||
      (item.firmName && item.firmName.toLowerCase().includes(q)) ||
      (item.contactPerson && item.contactPerson.toLowerCase().includes(q)) ||
      (item.phone && String(item.phone).includes(q)) ||
      (item.gstin && item.gstin.toLowerCase().includes(q)) ||
      (item.primaryProduct && item.primaryProduct.toLowerCase().includes(q))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={24} /> Financial Audit & Performance Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Executive rankings, company order intelligence, payment turnaround audits, and overdue dues.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadCSV}
            disabled={!reportData || exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={16} /> {exporting ? 'Exporting...' : `Export ${activeSubPage === 'overview' ? 'Audit CSV' : 'Sub-Page CSV'}`}
          </button>
        </div>
      </div>

      {/* Sub-Pages Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setActiveSubPage('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Layers size={16} /> Audit Overview
          </button>

          <button
            onClick={() => setActiveSubPage('top_execs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'top_execs'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Award size={16} /> Top Performers (Execs)
            {reportData?.topPerformersExecs?.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubPage === 'top_execs' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'}`}>
                {reportData.topPerformersExecs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubPage('top_buyers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'top_buyers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={16} /> Top 10 Buyers
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubPage === 'top_buyers' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              Top 10
            </span>
          </button>

          <button
            onClick={() => setActiveSubPage('timely_payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'timely_payments'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Clock size={16} /> Timely Payment (Top 10)
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubPage === 'timely_payments' ? 'bg-teal-800 text-white' : 'bg-teal-100 text-teal-800'}`}>
              Order Turnaround
            </span>
          </button>

          <button
            onClick={() => setActiveSubPage('lowest_buyers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'lowest_buyers'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <ArrowDownRight size={16} /> Lowest Purchasing (Top 10)
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubPage === 'lowest_buyers' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
              Attention
            </span>
          </button>

          <button
            onClick={() => setActiveSubPage('slow_payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeSubPage === 'slow_payments'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <AlertTriangle size={16} /> Slow Payment (Top 10)
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubPage === 'slow_payments' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'}`}>
              Overdue Risk
            </span>
          </button>
        </div>
      </div>

      {/* Customizable Filters Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handlePresetChange('daily')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                rangePreset === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily (Today)
            </button>
            <button
              onClick={() => handlePresetChange('weekly')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                rangePreset === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly (7 Days)
            </button>
            <button
              onClick={() => handlePresetChange('monthly')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                rangePreset === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly (30 Days)
            </button>
            <button
              onClick={() => setRangePreset('custom')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                rangePreset === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Search bar inside rankings */}
          {activeSubPage !== 'overview' && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search firm, executive or phone..."
                value={rankingSearch}
                onChange={e => setRankingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}

          {/* Executive Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-700 uppercase">Executive:</span>
            <select
              value={executiveId}
              onChange={e => setExecutiveId(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Executives (Consolidated)</option>
              {reportData?.executives?.map(exec => (
                <option key={exec.id} value={exec.id}>{exec.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Inputs for Custom Filter */}
        <form onSubmit={handleApplyCustomFilter} className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Filter size={14} /> Apply Date Filter
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
          <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Compiling financial metrics and rankings...</p>
        </div>
      ) : !reportData ? (
        <div className="py-12 text-center text-red-500 bg-white rounded-2xl">
          Failed to load report data. Please retry.
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* SUB-PAGE 1: OVERVIEW & CONSOLIDATED FINANCIAL AUDIT */}
          {/* ============================================================== */}
          {activeSubPage === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Metrics Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Gross Sales Value</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    ₹{formatINR(reportData.kpis?.totalSalesValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {formatNum(reportData.kpis?.totalVolumeUnits)} units sold
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Payment Collections</span>
                  <p className="text-2xl font-black text-green-700 mt-2">
                    ₹{formatINR(reportData.kpis?.totalCollections)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {(reportData.collectionsSummary?.byMode || []).reduce((sum, m) => sum + (m.count || 0), 0)} transactions
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mileage & Payouts</span>
                  <p className="text-2xl font-black text-purple-700 mt-2">
                    ₹{formatINR(reportData.kpis?.netSettledAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {reportData.kpis?.totalKmTravelled || 0} km @ ₹{reportData.reimbursementsSummary?.kmRate || 5}/km
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Visits & Audit</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">
                    {formatNum(reportData.kpis?.totalVisitsCount)} <span className="text-sm font-semibold text-gray-500">Visits</span>
                  </p>
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    Rejection Rate: <span className="font-bold">{reportData.kpis?.rejectionRate || '0.0%'}</span>
                  </p>
                </div>
              </div>

              {/* Sub-Pages Quick Summary Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Intelligence Leaderboards</span>
                    <h3 className="text-lg font-black mt-1">Ranking & Turnaround Analysis Available</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Explore top-performing field executives, top 10 buyers, timing turnaround on orders, low volume accounts, and overdue receivables.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveSubPage('top_execs')}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Top Execs
                    </button>
                    <button
                      onClick={() => setActiveSubPage('top_buyers')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Top 10 Buyers
                    </button>
                    <button
                      onClick={() => setActiveSubPage('timely_payments')}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Timely Payers
                    </button>
                    <button
                      onClick={() => setActiveSubPage('slow_payments')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Slow Payers
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. SALES & VOLUME SUMMARY */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} /> 1. Sales & Volume Summary (By Product & Unit Type)
                  </h3>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                    Total: ₹{formatINR(reportData.salesSummary?.totalSalesValue)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Product Name</th>
                        <th className="p-4">Unit Type</th>
                        <th className="p-4 text-right">Quantity Sold</th>
                        <th className="p-4 text-right">Unit Price (₹)</th>
                        <th className="p-4 text-right">Total Sales Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {(reportData.salesSummary?.byProduct || []).map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{p.productName}</td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                              {p.unit}
                            </span>
                          </td>
                          <td className="p-4 text-right font-semibold text-gray-800">
                            {formatNum(p.quantity)}
                          </td>
                          <td className="p-4 text-right text-gray-600">
                            ₹{formatINR(p.unitPrice)}
                          </td>
                          <td className="p-4 text-right font-black text-green-700">
                            ₹{formatINR(p.totalSalesValue)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50/60 font-black text-gray-900 border-t-2 border-blue-200">
                        <td className="p-4">CONSOLIDATED VOLUME & BILLING</td>
                        <td className="p-4">-</td>
                        <td className="p-4 text-right text-blue-900">
                          {formatNum(reportData.salesSummary?.totalVolumeUnits)}
                        </td>
                        <td className="p-4 text-right">-</td>
                        <td className="p-4 text-right text-green-800 text-base">
                          ₹{formatINR(reportData.salesSummary?.totalSalesValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. COLLECTIONS SUMMARY */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="text-green-600" size={18} /> 2. Payment Collections Ledger (By Mode & Transaction IDs)
                  </h3>
                  <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                    Total Collections: ₹{formatINR(reportData.collectionsSummary?.totalCollections)}
                  </span>
                </div>

                {/* Mode Distribution Pills */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Grouped Payment Mode Breakdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {(reportData.collectionsSummary?.byMode || []).map(m => (
                      <div key={m.mode} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.mode === 'NEFT' ? 'bg-blue-100 text-blue-800' :
                          m.mode === 'UPI' ? 'bg-purple-100 text-purple-800' :
                          m.mode === 'Cash' ? 'bg-green-100 text-green-800' :
                          m.mode === 'Cheque' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {m.mode} ({m.count || 0})
                        </span>
                        <p className="font-black text-gray-900 mt-2 text-base">₹{formatINR(m.amount)}</p>
                        <p className="text-[11px] text-gray-500 font-medium">{m.percentage || '0'}% of total</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-3.5">Txn ID / Time</th>
                        <th className="p-3.5">Executive</th>
                        <th className="p-3.5">Client / Firm Name</th>
                        <th className="p-3.5">Mode</th>
                        <th className="p-3.5">Ref / Instrument</th>
                        <th className="p-3.5 text-right">Amount (₹)</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {(reportData.collectionsSummary?.transactions || []).map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="p-3.5">
                            <p className="font-bold text-gray-900">{tx.id}</p>
                            <p className="text-[10px] text-gray-400">{tx.dateTime}</p>
                          </td>
                          <td className="p-3.5 font-medium text-gray-800">{tx.execName}</td>
                          <td className="p-3.5 text-gray-700 font-semibold">{tx.clientName}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                              {tx.mode}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-gray-500">{tx.refNumber}</td>
                          <td className="p-3.5 text-right font-black text-blue-700">
                            ₹{formatINR(tx.amount)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'Settled' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. REIMBURSEMENTS & CLAIMS */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Car className="text-purple-600" size={18} /> 3. Reimbursements & Mileage Settlement (KM × Rate + Allowances)
                  </h3>
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
                    Rate: ₹{reportData.reimbursementsSummary?.kmRate || 5}/km • Fooding: ₹{(reportData.reimbursementsSummary?.totalFoodingAllowance || 0) > 0 ? 250 : 0}/day
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Executive Name</th>
                        <th className="p-4 text-right">KM Travelled</th>
                        <th className="p-4 text-right">KM Payout (₹)</th>
                        <th className="p-4 text-right">Fooding Claim (₹)</th>
                        <th className="p-4 text-right">Misc Claims (₹)</th>
                        <th className="p-4 text-right">Net Settled Total (₹)</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {(reportData.reimbursementsSummary?.byExecutive || []).map(r => (
                        <tr key={r.execId} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{r.execName}</td>
                          <td className="p-4 text-right font-semibold text-gray-800">{r.kms} km</td>
                          <td className="p-4 text-right text-gray-700">₹{formatINR(r.kmPayout)}</td>
                          <td className="p-4 text-right text-gray-700">₹{formatINR(r.foodingAllowance)}</td>
                          <td className="p-4 text-right text-gray-700">₹{formatINR(r.miscExpenses)}</td>
                          <td className="p-4 text-right font-black text-purple-700">
                            ₹{formatINR(r.netSettled)}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-purple-50/60 font-black text-gray-900 border-t-2 border-purple-200">
                        <td className="p-4">GROUP TOTAL CLAIMS</td>
                        <td className="p-4 text-right text-purple-900">{reportData.reimbursementsSummary?.totalKmTravelled || 0} km</td>
                        <td className="p-4 text-right">₹{formatINR(reportData.reimbursementsSummary?.totalKmPayout)}</td>
                        <td className="p-4 text-right">₹{formatINR(reportData.reimbursementsSummary?.totalFoodingAllowance)}</td>
                        <td className="p-4 text-right">₹{formatINR(reportData.reimbursementsSummary?.totalMiscExpenses)}</td>
                        <td className="p-4 text-right text-purple-900 text-base">
                          ₹{formatINR(reportData.reimbursementsSummary?.netSettledAmount)}
                        </td>
                        <td className="p-4 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. VISIT PERFORMANCE & AUDIT */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="text-amber-600" size={18} /> 4. Visit Performance & GPS Verification Audits
                  </h3>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    Rejection Rate: {reportData.visitPerformance?.rejectionRate || '0.0%'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4">Executive Name</th>
                        <th className="p-4 text-center">Total Visits</th>
                        <th className="p-4 text-center">GPS Verified</th>
                        <th className="p-4 text-center">Rejected / Flagged</th>
                        <th className="p-4 text-center">Pending Review</th>
                        <th className="p-4 text-right">Rejection Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {(reportData.visitPerformance?.byExecutive || []).length > 0 ? (
                        reportData.visitPerformance.byExecutive.map(v => (
                          <tr key={v.execId} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-900">{v.execName}</td>
                            <td className="p-4 text-center font-bold text-gray-800">{v.totalVisits}</td>
                            <td className="p-4 text-center font-semibold text-green-600">{v.verified}</td>
                            <td className="p-4 text-center font-semibold text-red-600">{v.rejected}</td>
                            <td className="p-4 text-center font-semibold text-amber-600">{v.pending}</td>
                            <td className="p-4 text-right font-black text-gray-900">{v.rejectionRate}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                            No field executive visits recorded for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-PAGE 2: TOP PERFORMERS IN EXECUTIVES */}
          {/* ============================================================== */}
          {activeSubPage === 'top_execs' && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-400" size={24} />
                    <h3 className="text-xl font-black">Top Performing Field Executives</h3>
                  </div>
                  <p className="text-xs text-purple-200 mt-1">
                    Ranked by total sales generated, collection volume, visits logged, and composite efficiency score.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <span className="text-xs font-semibold text-purple-200">Total Ranked:</span>
                  <span className="font-black text-lg ml-2">{reportData.topPerformersExecs?.length || 0} Executives</span>
                </div>
              </div>

              {/* Table of top execs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Executive Details</th>
                        <th className="p-4 text-right">Sales Value (₹)</th>
                        <th className="p-4 text-right">Volume (Units)</th>
                        <th className="p-4 text-right">Collections (₹)</th>
                        <th className="p-4 text-right">Incentives (₹)</th>
                        <th className="p-4 text-right">KMs & Travel</th>
                        <th className="p-4 text-center">Visits</th>
                        <th className="p-4 text-center">Score & Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filterList(reportData.topPerformersExecs).length > 0 ? (
                        filterList(reportData.topPerformersExecs).map((exec) => (
                          <tr key={exec.execId} className="hover:bg-purple-50/40 transition-colors">
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                                exec.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300' :
                                exec.rank === 2 ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-200' :
                                exec.rank === 3 ? 'bg-amber-700 text-white ring-2 ring-amber-600' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {exec.rank === 1 ? '🥇' : exec.rank === 2 ? '🥈' : exec.rank === 3 ? '🥉' : `#${exec.rank}`}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-gray-900">{exec.execName}</p>
                                {exec.activeShift && (
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Shift Currently Active"></span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <Phone size={12} className="text-gray-400" /> {exec.phoneNumber || '9876543210'}
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">{exec.territory}</p>
                            </td>
                            <td className="p-4 text-right font-black text-green-700 text-base">
                              ₹{formatINR(exec.salesValue)}
                            </td>
                            <td className="p-4 text-right font-semibold text-gray-800">
                              {formatNum(exec.volumeUnits)}
                            </td>
                            <td className="p-4 text-right font-black text-blue-700">
                              ₹{formatINR(exec.collections)}
                            </td>
                            <td className="p-4 text-right font-bold text-amber-700">
                              ₹{formatINR(exec.incentives)}
                            </td>
                            <td className="p-4 text-right text-xs">
                              <p className="font-bold text-gray-900">{exec.kms || 0} km</p>
                              <p className="text-gray-500">₹{formatINR(exec.netReimbursement)}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">
                                {exec.visitsCount || 0} logged
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                  (exec.score || 0) >= 85 ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300' :
                                  (exec.score || 0) >= 70 ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {exec.score || 0} pts • {exec.rating}
                                </span>
                                <div className="w-16 bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full ${(exec.score || 0) >= 85 ? 'bg-purple-600' : (exec.score || 0) >= 70 ? 'bg-blue-600' : 'bg-gray-500'}`}
                                    style={{ width: `${exec.score || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-xs text-gray-400">
                            No field executives registered yet. Register new executives in User Management System.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-PAGE 3: TOP 10 COMPANIES THAT BUY FROM US */}
          {/* ============================================================== */}
          {activeSubPage === 'top_buyers' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="text-emerald-400" size={24} />
                    <h3 className="text-xl font-black">Top 10 Purchasing Companies</h3>
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    Leading enterprise dealers ranked by total purchase volume, billing turnover, and liftoff frequency.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
                  <span className="text-xs text-emerald-200">Combined Turnover:</span>
                  <p className="font-black text-lg">₹{formatINR(reportData.rankingsSummary?.topBuyerGrossVolume)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Company / Dealer Details</th>
                        <th className="p-4">Primary Brand Handled</th>
                        <th className="p-4 text-right">Total Purchased (₹)</th>
                        <th className="p-4 text-right">Total Volume</th>
                        <th className="p-4 text-right">Total Paid (₹)</th>
                        <th className="p-4 text-right">Outstanding Dues (₹)</th>
                        <th className="p-4 text-center">Last Order</th>
                        <th className="p-4 text-center">Tier Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filterList(reportData.top10PurchasingCompanies).map((firm) => (
                        <tr key={firm.firmId} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                              firm.rank === 1 ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300' :
                              firm.rank <= 3 ? 'bg-emerald-100 text-emerald-900 font-bold' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              #{firm.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-gray-900 text-base">{firm.firmName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <User size={12} className="text-gray-400" /> {firm.contactPerson} • {firm.phone}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {firm.gstin}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold">
                              {firm.primaryProduct}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-emerald-800 text-base">
                            ₹{formatINR(firm.totalPurchased)}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-900">
                            {formatNum(firm.totalVolume)} units
                          </td>
                          <td className="p-4 text-right font-black text-blue-700">
                            ₹{formatINR(firm.totalPaid)}
                          </td>
                          <td className="p-4 text-right">
                            {firm.outstandingDues > 0 ? (
                              <span className="font-bold text-amber-700">
                                ₹{formatINR(firm.outstandingDues)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                Fully Paid
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center text-xs text-gray-600 font-medium">
                            {firm.lastOrderDate}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              firm.rank <= 3 ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-300' :
                              firm.rank <= 7 ? 'bg-emerald-100 text-emerald-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {firm.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-PAGE 4: TOP 10 TIMELY PAYMENT COMPANIES */}
          {/* ============================================================== */}
          {activeSubPage === 'timely_payments' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-900 to-cyan-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-teal-400" size={24} />
                    <h3 className="text-xl font-black">Top 10 Timely Payment Companies</h3>
                  </div>
                  <p className="text-xs text-teal-200 mt-1">
                    Ranked by payment speed calculated directly from the original order date to settlement timestamp.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
                  <span className="text-xs text-teal-200">Avg Group Turnaround:</span>
                  <p className="font-black text-lg">{reportData.rankingsSummary?.avgGroupTurnaroundDays || '0.5'} Days</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Company Details</th>
                        <th className="p-4 text-center">Average Turnaround (from Order Date)</th>
                        <th className="p-4 text-center">On-Time Clearance Rate</th>
                        <th className="p-4 text-right">Total Settled (₹)</th>
                        <th className="p-4 text-right">Total Purchased (₹)</th>
                        <th className="p-4">Payment Instruments</th>
                        <th className="p-4 text-center">Reliability Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filterList(reportData.top10TimelyPaymentCompanies).map((firm) => (
                        <tr key={firm.firmId} className="hover:bg-teal-50/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                              firm.rank === 1 ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300' :
                              firm.rank <= 3 ? 'bg-teal-100 text-teal-900 font-bold' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              #{firm.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-gray-900 text-base">{firm.firmName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <User size={12} className="text-gray-400" /> {firm.contactPerson} • {firm.phone}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {firm.gstin}</p>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-3 py-1 bg-teal-100 text-teal-900 rounded-full text-xs font-black">
                                ⚡ {firm.avgDaysToPay === 0 ? 'Instant (0 Days)' : `${firm.avgDaysToPay} Days`}
                              </span>
                              <span className="text-[10px] text-teal-700 font-medium mt-1">
                                {firm.turnaroundCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-black">
                              {firm.onTimeRatePercent}% On-Time
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-green-700 text-base">
                            ₹{formatINR(firm.totalPaid)}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-800">
                            ₹{formatINR(firm.totalPurchased)}
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {firm.paymentModes}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                              {firm.reliabilityRating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-PAGE 5: TOP 10 LOWEST PURCHASING COMPANIES */}
          {/* ============================================================== */}
          {activeSubPage === 'lowest_buyers' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-900 to-orange-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="text-amber-400" size={24} />
                    <h3 className="text-xl font-black">Top 10 Lowest Purchasing Companies</h3>
                  </div>
                  <p className="text-xs text-amber-200 mt-1">
                    Identifies under-performing, dormant, or infrequent client accounts requiring sales outreach.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <span className="text-xs text-amber-200">Outreach Priority:</span>
                  <p className="font-black text-lg">10 Active Accounts</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Company Details</th>
                        <th className="p-4 text-right">Purchased Volume (₹)</th>
                        <th className="p-4 text-center">Order Count</th>
                        <th className="p-4 text-center">Last Order Date</th>
                        <th className="p-4 text-center">Inactivity Gap</th>
                        <th className="p-4 text-center">Account Status</th>
                        <th className="p-4">Recommended Executive Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filterList(reportData.top10LowestPurchasingCompanies).map((firm) => (
                        <tr key={firm.firmId} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-sm">
                              #{firm.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-gray-900 text-base">{firm.firmName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <User size={12} className="text-gray-400" /> {firm.contactPerson} • {firm.phone}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {firm.gstin}</p>
                          </td>
                          <td className="p-4 text-right font-black text-gray-900 text-base">
                            ₹{formatINR(firm.totalPurchased)}
                          </td>
                          <td className="p-4 text-center font-bold text-gray-700">
                            {firm.orderCount || 0} orders
                          </td>
                          <td className="p-4 text-center text-xs text-gray-600 font-medium">
                            {firm.lastOrderDate}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              firm.daysSinceLastOrder > 30 ? 'bg-red-100 text-red-800' :
                              firm.daysSinceLastOrder > 15 ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {firm.daysSinceLastOrder} Days Inactive
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                              {firm.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-amber-900 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                              🎯 {firm.recommendedAction}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-PAGE 6: TOP 10 SLOW PAYMENT COMPANIES */}
          {/* ============================================================== */}
          {activeSubPage === 'slow_payments' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-rose-900 to-red-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-rose-400" size={24} />
                    <h3 className="text-xl font-black">Top 10 Slow Payment Companies</h3>
                  </div>
                  <p className="text-xs text-rose-200 mt-1">
                    Monitors extended payment lag beyond agreed billing cycles and high outstanding receivables.
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
                  <span className="text-xs text-rose-200">Total Delayed Overdue:</span>
                  <p className="font-black text-lg">₹{formatINR(reportData.rankingsSummary?.totalOverdueInSlowAccounts)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Company Details</th>
                        <th className="p-4 text-center">Payment Turnaround Lag</th>
                        <th className="p-4 text-right">Outstanding Overdue (₹)</th>
                        <th className="p-4 text-right">Total Purchased (₹)</th>
                        <th className="p-4 text-right">Total Paid (₹)</th>
                        <th className="p-4 text-center">Risk Bracket</th>
                        <th className="p-4">Recommended Recovery Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {filterList(reportData.top10SlowPaymentCompanies).map((firm) => (
                        <tr key={firm.firmId} className="hover:bg-rose-50/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                              firm.rank <= 3 ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300' :
                              'bg-rose-100 text-rose-900 font-bold'
                            }`}>
                              #{firm.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-black text-gray-900 text-base">{firm.firmName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <User size={12} className="text-gray-400" /> {firm.contactPerson} • {firm.phone}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {firm.gstin}</p>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-black">
                                ⚠️ {firm.avgDaysToPay} Days Delay
                              </span>
                              <span className="text-[10px] text-rose-700 font-medium mt-1">
                                {firm.overdueAgeBracket}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-black text-rose-700 text-base">
                            ₹{formatINR(firm.outstandingDues)}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-800">
                            ₹{formatINR(firm.totalPurchased)}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-600">
                            ₹{formatINR(firm.totalPaid)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              firm.avgDaysToPay > 30 ? 'bg-rose-200 text-rose-900 border border-rose-400' :
                              'bg-amber-100 text-amber-900'
                            }`}>
                              {firm.riskLevel}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-rose-900 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                              📋 {firm.recoveryAction}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
