import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Download, Filter, Calendar, Users, TrendingUp, 
  IndianRupee, CheckCircle, RefreshCw, Layers, CreditCard, 
  Car, UserCheck, AlertCircle, Eye, FileSpreadsheet
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default function AdminReports({ user }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [rangePreset, setRangePreset] = useState('monthly'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(todayStr);
  const [executiveId, setExecutiveId] = useState('all');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [rangePreset, executiveId]);

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
        executiveId
      };
      const res = await api.get('/admin/reports', { params });
      setReportData(res.data);
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

  // CSV Export Engine
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
      csv.push(`Generated At: ${new Date().toLocaleString()}`);
      csv.push(``);

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
      reportData.salesSummary?.byProduct.forEach(p => {
        csv.push(`"${p.productName}",${p.unit},${p.quantity},${p.unitPrice},${p.totalSalesValue}`);
      });
      csv.push(`TOTAL VOLUME,,${reportData.salesSummary?.totalVolumeUnits},,${reportData.salesSummary?.totalSalesValue}`);
      csv.push(``);

      // Section 3: Collections by Mode
      csv.push(`=== 3. COLLECTIONS SUMMARY BY PAYMENT INSTRUMENT ===`);
      csv.push(`Payment Mode,Transaction Count,Total Amount (INR),Percentage Share (%)`);
      reportData.collectionsSummary?.byMode.forEach(m => {
        csv.push(`${m.mode},${m.count},${m.amount},${m.percentage}%`);
      });
      csv.push(`TOTAL COLLECTIONS,,${reportData.collectionsSummary?.totalCollections},100%`);
      csv.push(``);

      // Section 4: Transactions Ledger
      csv.push(`=== 4. PAYMENT TRANSACTIONS LEDGER ===`);
      csv.push(`Transaction ID,Date/Time,Executive Name,Client / Firm Name,Payment Mode,Reference / UTR No,Amount (INR),Clearance Status`);
      reportData.collectionsSummary?.transactions.forEach(tx => {
        csv.push(`"${tx.id}","${tx.dateTime}","${tx.execName}","${tx.clientName}",${tx.mode},"${tx.refNumber}",${tx.amount},"${tx.status}"`);
      });
      csv.push(``);

      // Section 5: Reimbursements & Claims
      csv.push(`=== 5. REIMBURSEMENTS & FIELD CLAIMS ===`);
      csv.push(`Executive Name,KM Travelled,Rate (INR/KM),KM Payout (INR),Fooding Allowance (INR),Misc Expenses (INR),Net Settled Total (INR),Settlement Status`);
      reportData.reimbursementsSummary?.byExecutive.forEach(r => {
        csv.push(`"${r.execName}",${r.kms},${r.kmRate},${r.kmPayout},${r.foodingAllowance},${r.miscExpenses},${r.netSettled},"${r.status}"`);
      });
      csv.push(`GROUP TOTALS,${reportData.reimbursementsSummary?.totalKmTravelled},,${reportData.reimbursementsSummary?.totalKmPayout},${reportData.reimbursementsSummary?.totalFoodingAllowance},${reportData.reimbursementsSummary?.totalMiscExpenses},${reportData.reimbursementsSummary?.netSettledAmount},`);
      csv.push(``);

      // Section 6: Visit Performance
      csv.push(`=== 6. VISIT PERFORMANCE & AUDIT STATUS ===`);
      csv.push(`Executive Name,Total Visits Logged,Verified Count,Rejected Count,Pending Verification,Rejection Rate`);
      reportData.visitPerformance?.byExecutive.forEach(v => {
        csv.push(`"${v.execName}",${v.totalVisits},${v.verified},${v.rejected},${v.pending},${v.rejectionRate}`);
      });
      csv.push(``);

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join("\n"));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", csvContent);
      downloadAnchor.setAttribute("download", `SMM_Financial_Audit_Report_${rangePreset}_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error generating CSV export', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={24} /> Financial Audit & Operational Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Reconcile daily billing volumes, payment ledger profiles, field mileage payouts, and visit audits.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={!reportData || exporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <Download size={16} /> {exporting ? 'Compiling CSV...' : 'Download CSV'}
        </button>
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
          <p className="font-semibold text-gray-700">Compiling financial metrics...</p>
        </div>
      ) : !reportData ? (
        <div className="py-12 text-center text-red-500 bg-white rounded-2xl">
          Failed to load report data. Please retry.
        </div>
      ) : (
        <>
          {/* Top KPI Metrics Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Gross Sales Value</span>
              <p className="text-2xl font-black text-gray-900 mt-2">
                ₹{reportData.kpis.totalSalesValue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {reportData.kpis.totalVolumeUnits.toLocaleString('en-IN')} units sold
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Payment Collections</span>
              <p className="text-2xl font-black text-green-700 mt-2">
                ₹{reportData.kpis.totalCollections.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {reportData.collectionsSummary?.byMode.reduce((sum, m) => sum + m.count, 0)} transactions
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mileage & Payouts</span>
              <p className="text-2xl font-black text-purple-700 mt-2">
                ₹{reportData.kpis.netSettledAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {reportData.kpis.totalKmTravelled} km @ ₹{reportData.reimbursementsSummary?.kmRate}/km
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Visits & Audit</span>
              <p className="text-2xl font-black text-gray-900 mt-2">
                {reportData.kpis.totalVisitsCount} <span className="text-sm font-semibold text-gray-500">Visits</span>
              </p>
              <p className="text-xs text-amber-700 mt-1 font-medium">
                Rejection Rate: <span className="font-bold">{reportData.kpis.rejectionRate}</span>
              </p>
            </div>
          </div>

          {/* 1. SALES & VOLUME SUMMARY */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={18} /> 1. Sales & Volume Summary (By Product & Unit Type)
              </h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                Total: ₹{reportData.salesSummary?.totalSalesValue.toLocaleString('en-IN')}
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
                  {reportData.salesSummary?.byProduct.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{p.productName}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-800">
                        {p.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right text-gray-600">
                        ₹{p.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-black text-green-700">
                        ₹{p.totalSalesValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/60 font-black text-gray-900 border-t-2 border-blue-200">
                    <td className="p-4">CONSOLIDATED VOLUME & BILLING</td>
                    <td className="p-4">-</td>
                    <td className="p-4 text-right text-blue-900">
                      {reportData.salesSummary?.totalVolumeUnits.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right">-</td>
                    <td className="p-4 text-right text-green-800 text-base">
                      ₹{reportData.salesSummary?.totalSalesValue.toLocaleString('en-IN')}
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
                Total Collections: ₹{reportData.collectionsSummary?.totalCollections.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Mode Distribution Pills */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/30">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Grouped Payment Mode Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {reportData.collectionsSummary?.byMode.map(m => (
                  <div key={m.mode} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      m.mode === 'NEFT' ? 'bg-blue-100 text-blue-800' :
                      m.mode === 'UPI' ? 'bg-purple-100 text-purple-800' :
                      m.mode === 'Cash' ? 'bg-green-100 text-green-800' :
                      m.mode === 'Cheque' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {m.mode} ({m.count})
                    </span>
                    <p className="font-black text-gray-900 mt-2 text-base">₹{m.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{m.percentage}% of total</p>
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
                  {reportData.collectionsSummary?.transactions.map(tx => (
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
                        ₹{tx.amount.toLocaleString('en-IN')}
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
                Rate: ₹{reportData.reimbursementsSummary?.kmRate}/km • Fooding: ₹{reportData.reimbursementsSummary?.totalFoodingAllowance > 0 ? 250 : 0}/day
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
                  {reportData.reimbursementsSummary?.byExecutive.map(r => (
                    <tr key={r.execId} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{r.execName}</td>
                      <td className="p-4 text-right font-semibold text-gray-800">{r.kms} km</td>
                      <td className="p-4 text-right text-gray-700">₹{r.kmPayout.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-gray-700">₹{r.foodingAllowance.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-gray-700">₹{r.miscExpenses.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right font-black text-purple-700">
                        ₹{r.netSettled.toLocaleString('en-IN')}
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
                    <td className="p-4 text-right text-purple-900">{reportData.reimbursementsSummary?.totalKmTravelled} km</td>
                    <td className="p-4 text-right">₹{reportData.reimbursementsSummary?.totalKmPayout.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right">₹{reportData.reimbursementsSummary?.totalFoodingAllowance.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right">₹{reportData.reimbursementsSummary?.totalMiscExpenses.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right text-purple-900 text-base">
                      ₹{reportData.reimbursementsSummary?.netSettledAmount.toLocaleString('en-IN')}
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
                Rejection Rate: {reportData.visitPerformance?.rejectionRate}
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
                  {reportData.visitPerformance?.byExecutive.map(v => (
                    <tr key={v.execId} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{v.execName}</td>
                      <td className="p-4 text-center font-bold text-gray-800">{v.totalVisits}</td>
                      <td className="p-4 text-center font-semibold text-green-600">{v.verified}</td>
                      <td className="p-4 text-center font-semibold text-red-600">{v.rejected}</td>
                      <td className="p-4 text-center font-semibold text-amber-600">{v.pending}</td>
                      <td className="p-4 text-right font-black text-gray-900">{v.rejectionRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
