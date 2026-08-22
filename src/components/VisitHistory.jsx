import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Clock, MapPin, Store, IndianRupee, 
  CheckCircle2, Filter, AlertCircle, FileText, ChevronRight, RefreshCw, 
  Layers, ShoppingBag, CreditCard, Lock, Edit3, Trash2, X
} from 'lucide-react';
import { api } from '../lib/api';

export default function VisitHistory({ user, onEditVisit }) {
  // 1. LOCAL STORAGE & INITIAL STATE FALLBACK
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('user_visits');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'CUSTOM'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchHistory();
  }, [selectedDate, activeFilterTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const dateParam = activeFilterTab === 'CUSTOM' ? selectedDate : activeFilterTab === 'TODAY' ? todayStr : '';
      const res = await api.get('/visits', {
        params: dateParam ? { date: dateParam } : {}
      });

      if (Array.isArray(res.data?.visits)) {
        setHistory(res.data.visits);
        if (activeFilterTab === 'ALL') {
          localStorage.setItem('user_visits', JSON.stringify(res.data.visits));
        }
      }
    } catch (err) {
      console.warn('API /visits failed, relying gracefully on localStorage cache.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (visitId) => {
    const target = history.find(v => v.id === visitId);
    if (!target) return;

    const visitDate = (target.paymentDate || target.timestamp || target.createdAt || '').split('T')[0];
    if (visitDate !== todayStr && user?.role !== 'ADMIN') {
      setFeedbackMsg('Policy Error: Only today\'s logs can be deleted.');
      setDeleteConfirmId(null);
      setTimeout(() => setFeedbackMsg(''), 4000);
      return;
    }

    const filtered = history.filter(v => v.id !== visitId);
    setHistory(filtered);
    localStorage.setItem('user_visits', JSON.stringify(filtered));
    setDeleteConfirmId(null);

    try {
      await api.delete(`/visits/${visitId}`);
      setFeedbackMsg('Visit log deleted successfully.');
    } catch (e) {
      setFeedbackMsg('Visit log deleted locally.');
    }
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Filter local history based on selected filters
  const filteredHistory = history.filter(item => {
    const itemDate = (item.paymentDate || item.timestamp || item.createdAt || '').split('T')[0];

    // Date filtering
    if (activeFilterTab === 'TODAY' && itemDate !== todayStr) {
      return false;
    }
    if (activeFilterTab === 'CUSTOM' && itemDate !== selectedDate) {
      return false;
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const firmMatch = (item.firmName || '').toLowerCase().includes(query);
      const purposeMatch = (item.purpose || '').toLowerCase().includes(query);
      const productMatch = (item.product || item.productDiscussed || '').toLowerCase().includes(query);
      const modeMatch = (item.paymentMode || '').toLowerCase().includes(query);
      if (!firmMatch && !purposeMatch && !productMatch && !modeMatch) return false;
    }

    return true;
  });

  // Calculate quick metrics for visible cards
  const totalCollections = filteredHistory.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const totalOrders = filteredHistory.reduce((sum, v) => sum + (v.orderValue || 0), 0);
  const totalIncentives = filteredHistory.reduce((sum, v) => sum + (v.bagIncentive || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {feedbackMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* DATE / CALENDAR FILTER BAR AT TOP */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={22} />
              Visit History & Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by date, search firm transactions, and audit verified field logs
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveFilterTab('ALL')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilterTab === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('TODAY')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilterTab === 'TODAY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('CUSTOM')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilterTab === 'CUSTOM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Date
            </button>
          </div>
        </div>

        {/* Calendar Picker & Search input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by firm, product, payment mode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setActiveFilterTab('CUSTOM');
                }}
                className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
              />
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Refresh History"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Aggregated Totals Bar */}
        {filteredHistory.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-500">Filtered Logs</p>
              <p className="text-sm font-black text-slate-900">{filteredHistory.length}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <p className="text-[10px] uppercase font-bold text-blue-700">Orders Billed</p>
              <p className="text-sm font-black text-blue-900">₹{totalOrders.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Payments Collected</p>
              <p className="text-sm font-black text-emerald-900">₹{totalCollections.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>

      {/* VISIT HISTORY LIST OR EMPTY STATE PLACEHOLDER */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeFilterTab === 'CUSTOM' 
              ? `No past visit history found for selected date (${selectedDate}).` 
              : activeFilterTab === 'TODAY' 
                ? 'No past visit history found for today.' 
                : 'No past visit history found.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log visits using the Visit Logger tab or adjust your date filter to view past client records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((visit) => {
            const vDate = (visit.paymentDate || visit.timestamp || visit.createdAt || '').split('T')[0];
            const isToday = vDate === todayStr;

            return (
              <div
                key={visit.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">{visit.firmName}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {vDate} &bull; {new Date(visit.timestamp || visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {visit.purpose}
                    </span>
                    
                    {isToday ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Editable (Today)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock size={10} /> Locked Record
                      </span>
                    )}

                    {isToday && (
                      <div className="flex items-center gap-1">
                        {deleteConfirmId === visit.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                            <button
                              onClick={() => handleDelete(visit.id)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-0.5 text-slate-500"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(visit.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete today's log"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Sales & Product Info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold text-slate-800">
                        {visit.product || visit.productDiscussed || 'Order'}:
                      </span>
                      <span className="font-bold text-slate-900">
                        ₹{(visit.orderValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {visit.quantity > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Volume: {visit.quantity} {visit.unit || 'Bags'}
                        {visit.bagIncentive > 0 && ` (Incentive: ₹${visit.bagIncentive})`}
                      </p>
                    )}
                  </div>

                  {/* Payment Collection Info */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <div className="flex justify-between items-center text-emerald-950 font-bold">
                      <span className="flex items-center gap-1 text-emerald-800">
                        <CreditCard size={12} /> Collection ({visit.paymentMode || 'Cash'}):
                      </span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{(visit.collectedAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {visit.txnId && (
                      <p className="text-[10px] font-mono text-emerald-700">
                        Txn / Ref: {visit.txnId}
                      </p>
                    )}
                  </div>
                </div>

                {visit.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl italic border border-slate-100">
                    "{visit.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
