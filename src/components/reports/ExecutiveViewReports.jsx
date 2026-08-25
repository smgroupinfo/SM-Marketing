import React, { useState } from 'react';
import { 
  Users, Award, TrendingUp, IndianRupee, Car, UserCheck, 
  Calendar, CheckCircle, Clock, AlertTriangle, ArrowUpRight, 
  ArrowDownLeft, Star, Phone, MapPin, Search, ShieldCheck, Filter
} from 'lucide-react';

const formatINR = (val) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

export default function ExecutiveViewReports({ 
  reportData = {}, 
  visits = [], 
  searchQuery = '', 
  onSelectSubTab 
}) {
  const [activeExecSubTab, setActiveExecSubTab] = useState('exec_rankings'); // 'exec_rankings' | 'exec_sales' | 'exec_visits' | 'reimbursements' | 'master_ledger'
  const [selectedExecFilter, setSelectedExecFilter] = useState('ALL');

  const executivesList = reportData.executives || [];
  const topPerformers = reportData.topPerformersExecs || [];
  const reimbursements = reportData.reimbursementsSummary?.byExecutive || [];
  const visitPerformance = reportData.visitPerformance?.byExecutive || [];

  const effectiveSearch = searchQuery.toLowerCase().trim();

  // Filtered lists
  const filteredPerformers = topPerformers.filter(e => {
    if (selectedExecFilter !== 'ALL' && e.execName !== selectedExecFilter) return false;
    if (effectiveSearch) {
      return (e.execName || '').toLowerCase().includes(effectiveSearch) ||
             (e.phoneNumber || '').toLowerCase().includes(effectiveSearch) ||
             (e.territory || '').toLowerCase().includes(effectiveSearch);
    }
    return true;
  });

  const filteredReimbursements = reimbursements.filter(r => {
    if (selectedExecFilter !== 'ALL' && r.execName !== selectedExecFilter) return false;
    if (effectiveSearch) {
      return (r.execName || '').toLowerCase().includes(effectiveSearch);
    }
    return true;
  });

  const filteredVisitPerf = visitPerformance.filter(v => {
    if (selectedExecFilter !== 'ALL' && v.execName !== selectedExecFilter) return false;
    if (effectiveSearch) {
      return (v.execName || '').toLowerCase().includes(effectiveSearch);
    }
    return true;
  });

  const filteredLedgerVisits = visits.filter(v => {
    const execName = v.exec_name || v.execName || v.userId || '';
    if (selectedExecFilter !== 'ALL' && execName !== selectedExecFilter) return false;
    if (effectiveSearch) {
      return execName.toLowerCase().includes(effectiveSearch) ||
             (v.firmName || '').toLowerCase().includes(effectiveSearch) ||
             (v.purpose || '').toLowerCase().includes(effectiveSearch);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Executive View Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-purple-400" size={24} />
            <h3 className="text-xl font-black">Field Executive Intelligence & Performance Audit</h3>
          </div>
          <p className="text-xs text-purple-200 mt-1 max-w-2xl">
            Granular multi-dimensional tracking of field workforce productivity, sales volume achievements, on-ground collection clearance, and travel reimbursement audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-purple-200 uppercase font-bold">Active Force</span>
            <p className="font-black text-lg text-white">{executivesList.length || topPerformers.length}</p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-purple-200 uppercase font-bold">Total Mileage Claims</span>
            <p className="font-black text-lg text-amber-300">₹{formatINR(reportData.kpis?.netSettledAmount)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveExecSubTab('exec_rankings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeExecSubTab === 'exec_rankings'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Award size={15} />
            <span>Leaderboard & Rankings ({filteredPerformers.length})</span>
          </button>

          <button
            onClick={() => setActiveExecSubTab('exec_sales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeExecSubTab === 'exec_sales'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <TrendingUp size={15} />
            <span>Sales & Collections</span>
          </button>

          <button
            onClick={() => setActiveExecSubTab('exec_visits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeExecSubTab === 'exec_visits'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <UserCheck size={15} />
            <span>Visits & Audit</span>
          </button>

          <button
            onClick={() => setActiveExecSubTab('reimbursements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeExecSubTab === 'reimbursements'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Car size={15} />
            <span>Travel & Claims ({filteredReimbursements.length})</span>
          </button>

          <button
            onClick={() => setActiveExecSubTab('master_ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeExecSubTab === 'master_ledger'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Calendar size={15} />
            <span>Master Activity Ledger ({filteredLedgerVisits.length})</span>
          </button>
        </div>

        {/* Executive Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={selectedExecFilter}
            onChange={(e) => setSelectedExecFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Field Executives</option>
            {executivesList.map(e => (
              <option key={e.id} value={e.name}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-VIEW: LEADERBOARD & RANKINGS                                       */}
      {/* ========================================================================= */}
      {activeExecSubTab === 'exec_rankings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Executive Leaderboard & Performance Scorecard
              </h4>
            </div>

            {filteredPerformers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Award size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No executive performance records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-center">Rank</th>
                      <th className="p-4">Executive Details</th>
                      <th className="p-4 text-right">Sales Value (₹)</th>
                      <th className="p-4 text-center">Volume Lifted</th>
                      <th className="p-4 text-right">Collections (₹)</th>
                      <th className="p-4 text-right">Incentives (₹)</th>
                      <th className="p-4 text-center">Visits</th>
                      <th className="p-4 text-center">Performance Tier</th>
                      <th className="p-4 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredPerformers.map((exec) => (
                      <tr key={exec.execId || exec.execName} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                            exec.rank === 1 ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-100 shadow-sm' :
                            exec.rank === 2 ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-100' :
                            exec.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            #{exec.rank}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-gray-900 text-base">{exec.execName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Phone size={12} className="text-gray-400" /> {exec.phoneNumber || 'N/A'}
                          </div>
                          <p className="text-[11px] text-purple-700 font-semibold mt-0.5">📍 {exec.territory || 'Central Ranchi'}</p>
                        </td>
                        <td className="p-4 text-right font-black text-blue-700 text-base">
                          ₹{formatINR(exec.salesValue)}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-800">
                          {formatINR(exec.volumeUnits)} Bags
                        </td>
                        <td className="p-4 text-right font-black text-emerald-700 text-base">
                          ₹{formatINR(exec.collections)}
                        </td>
                        <td className="p-4 text-right font-bold text-amber-700">
                          ₹{formatINR(exec.incentives || 0)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 font-bold text-xs">
                            {exec.visitsCount} visits
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            exec.rating === 'Elite Performer' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            exec.rating === 'Outstanding' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {exec.rating}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-sm">
                            <Star size={14} className="fill-amber-400" /> {exec.score}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: SALES & COLLECTIONS                                          */}
      {/* ========================================================================= */}
      {activeExecSubTab === 'exec_sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPerformers.map((exec) => {
              const sales = parseFloat(exec.salesValue) || 0;
              const collections = parseFloat(exec.collections) || 0;
              const ratio = sales > 0 ? Math.min(100, Math.round((collections / sales) * 100)) : 0;
              return (
                <div key={exec.execId || exec.execName} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h5 className="font-black text-lg text-gray-900">{exec.execName}</h5>
                      <span className="text-xs text-gray-500">{exec.territory || 'Assigned Zone'}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 font-bold text-xs">
                      Rank #{exec.rank}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold uppercase text-blue-700">Gross Sales Value</span>
                      <p className="text-lg font-black text-blue-900 mt-0.5">₹{formatINR(sales)}</p>
                      <p className="text-[11px] text-blue-600 mt-0.5">{exec.volumeUnits || 0} Units Sold</p>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase text-emerald-700">Collections Realized</span>
                      <p className="text-lg font-black text-emerald-900 mt-0.5">₹{formatINR(collections)}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Payment Recovery</p>
                    </div>
                  </div>

                  {/* Progress ratio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>Collection Recovery Efficiency</span>
                      <span>{ratio}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${ratio >= 80 ? 'bg-emerald-500' : ratio >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: VISITS & AUDIT                                               */}
      {/* ========================================================================= */}
      {activeExecSubTab === 'exec_visits' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Visit Verification & Audit Compliance by Executive
              </h4>
            </div>

            {filteredVisitPerf.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <UserCheck size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No visit audit logs available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Executive Name</th>
                      <th className="p-4 text-center">Total Visits</th>
                      <th className="p-4 text-center">Verified Visits</th>
                      <th className="p-4 text-center">Pending Review</th>
                      <th className="p-4 text-center">Rejected</th>
                      <th className="p-4 text-center">Rejection Rate</th>
                      <th className="p-4 text-center">Compliance Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredVisitPerf.map((v, idx) => (
                      <tr key={v.execName || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-black text-gray-900">{v.execName}</td>
                        <td className="p-4 text-center font-bold text-gray-800">{v.totalVisits}</td>
                        <td className="p-4 text-center font-bold text-emerald-700">✅ {v.verified}</td>
                        <td className="p-4 text-center font-bold text-amber-700">⏳ {v.pending}</td>
                        <td className="p-4 text-center font-bold text-rose-700">❌ {v.rejected}</td>
                        <td className="p-4 text-center font-mono text-xs font-bold text-gray-700">
                          {v.rejectionRate || '0.0%'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            parseFloat(v.rejectionRate) < 5 ? 'bg-emerald-100 text-emerald-800' :
                            parseFloat(v.rejectionRate) < 15 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {parseFloat(v.rejectionRate) < 5 ? 'High Integrity' : 'Requires Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: TRAVEL & REIMBURSEMENTS                                      */}
      {/* ========================================================================= */}
      {activeExecSubTab === 'reimbursements' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Odometer Mileage, Fooding Allowances & Net Payout Ledger
              </h4>
            </div>

            {filteredReimbursements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Car size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No travel claims recorded for this timeframe.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Executive Name</th>
                      <th className="p-4 text-center">KM Travelled</th>
                      <th className="p-4 text-right">KM Rate (₹)</th>
                      <th className="p-4 text-right">KM Payout (₹)</th>
                      <th className="p-4 text-right">Fooding Allowance (₹)</th>
                      <th className="p-4 text-right">Misc Claims (₹)</th>
                      <th className="p-4 text-right">Net Settled Total (₹)</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredReimbursements.map((r, idx) => (
                      <tr key={r.execName || idx} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 font-black text-gray-900">{r.execName}</td>
                        <td className="p-4 text-center font-bold text-gray-800">{r.kms} km</td>
                        <td className="p-4 text-right font-mono text-xs text-gray-600">₹{r.kmRate}/km</td>
                        <td className="p-4 text-right font-bold text-gray-800">₹{formatINR(r.kmPayout)}</td>
                        <td className="p-4 text-right text-gray-700">₹{formatINR(r.foodingAllowance)}</td>
                        <td className="p-4 text-right text-gray-700">₹{formatINR(r.miscExpenses)}</td>
                        <td className="p-4 text-right font-black text-amber-800 text-base">
                          ₹{formatINR(r.netSettled)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {r.status || 'SETTLED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: MASTER ACTIVITY LEDGER                                       */}
      {/* ========================================================================= */}
      {activeExecSubTab === 'master_ledger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Consolidated Field Activity Ledger ({filteredLedgerVisits.length} events)
              </h4>
            </div>

            {filteredLedgerVisits.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No field executive activity events recorded.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Executive</th>
                      <th className="p-4">Client / Firm</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4 text-right">Value / Amount (₹)</th>
                      <th className="p-4 text-center">Location Tag</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredLedgerVisits.map((v, idx) => {
                      const execName = v.exec_name || v.execName || v.userId || 'Field Exec';
                      const isOrder = parseFloat(v.orderValue) > 0;
                      const isCollection = parseFloat(v.collectedAmount) > 0;
                      return (
                        <tr key={v.id || idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                            {v.timestamp ? new Date(v.timestamp).toLocaleString() : 'Recent'}
                          </td>
                          <td className="p-4 font-bold text-gray-900">{execName}</td>
                          <td className="p-4 text-gray-800 font-medium">{v.firmName || 'Direct Field Interaction'}</td>
                          <td className="p-4 text-xs">
                            <span className={`px-2.5 py-1 rounded-full font-bold ${
                              isOrder ? 'bg-blue-100 text-blue-800' :
                              isCollection ? 'bg-emerald-100 text-emerald-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {isOrder ? '🛍️ Sales Order' : isCollection ? '💳 Payment Collection' : '📍 Field Visit'}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-sm">
                            {isOrder && <span className="text-blue-700">₹{formatINR(v.orderValue)}</span>}
                            {isCollection && <span className="text-emerald-700">₹{formatINR(v.collectedAmount)}</span>}
                            {!isOrder && !isCollection && <span className="text-gray-400">—</span>}
                          </td>
                          <td className="p-4 text-center text-xs">
                            {v.location?.lat ? (
                              <span className="font-mono text-[11px] text-blue-600 font-semibold">
                                {Number(v.location.lat).toFixed(3)}, {Number(v.location.lng).toFixed(3)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                              {v.status || 'LOGGED'}
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
        </div>
      )}

    </div>
  );
}
