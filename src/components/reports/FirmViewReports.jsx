import React, { useState } from 'react';
import { 
  Building2, ShoppingBag, CreditCard, Calendar, User, Phone, MapPin, 
  Search, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Store, Tag, ShieldCheck, Download, Eye, ExternalLink, ChevronRight, Filter
} from 'lucide-react';

const formatINR = (val) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

export default function FirmViewReports({ 
  firms = [], 
  visits = [], 
  reportData = {}, 
  searchQuery = '', 
  onSelectSubTab 
}) {
  const [activeFirmSubTab, setActiveFirmSubTab] = useState('firms_onboarded'); // 'firms_onboarded' | 'sales_data' | 'visits_data' | 'payment_data'
  const [localSearch, setLocalSearch] = useState('');
  const [selectedFirmFilter, setSelectedFirmFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  // 1. FIRMS ONBOARDED FILTERING
  const filteredFirms = firms.filter(f => {
    if (!effectiveSearch) return true;
    return (
      (f.name || '').toLowerCase().includes(effectiveSearch) ||
      (f.contactPerson || '').toLowerCase().includes(effectiveSearch) ||
      (f.phone || '').toLowerCase().includes(effectiveSearch) ||
      (f.address || '').toLowerCase().includes(effectiveSearch) ||
      (f.gstin || '').toLowerCase().includes(effectiveSearch) ||
      (f.brands_handled || '').toLowerCase().includes(effectiveSearch)
    );
  });

  // 2. SALES DATA FILTERING
  const salesOrders = visits.filter(v => {
    const isOrder = (v.orderValue && parseFloat(v.orderValue) > 0) || (v.quantity && parseFloat(v.quantity) > 0);
    if (!isOrder) return false;
    if (selectedFirmFilter !== 'ALL' && (v.firmName || '').toLowerCase() !== selectedFirmFilter.toLowerCase()) return false;
    if (effectiveSearch) {
      const match = (v.firmName || '').toLowerCase().includes(effectiveSearch) ||
                    (v.product || '').toLowerCase().includes(effectiveSearch) ||
                    (v.exec_name || v.execName || v.userId || '').toLowerCase().includes(effectiveSearch) ||
                    (v.deliveryType || '').toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  // 3. VISITS DATA FILTERING
  const fieldVisits = visits.filter(v => {
    if (selectedFirmFilter !== 'ALL' && (v.firmName || '').toLowerCase() !== selectedFirmFilter.toLowerCase()) return false;
    if (effectiveSearch) {
      const match = (v.firmName || '').toLowerCase().includes(effectiveSearch) ||
                    (v.exec_name || v.execName || v.userId || '').toLowerCase().includes(effectiveSearch) ||
                    (v.purpose || '').toLowerCase().includes(effectiveSearch) ||
                    (v.notes || '').toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  // 4. PAYMENT DATA FILTERING
  const paymentCollections = visits.filter(v => {
    const isCollection = v.collectedAmount && parseFloat(v.collectedAmount) > 0;
    if (!isCollection) return false;
    if (selectedFirmFilter !== 'ALL' && (v.firmName || '').toLowerCase() !== selectedFirmFilter.toLowerCase()) return false;
    if (paymentModeFilter !== 'ALL' && (v.paymentMode || '').toUpperCase() !== paymentModeFilter.toUpperCase()) return false;
    if (effectiveSearch) {
      const match = (v.firmName || '').toLowerCase().includes(effectiveSearch) ||
                    (v.paymentMode || '').toLowerCase().includes(effectiveSearch) ||
                    (v.txnId || '').toLowerCase().includes(effectiveSearch) ||
                    (v.exec_name || v.execName || v.userId || '').toLowerCase().includes(effectiveSearch);
      if (!match) return false;
    }
    return true;
  });

  // Aggregated Firm View Summary Metrics
  const totalBilledValue = salesOrders.reduce((sum, v) => sum + (parseFloat(v.orderValue) || 0), 0);
  const totalUnitsLifted = salesOrders.reduce((sum, v) => sum + (parseFloat(v.quantity) || 0), 0);
  const totalCollections = paymentCollections.reduce((sum, v) => sum + (parseFloat(v.collectedAmount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-400" size={24} />
            <h3 className="text-xl font-black">Firm Intelligence & Commercial Reports</h3>
          </div>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl">
            Complete institutional audit of all onboarded client firms, billed sales transactions, on-ground visit logs, and realized payment collections across Sundaram Mahadeo Group.
          </p>
        </div>

        {/* Quick Metrics Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-blue-200 uppercase font-bold">Total Active Firms</span>
            <p className="font-black text-lg text-white">{firms.length}</p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
            <span className="text-[10px] text-blue-200 uppercase font-bold">Total Realized Dues</span>
            <p className="font-black text-lg text-emerald-300">₹{formatINR(totalCollections)}</p>
          </div>
        </div>
      </div>

      {/* Sub-Category Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFirmSubTab('firms_onboarded')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeFirmSubTab === 'firms_onboarded'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Store size={15} />
            <span>Firms Onboarded ({filteredFirms.length})</span>
          </button>

          <button
            onClick={() => setActiveFirmSubTab('sales_data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeFirmSubTab === 'sales_data'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Sales Data ({salesOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveFirmSubTab('visits_data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeFirmSubTab === 'visits_data'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Calendar size={15} />
            <span>Visits Data ({fieldVisits.length})</span>
          </button>

          <button
            onClick={() => setActiveFirmSubTab('payment_data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeFirmSubTab === 'payment_data'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <CreditCard size={15} />
            <span>Payment Data ({paymentCollections.length})</span>
          </button>
        </div>

        {/* Firm Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={selectedFirmFilter}
            onChange={(e) => setSelectedFirmFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Registered Firms</option>
            {firms.map(f => (
              <option key={f.id || f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-VIEW: FIRMS ONBOARDED                                              */}
      {/* ========================================================================= */}
      {activeFirmSubTab === 'firms_onboarded' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <span>Registered Dealer Establishments & Rate Card</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                {filteredFirms.length} firms
              </span>
            </h4>
          </div>

          {filteredFirms.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <Store size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="font-semibold">No registered firms found matching your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFirms.map((firm) => (
                <div 
                  key={firm.id || firm.name}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-black text-base text-gray-900 leading-snug">{firm.name}</h5>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">GSTIN: {firm.gstin || 'UNREGISTERED'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-100 shrink-0">
                        {firm.status || 'Active'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">{firm.contactPerson || 'Proprietor'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span>{firm.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px]">{firm.address || 'Address on file'}</span>
                      </div>
                    </div>

                    {firm.brands_handled && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Brands Handled</span>
                        <p className="text-xs font-semibold text-indigo-900 bg-indigo-50/60 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {firm.brands_handled}
                        </p>
                      </div>
                    )}

                    {firm.prices && (
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-[11px]">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Dealer Price Intelligence</span>
                        <div className="grid grid-cols-3 gap-1 text-center font-bold text-gray-800">
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium block">Purchase</span>
                            <span>₹{firm.prices.purchase || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium block">Retail</span>
                            <span>₹{firm.prices.retail || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-medium block">Wholesale</span>
                            <span>₹{firm.prices.wholesale || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span>Onboarded: {firm.createdAt ? new Date(firm.createdAt).toLocaleDateString() : 'Active'}</span>
                    {firm.location?.lat && (
                      <a 
                        href={`https://www.google.com/maps?q=${firm.location.lat},${firm.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        GPS Map <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: SALES DATA                                                   */}
      {/* ========================================================================= */}
      {activeFirmSubTab === 'sales_data' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Billed Sales Value</span>
              <p className="text-xl font-black text-blue-700 mt-1">₹{formatINR(totalBilledValue)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{salesOrders.length} order invoices logged</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Volume Units Lifted</span>
              <p className="text-xl font-black text-gray-900 mt-1">{formatINR(totalUnitsLifted)} Units</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Bags / Metric Tons lifted</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Average Order Value</span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                ₹{formatINR(salesOrders.length > 0 ? Math.round(totalBilledValue / salesOrders.length) : 0)}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Per booked consignment</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Firm Billed Sales & Lifting Ledger ({salesOrders.length} records)
              </h4>
            </div>

            {salesOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ShoppingBag size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No sales order records match the current filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Firm / Client Name</th>
                      <th className="p-4">Product & Grade</th>
                      <th className="p-4 text-center">Volume Lifted</th>
                      <th className="p-4 text-right">Unit Rate (₹)</th>
                      <th className="p-4 text-right">Total Billing (₹)</th>
                      <th className="p-4">Executive</th>
                      <th className="p-4">Delivery Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {salesOrders.map((s, idx) => {
                      const qty = parseFloat(s.quantity) || 0;
                      const val = parseFloat(s.orderValue) || 0;
                      const unitRate = qty > 0 ? (val / qty).toFixed(2) : '0.00';
                      return (
                        <tr key={s.id || idx} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                            {(s.paymentDate || s.timestamp || s.createdAt || '').split('T')[0]}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-gray-900">{s.firmName}</p>
                            {s.contactPerson && <p className="text-xs text-gray-400">{s.contactPerson}</p>}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-100">
                              {s.product || 'Standard Cement / TMT'}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-gray-800">
                            {qty} {s.unit || 'Bags'}
                          </td>
                          <td className="p-4 text-right font-mono text-xs text-gray-600">
                            ₹{unitRate}
                          </td>
                          <td className="p-4 text-right font-black text-blue-700 text-base">
                            ₹{formatINR(val)}
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-700">
                            {s.exec_name || s.execName || s.userId || 'Field Exec'}
                          </td>
                          <td className="p-4 text-xs text-gray-500">
                            {s.deliveryType || 'Standard Dispatch'}
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

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: VISITS DATA                                                  */}
      {/* ========================================================================= */}
      {activeFirmSubTab === 'visits_data' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Field Visit Records & Verification Logs ({fieldVisits.length} logs)
              </h4>
            </div>

            {fieldVisits.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No visit logs recorded for this selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Firm Visited</th>
                      <th className="p-4">Executive Name</th>
                      <th className="p-4">Purpose / Agenda</th>
                      <th className="p-4 text-center">GPS Coordinates</th>
                      <th className="p-4 text-center">Audit Status</th>
                      <th className="p-4">Remarks / Field Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {fieldVisits.map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                          {v.timestamp ? new Date(v.timestamp).toLocaleString() : 'Recent'}
                        </td>
                        <td className="p-4">
                          <p className="font-black text-gray-900">{v.firmName || 'Unknown Firm'}</p>
                          <p className="text-[11px] text-gray-400">{v.contactPerson || ''}</p>
                        </td>
                        <td className="p-4 text-xs font-bold text-gray-800">
                          {v.exec_name || v.execName || v.userId || 'Executive'}
                        </td>
                        <td className="p-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold">
                            {v.purpose || (v.orderValue ? 'Order Booking' : v.collectedAmount ? 'Payment Collection' : 'Routine Visit')}
                          </span>
                        </td>
                        <td className="p-4 text-center text-xs">
                          {v.location?.lat ? (
                            <a
                              href={`https://www.google.com/maps?q=${v.location.lat},${v.location.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline font-mono text-[11px]"
                            >
                              <MapPin size={11} /> {Number(v.location.lat).toFixed(4)}, {Number(v.location.lng).toFixed(4)}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">No GPS Tag</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            v.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            v.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {v.status || 'VERIFIED'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                          {v.notes || 'Routine field check-in and relationship management.'}
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
      {/* 4. SUB-VIEW: PAYMENT DATA                                                 */}
      {/* ========================================================================= */}
      {activeFirmSubTab === 'payment_data' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Payments Realized</span>
              <p className="text-xl font-black text-emerald-700 mt-1">₹{formatINR(totalCollections)}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{paymentCollections.length} cleared payment receipts</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Net Outstanding Receivables</span>
              <p className="text-xl font-black text-amber-700 mt-1">
                ₹{formatINR(Math.max(0, totalBilledValue - totalCollections))}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Across active client portfolio</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400">Payment Modes Filter</span>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Payment Instruments</option>
                <option value="CASH">Cash Sales</option>
                <option value="UPI">UPI / Google Pay</option>
                <option value="NEFT">NEFT / RTGS / Bank</option>
                <option value="CHEQUE">Cheque Clearance</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                Payment Collection Receipts & Dues Clearance ({paymentCollections.length} entries)
              </h4>
            </div>

            {paymentCollections.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold">No payment collection records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-4">Payment Date</th>
                      <th className="p-4">Client / Firm Name</th>
                      <th className="p-4 text-right">Amount Collected (₹)</th>
                      <th className="p-4 text-center">Payment Instrument</th>
                      <th className="p-4">Reference / UTR No</th>
                      <th className="p-4">Executive Name</th>
                      <th className="p-4 text-center">Clearance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {paymentCollections.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                          {(c.paymentDate || c.timestamp || '').split('T')[0]}
                        </td>
                        <td className="p-4">
                          <p className="font-black text-gray-900">{c.firmName}</p>
                          <p className="text-xs text-gray-400">{c.contactPerson || ''}</p>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-700 text-base">
                          ₹{formatINR(c.collectedAmount)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                            {c.paymentMode || 'Cash'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-600">
                          {c.txnId || 'CASH-REC-' + (idx + 101)}
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-800">
                          {c.exec_name || c.execName || c.userId || 'Executive'}
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            CLEARED
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

    </div>
  );
}
