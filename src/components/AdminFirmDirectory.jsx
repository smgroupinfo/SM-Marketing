import React, { useState, useEffect } from 'react';
import { 
  Store, PlusCircle, Search, MapPin, Phone, User, 
  FileText, CheckCircle2, AlertCircle, Camera, Check, RefreshCw, Tag,
  Calendar, ShoppingBag, CreditCard, ChevronRight, History, ExternalLink, IndianRupee,
  Filter, Download, Layers, ArrowUpRight, ArrowDownLeft, Wallet, Building2, Eye,
  Navigation, Crosshair, Compass, ShieldCheck, Edit3, Trash2, X, Lock, KeyRound, QrCode
} from 'lucide-react';
import { api } from '../lib/api';
import { captureLiveLocation } from '../lib/locationService';

export default function AdminFirmDirectory({ user }) {
  const isExecutiveAssistant = user && user.role === 'EXECUTIVE_ASSISTANT';

  // Navigation tabs within Firm Directory
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'onboard' | 'sales_orders' | 'collections' | 'ledger'

  // Data states
  const [firms, setFirms] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarded_firms');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(f => !['f-smst', 'f-smbnc', 'f-smgh', 'f-pss', 'f-smm', 'f-06', 'f-08'].includes(f.id)) : [];
    } catch (e) {
      return [];
    }
  });

  const [allVisits, setAllVisits] = useState(() => {
    try {
      const saved = localStorage.getItem('user_visits');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Onboarding Form input states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [brandsHandled, setBrandsHandled] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  // Admin Edit Firm State
  const [editingFirm, setEditingFirm] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    gstin: '',
    address: '',
    brandsHandled: '',
    purchasePrice: '',
    retailPrice: '',
    wholesalePrice: '',
    lat: '',
    lng: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Admin Delete Firm State
  const [deletingFirm, setDeletingFirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // GPS Location Capture States
  const [gpsCoords, setGpsCoords] = useState({ lat: 23.3441, lng: 85.3096 });
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('Ready to capture');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFirmFilter, setSelectedFirmFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Single-Date Lifting History Modal state
  const [selectedFirmForHistory, setSelectedFirmForHistory] = useState(null);
  const [historyFilterDate, setHistoryFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Direct Settlement Modal state
  const [settlementModalFirm, setSettlementModalFirm] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMode, setSettlementMode] = useState('UPI / Bank Transfer');
  const [settlementTxnId, setSettlementTxnId] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    fetchFirmsAndVisits();
    captureLiveGpsLocation(false);
  }, []);

  const captureLiveGpsLocation = async (showNotification = true) => {
    setIsCapturingGps(true);
    setGpsStatusMsg('Acquiring high-precision GPS satellite fix...');

    const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 8000 });

    if (res.success && res.coords) {
      setGpsCoords({ lat: res.coords.lat, lng: res.coords.lng });
      setGpsAccuracy(res.accuracy || 25);
      setIsCapturingGps(false);
      setGpsStatusMsg(`GPS Locked: ±${res.accuracy || 25}m (${res.source})`);

      if (showNotification) {
        setSuccessMsg(`GPS Location captured: ${res.coords.lat}° N, ${res.coords.lng}° E (±${res.accuracy || 25}m)`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } else {
      setIsCapturingGps(false);
      setGpsStatusMsg(res.error || 'GPS signal unavailable. Please retry or enter address.');
      if (showNotification) {
        setErrorMsg(res.error || 'Unable to lock GPS. Please ensure location permissions are enabled.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    }
  };

  const fetchFirmsAndVisits = async () => {
    setLoading(true);
    try {
      const [firmsRes, visitsRes] = await Promise.allSettled([
        api.get('/firms'),
        api.get('/visits')
      ]);

      if (firmsRes.status === 'fulfilled' && Array.isArray(firmsRes.value.data?.firms)) {
        const cleanFirms = firmsRes.value.data.firms.filter(f => !['f-smst', 'f-smbnc', 'f-smgh', 'f-pss', 'f-smm', 'f-06', 'f-08'].includes(f.id));
        setFirms(cleanFirms);
        localStorage.setItem('onboarded_firms', JSON.stringify(cleanFirms));
      }

      if (visitsRes.status === 'fulfilled' && Array.isArray(visitsRes.value.data?.visits)) {
        setAllVisits(visitsRes.value.data.visits);
        localStorage.setItem('user_visits', JSON.stringify(visitsRes.value.data.visits));
      }
    } catch (err) {
      console.warn('API /firms or /visits failed, relying on localStorage cache.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Form submission wiring for onboarding
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Firm / Shop Name is mandatory.');
      return;
    }

    setLoading(true);

    const newFirmId = 'firm_' + Date.now();
    const nowISO = new Date().toISOString();

    const newFirmObj = {
      id: newFirmId,
      exec_id: user?.userId || user?.user_id,
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      gstin: gstin.trim() ? gstin.trim().toUpperCase() : 'URP-' + Math.floor(100000 + Math.random() * 900000),
      address: address.trim() || 'General Market Area, Ranchi',
      brands_handled: brandsHandled.trim(),
      prices: {
        purchase: parseFloat(purchasePrice) || 0,
        retail: parseFloat(retailPrice) || 0,
        wholesale: parseFloat(wholesalePrice) || 0
      },
      location: {
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        accuracy: gpsAccuracy || 10,
        capturedAt: nowISO
      },
      photo: photoPreview || photo || '',
      timestamp: nowISO,
      createdAt: nowISO
    };

    const updatedFirms = [newFirmObj, ...firms];
    setFirms(updatedFirms);
    localStorage.setItem('onboarded_firms', JSON.stringify(updatedFirms));

    try {
      const res = await api.post('/firms', newFirmObj);
      if (res.data?.firm) {
        const serverUpdated = [res.data.firm, ...firms.filter(f => f.id !== newFirmId)];
        setFirms(serverUpdated);
        localStorage.setItem('onboarded_firms', JSON.stringify(serverUpdated));
      }
      setSuccessMsg(`"${name.trim()}" onboarded successfully into the Directory!`);
    } catch (err) {
      console.warn('Backend /firms API offline, maintained in local storage.');
      setSuccessMsg(`"${name.trim()}" onboarded locally (Offline/Cached).`);
    } finally {
      setName('');
      setContactPerson('');
      setPhone('');
      setGstin('');
      setAddress('');
      setPhoto('');
      setPhotoPreview('');
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActiveTab('directory');
    }
  };

  // Open Edit Modal with prefilled values
  const handleOpenEdit = (firm) => {
    setEditingFirm(firm);
    setEditFormData({
      name: firm.name || '',
      contactPerson: firm.contact_person || firm.contactPerson || '',
      phone: firm.phone || '',
      gstin: firm.gstin || '',
      upiId: firm.upiId || firm.upi_id || 'sundarammahadeo@icici',
      address: firm.address || '',
      brandsHandled: firm.brands_handled || (Array.isArray(firm.brands) ? firm.brands.join(', ') : ''),
      purchasePrice: firm.prices?.purchase || firm.purchasePrice || '',
      retailPrice: firm.prices?.retail || firm.retailPrice || '',
      wholesalePrice: firm.prices?.wholesale || firm.wholesalePrice || '',
      lat: firm.location?.lat || 23.3441,
      lng: firm.location?.lng || 85.3096
    });
  };

  // Save Edit to Server & Local State
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingFirm) return;
    setIsSavingEdit(true);
    setErrorMsg('');

    const updatedFirmData = {
      name: editFormData.name.trim(),
      contact_person: editFormData.contactPerson.trim(),
      phone: editFormData.phone.trim(),
      gstin: editFormData.gstin.trim(),
      upiId: (editFormData.upiId || 'sundarammahadeo@icici').trim().toLowerCase(),
      address: editFormData.address.trim(),
      brands_handled: editFormData.brandsHandled.trim(),
      prices: {
        purchase: parseFloat(editFormData.purchasePrice) || 0,
        retail: parseFloat(editFormData.retailPrice) || 0,
        wholesale: parseFloat(editFormData.wholesalePrice) || 0
      },
      location: {
        lat: parseFloat(editFormData.lat) || 23.3441,
        lng: parseFloat(editFormData.lng) || 85.3096
      }
    };

    try {
      const res = await api.put(`/firms/${editingFirm.id}`, updatedFirmData);
      const saved = res.data?.firm || { ...editingFirm, ...updatedFirmData };

      const updatedList = firms.map(f => f.id === editingFirm.id ? saved : f);
      setFirms(updatedList);
      localStorage.setItem('onboarded_firms', JSON.stringify(updatedList));

      setSuccessMsg(`Firm "${saved.name}" updated successfully.`);
      setEditingFirm(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update firm:', err);
      const errorDetail = err.response?.data?.error || 'Failed to update firm.';
      setErrorMsg(errorDetail);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingFirm) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      await api.delete(`/firms/${deletingFirm.id}`);
      const updatedList = firms.filter(f => f.id !== deletingFirm.id);
      setFirms(updatedList);
      localStorage.setItem('onboarded_firms', JSON.stringify(updatedList));

      setSuccessMsg(`Firm "${deletingFirm.name}" was permanently removed.`);
      setDeletingFirm(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete firm:', err);
      const errorDetail = err.response?.data?.error || 'Failed to delete firm.';
      setErrorMsg(errorDetail);
    } finally {
      setIsDeleting(false);
    }
  };

  // Direct Settlement Submission
  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settlementModalFirm || !settlementAmount || parseFloat(settlementAmount) <= 0) {
      setErrorMsg('Please enter a valid positive payment amount.');
      return;
    }

    setIsSettling(true);
    const amountVal = parseFloat(settlementAmount);
    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];

    const settleRecord = {
      id: 'settle_' + Date.now(),
      exec_id: user?.userId || 'admin',
      userId: user?.userId || 'admin',
      firmName: settlementModalFirm.name,
      purpose: 'Payment Collection',
      product: 'Dues Settlement',
      quantity: 0,
      unit: 'N/A',
      bagIncentive: 0,
      orderValue: 0,
      collectedAmount: amountVal,
      paymentMode: settlementMode,
      txnId: settlementTxnId || `SETTLE-${Date.now().toString().slice(-6)}`,
      paymentDate: todayStr,
      notes: settlementNotes || `Admin payment settlement for ${settlementModalFirm.name}`,
      location: { lat: 23.3441, lng: 85.3096 },
      status: 'VERIFIED',
      timestamp: nowISO,
      createdAt: nowISO
    };

    const updatedVisits = [settleRecord, ...allVisits];
    setAllVisits(updatedVisits);
    localStorage.setItem('user_visits', JSON.stringify(updatedVisits));

    try {
      await api.post('/payments/settle', {
        firmName: settlementModalFirm.name,
        amount: amountVal,
        paymentMode: settlementMode,
        txnId: settlementTxnId,
        paymentDate: todayStr,
        notes: settlementNotes
      });
      setSuccessMsg(`Payment of ₹${amountVal.toLocaleString('en-IN')} recorded for ${settlementModalFirm.name}!`);
    } catch (err) {
      console.warn('API /payments/settle notice:', err.message);
      setSuccessMsg(`Payment of ₹${amountVal.toLocaleString('en-IN')} recorded locally.`);
    } finally {
      setIsSettling(false);
      setSettlementModalFirm(null);
      setSettlementAmount('');
      setSettlementTxnId('');
      setSettlementNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Filtered firms for directory search
  const filteredFirms = firms.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.contactPerson || '').toLowerCase().includes(q) ||
      (f.address || '').toLowerCase().includes(q) ||
      (f.gstin || '').toLowerCase().includes(q) ||
      (f.brands_handled || '').toLowerCase().includes(q)
    );
  });

  // Sales Orders (Visits with billed orders or product sales)
  const salesOrders = allVisits.filter(v => {
    const isOrder = (v.orderValue && parseFloat(v.orderValue) > 0) || (v.quantity && parseFloat(v.quantity) > 0);
    if (!isOrder) return false;

    if (selectedFirmFilter !== 'ALL') {
      const matchFirm = (v.firmName || '').toLowerCase() === selectedFirmFilter.toLowerCase();
      if (!matchFirm) return false;
    }
    if (dateFilter) {
      const vDate = (v.paymentDate || v.timestamp || '').split('T')[0];
      if (vDate !== dateFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (v.firmName || '').toLowerCase().includes(q) ||
                        (v.product || '').toLowerCase().includes(q) ||
                        (v.notes || '').toLowerCase().includes(q);
      if (!matchText) return false;
    }
    return true;
  });

  // Payment Collections (Visits with collected amounts)
  const paymentCollections = allVisits.filter(v => {
    const isCollection = v.collectedAmount && parseFloat(v.collectedAmount) > 0;
    if (!isCollection) return false;

    if (selectedFirmFilter !== 'ALL') {
      const matchFirm = (v.firmName || '').toLowerCase() === selectedFirmFilter.toLowerCase();
      if (!matchFirm) return false;
    }
    if (paymentModeFilter !== 'ALL') {
      if ((v.paymentMode || '').toUpperCase() !== paymentModeFilter.toUpperCase()) return false;
    }
    if (dateFilter) {
      const vDate = (v.paymentDate || v.timestamp || '').split('T')[0];
      if (vDate !== dateFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (v.firmName || '').toLowerCase().includes(q) ||
                        (v.paymentMode || '').toLowerCase().includes(q) ||
                        (v.txnId || '').toLowerCase().includes(q) ||
                        (v.notes || '').toLowerCase().includes(q);
      if (!matchText) return false;
    }
    return true;
  });

  // Metrics aggregation across all visits
  const totalBilledValue = allVisits.reduce((sum, v) => sum + (parseFloat(v.orderValue) || 0), 0);
  const totalCollectedAmount = allVisits.reduce((sum, v) => sum + (parseFloat(v.collectedAmount) || 0), 0);
  const totalLiftingVolume = allVisits.reduce((sum, v) => sum + (parseFloat(v.quantity) || 0), 0);
  const netOutstandingBalance = totalBilledValue - totalCollectedAmount;

  // Single-Date Lifting History Calculation for modal
  const getFirmLiftingHistory = (firmName, targetDate) => {
    if (!firmName) return [];
    return allVisits.filter(v => {
      const matchFirm = (v.firmName || '').toLowerCase().includes(firmName.toLowerCase()) ||
                        firmName.toLowerCase().includes((v.firmName || '').toLowerCase());
      if (!matchFirm) return false;

      if (!targetDate) return true;
      const vDate = (v.paymentDate || v.timestamp || v.createdAt || '').split('T')[0];
      return vDate === targetDate;
    });
  };

  const selectedFirmHistory = selectedFirmForHistory 
    ? getFirmLiftingHistory(selectedFirmForHistory.name, historyFilterDate)
    : [];

  const totalHistoryLiftingQty = selectedFirmHistory.reduce((sum, h) => sum + (parseFloat(h.quantity) || 0), 0);
  const totalHistoryBilling = selectedFirmHistory.reduce((sum, h) => sum + (parseFloat(h.orderValue) || 0), 0);
  const totalHistoryCollected = selectedFirmHistory.reduce((sum, h) => sum + (parseFloat(h.collectedAmount) || 0), 0);

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'directory' || activeTab === 'onboard') {
      csvContent += 'Firm Name,Contact Person,Phone,GSTIN,Address,Brands Handled,Purchase Price,Retail Price,Wholesale Price\n';
      firms.forEach(f => {
        csvContent += `"${f.name || ''}","${f.contactPerson || ''}","${f.phone || ''}","${f.gstin || ''}","${f.address || ''}","${f.brands_handled || ''}",${f.prices?.purchase || 0},${f.prices?.retail || 0},${f.prices?.wholesale || 0}\n`;
      });
    } else if (activeTab === 'sales_orders') {
      csvContent += 'Date,Firm Name,Product,Quantity,Unit,Order Value (INR),Executive ID,Notes\n';
      salesOrders.forEach(s => {
        csvContent += `"${(s.paymentDate || s.timestamp || '').split('T')[0]}","${s.firmName || ''}","${s.product || ''}",${s.quantity || 0},"${s.unit || 'Bags'}",${s.orderValue || 0},"${s.exec_id || s.userId || ''}","${s.notes || ''}"\n`;
      });
    } else {
      csvContent += 'Date,Firm Name,Collected Amount (INR),Payment Mode,Transaction ID,Executive ID,Notes\n';
      paymentCollections.forEach(c => {
        csvContent += `"${(c.paymentDate || c.timestamp || '').split('T')[0]}","${c.firmName || ''}",${c.collectedAmount || 0},"${c.paymentMode || ''}","${c.txnId || ''}","${c.exec_id || c.userId || ''}","${c.notes || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SMM_${activeTab.toUpperCase()}_EXPORT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Building2 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                Sundaram Mahadeo Group • Admin Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Firm Directory & Financial Ledger
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-xl">
            Comprehensive catalog of registered group firms, client establishments, dealer price intelligence, sales order logs, and payment collection records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchFirmsAndVisits}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-400' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* TOP FINANCIAL METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Firms</span>
            <Store size={16} className="text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{firms.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Onboarded dealers & units</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Billed Sales</span>
            <ArrowUpRight size={16} className="text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-700">₹{totalBilledValue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{totalLiftingVolume} Bags / Units Lifted</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Collections</span>
            <ArrowDownLeft size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700">₹{totalCollectedAmount.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{paymentCollections.length} Verified Receipts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Net Outstanding</span>
            <Wallet size={16} className="text-amber-600" />
          </div>
          <p className={`text-xl sm:text-2xl font-black ${netOutstandingBalance > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
            ₹{netOutstandingBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dues & credit balances</p>
        </div>
      </div>

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

      {/* NAVIGATION PILL TABS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'directory' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Store size={15} />
          <span>Firms Directory ({firms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'sales_orders' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShoppingBag size={15} />
          <span>Sales & Lifting Logs ({salesOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
            activeTab === 'collections' 
              ? 'bg-white text-emerald-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <CreditCard size={15} />
          <span>Payment Collections ({paymentCollections.length})</span>
        </button>

        {!isExecutiveAssistant && (
          <button
            onClick={() => setActiveTab('onboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === 'onboard' 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <PlusCircle size={15} />
            <span>+ Onboard New Firm</span>
          </button>
        )}
      </div>

      {isExecutiveAssistant && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs flex items-center gap-2 font-medium">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
          <span>Executive Assistant View: You have complete read-only visibility into dealer records, financial ledgers, and lifting logs. Firm creation and financial settlement edits are restricted to Administrators.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FIRMS DIRECTORY CATALOG                                            */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Sundaram Mahadeo Group & Dealers Catalog</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                  {filteredFirms.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Searchable shop directory with GPS coordinates, pricing, and single-date lifting histories
              </p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search firm, GSTIN, brand, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {filteredFirms.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
                <Store size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {firms.length === 0
                  ? 'No firms onboarded yet.'
                  : 'No matching firms found for your search query.'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {firms.length === 0
                  ? 'Click "+ Onboard New Firm" above to register firms and dealers.'
                  : 'Try modifying your search keywords or clear the search field to see all shops.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFirms.map((firm) => {
                const lat = firm.location?.lat || 23.3441;
                const lng = firm.location?.lng || 85.3096;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

                // Aggregate orders and collections for this firm
                const firmOrders = allVisits.filter(v => 
                  (v.firmName || '').toLowerCase() === (firm.name || '').toLowerCase()
                );
                const firmBilledTotal = firmOrders.reduce((sum, v) => sum + (parseFloat(v.orderValue) || 0), 0);
                const firmCollTotal = firmOrders.reduce((sum, v) => sum + (parseFloat(v.collectedAmount) || 0), 0);
                const firmBalance = firmBilledTotal - firmCollTotal;

                return (
                  <div
                    key={firm.id || firm.name}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{firm.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          {firm.address || 'Market Location, Ranchi'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {firm.gstin || 'URP'}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Contact Person</p>
                        <p className="font-semibold text-slate-800">{firm.contactPerson || 'Proprietor'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                        <p className="font-semibold text-slate-800">{firm.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Financial Balance Summary Chip */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Total Billed</span>
                        <p className="font-bold text-slate-800">₹{firmBilledTotal.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Collected</span>
                        <p className="font-bold text-emerald-700">₹{firmCollTotal.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Outstanding</span>
                        <p className={`font-bold ${firmBalance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                          ₹{firmBalance.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Admin-Configured Beneficiary UPI ID */}
                    <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-950 font-medium">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-mono text-[11px] font-bold">
                          UPI VPA: {firm.upiId || firm.upi_id || 'sundarammahadeo@icici'}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                        <Lock size={10} />
                        Admin Set
                      </span>
                    </div>

                    {/* GPS Pin & Map Coordinates */}
                    <div className="flex items-center justify-between bg-blue-50/40 p-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={13} className="text-rose-500" />
                        <span className="font-mono text-[11px]">GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View on Map <ExternalLink size={11} />
                      </a>
                    </div>

                    {firm.brands_handled && (
                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-700">Brands:</span> {firm.brands_handled}
                      </p>
                    )}

                    {/* Brand Pricing Intel */}
                    {firm.prices && (
                      <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between text-[11px] text-slate-700 font-semibold border border-slate-100">
                        <span>Pur: ₹{firm.prices.purchase || 0}</span>
                        <span>Ret: ₹{firm.prices.retail || 0}</span>
                        <span>Wholesale: ₹{firm.prices.wholesale || 0}</span>
                      </div>
                    )}

                    {/* ACTION BUTTONS: Single-Date Lifting History, Record Settlement, Edit & Delete */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedFirmForHistory(firm);
                          setHistoryFilterDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="flex-1 min-w-[100px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-2 rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-blue-200"
                        title="View single-date lifting ledger"
                      >
                        <History size={13} />
                        Lifting History
                      </button>

                      {!isExecutiveAssistant && (
                        <>
                          <button
                            onClick={() => setSettlementModalFirm(firm)}
                            className="flex-1 min-w-[100px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-2 rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-emerald-200"
                            title="Record dues settlement"
                          >
                            <CreditCard size={13} />
                            Settle
                          </button>
                          <button
                            onClick={() => handleOpenEdit(firm)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-amber-200"
                            title="Admin Edit Firm Details & Pricing"
                          >
                            <Edit3 size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingFirm(firm)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-rose-200"
                            title="Admin Delete Firm"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALES ORDERS & LIFTING LEDGER                                      */}
      {/* ========================================================================= */}
      {activeTab === 'sales_orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Booked Sales Orders & Lifting Records</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                  {salesOrders.length} records
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Chronological ledger of material orders, quantities lifted, and order values
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedFirmFilter}
                onChange={(e) => setSelectedFirmFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Firms</option>
                {firms.map(f => (
                  <option key={f.id || f.name} value={f.name}>{f.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {salesOrders.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
              <ShoppingBag size={28} className="text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No sales orders found</h4>
              <p className="text-xs text-slate-500">
                Log visits with booked quantities to populate the sales orders ledger.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3.5">Date / Time</th>
                      <th className="p-3.5">Firm / Shop</th>
                      <th className="p-3.5">Product Ordered</th>
                      <th className="p-3.5 text-right">Lifting Qty</th>
                      <th className="p-3.5 text-right">Billed Value</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesOrders.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {(item.paymentDate || item.timestamp || '').split('T')[0]}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.firmName}
                          {item.notes && <p className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-xs">{item.notes}</p>}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {item.product || 'Materials'}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {item.quantity || 0} {item.unit || 'Bags'}
                        </td>
                        <td className="p-3.5 text-right font-black text-blue-700 whitespace-nowrap">
                          ₹{(item.orderValue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                            {item.status || 'VERIFIED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT COLLECTIONS & RECEIPTS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Payment Collections & Verified Receipts</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                  {paymentCollections.length} receipts
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Verified payment collections via Cash, UPI, Cheque, and Bank Transfer
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI / Online">UPI / Online</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer / NEFT">Bank Transfer</option>
              </select>

              <select
                value={selectedFirmFilter}
                onChange={(e) => setSelectedFirmFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Firms</option>
                {firms.map(f => (
                  <option key={f.id || f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {paymentCollections.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
              <CreditCard size={28} className="text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No payment collections found</h4>
              <p className="text-xs text-slate-500">
                Payment collections logged by executives or recorded via dues settlement appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Firm / Shop</th>
                      <th className="p-3.5 text-right">Amount Collected</th>
                      <th className="p-3.5">Payment Mode</th>
                      <th className="p-3.5">Txn / Ref ID</th>
                      <th className="p-3.5">Executive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentCollections.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {(item.paymentDate || item.timestamp || '').split('T')[0]}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.firmName}
                          {item.notes && <p className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-xs">{item.notes}</p>}
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-700 whitespace-nowrap">
                          ₹{(item.collectedAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            {item.paymentMode || 'Cash'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                          {item.txnId || 'N/A'}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {item.exec_id || item.userId || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ONBOARD NEW FIRM FORM                                              */}
      {/* ========================================================================= */}
      {activeTab === 'onboard' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                <PlusCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Onboard New Firm / Dealer</h3>
                <p className="text-xs text-slate-500">
                  Register Sundaram Mahadeo Group entities, dealers, and hardware establishments
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setName('SMST - Sundaram Mahadeo Steels (Reference Unit)');
                setContactPerson('Rajesh Sharma (Manager)');
                setPhone('9876543210');
                setGstin('20AABCS1234F1Z1');
                setAddress('Industrial Hub, Plot 42, Kokar, Ranchi');
                setBrandsHandled('Tata Tiscon, UltraTech Super, ACC Gold');
                setPurchasePrice('325');
                setRetailPrice('360');
                setWholesalePrice('340');
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Tag size={13} />
              Fill Reference Store (Test Data)
            </button>
          </div>

          <form onSubmit={handleOnboardSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Firm / Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahadeo Hardware & Steels"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Person / Proprietor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amit Kumar Agarwal"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Phone / Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9835012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  GSTIN / Tax Identification
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20AABCS1234F1Z1 (or leave blank if URP)"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Physical Shop Address / Market Territory
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Main Road, Near Overbridge, Kadru, Ranchi, Jharkhand - 834002"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* LIVE GPS GEOLOCATION & GEOFENCE BASELINE */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-slate-50 to-blue-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/90 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/70">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Navigation size={18} className={isCapturingGps ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Authoritative GPS Geotag</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Geofence Anchor
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Coordinates used to automatically cross-check executives when they log visits to this firm
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => captureLiveGpsLocation(true)}
                  disabled={isCapturingGps}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
                >
                  <RefreshCw size={13} className={isCapturingGps ? 'animate-spin' : ''} />
                  {isCapturingGps ? 'Capturing...' : 'Capture Current Location'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <div className="flex items-center gap-2">
                    <Crosshair size={14} className="text-emerald-600 shrink-0" />
                    <input
                      type="number"
                      step="any"
                      value={gpsCoords.lat}
                      onChange={(e) => setGpsCoords(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <div className="flex items-center gap-2">
                    <Compass size={14} className="text-emerald-600 shrink-0" />
                    <input
                      type="number"
                      step="any"
                      value={gpsCoords.lng}
                      onChange={(e) => setGpsCoords(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Accuracy & Maps
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      {gpsAccuracy !== null ? `±${gpsAccuracy}m` : 'Ready'}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 underline"
                    >
                      View Map <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Key Brands Handled
              </label>
              <input
                type="text"
                placeholder="e.g. UltraTech, Tata Tiscon, ACC, Jindal Panther"
                value={brandsHandled}
                onChange={(e) => setBrandsHandled(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Price intelligence */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Brand Price Benchmark (₹ per unit/bag)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Retail Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Wholesale Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo capture */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Storefront / Dealership Photo
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-2">
                  <Camera size={16} className="text-slate-500" />
                  <span>Choose / Capture Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300">
                    <img src={photoPreview} alt="Shop Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhoto(''); setPhotoPreview(''); }}
                      className="absolute top-0.5 right-0.5 bg-slate-900/80 text-white rounded-full p-0.5 text-[10px]"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base mt-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Store size={18} />}
              Onboard Firm & Register in Directory
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE-DATE LIFTING HISTORY MODAL                                         */}
      {/* ========================================================================= */}
      {selectedFirmForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  Lifting History Tracker
                </span>
                <h3 className="text-lg font-black text-white mt-1">{selectedFirmForHistory.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {selectedFirmForHistory.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedFirmForHistory(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                &times;
              </button>
            </div>

            {/* Date Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Lifting Date:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={historyFilterDate}
                  onChange={(e) => setHistoryFilterDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setHistoryFilterDate('')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  All Dates
                </button>
              </div>
            </div>

            {/* Metrics Summary for Selected Date */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50/40 border-b border-slate-100 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Lifting Qty</p>
                <p className="text-sm sm:text-base font-black text-slate-900">{totalHistoryLiftingQty} Units</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Billed Orders</p>
                <p className="text-sm sm:text-base font-black text-blue-700">₹{totalHistoryBilling.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Collected</p>
                <p className="text-sm sm:text-base font-black text-emerald-700">₹{totalHistoryCollected.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Lifting Records List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {selectedFirmHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <ShoppingBag size={32} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    No lifting or order records found for {historyFilterDate ? `date ${historyFilterDate}` : 'this firm'}.
                  </p>
                  <p className="text-xs text-slate-400">
                    Log new visits with booked orders to populate single-date lifting histories.
                  </p>
                </div>
              ) : (
                selectedFirmHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.product || 'Product Order'} ({item.quantity || 0} {item.unit || 'Bags'})
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {(item.paymentDate || item.timestamp || '').split('T')[0]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Billing Value:</span>
                        <p className="font-bold text-slate-900">₹{(item.orderValue || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Paid ({item.paymentMode || 'Cash'}):</span>
                        <p className="font-bold text-emerald-700">₹{(item.collectedAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {item.txnId && (
                      <p className="text-[10px] font-mono text-slate-500">
                        Txn / Ref ID: {item.txnId}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-600 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedFirmForHistory(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIRECT DUES SETTLEMENT MODAL                                              */}
      {/* ========================================================================= */}
      {settlementModalFirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Payment Collection / Settlement</span>
                <h4 className="text-base font-black text-white">{settlementModalFirm.name}</h4>
              </div>
              <button onClick={() => setSettlementModalFirm(null)} className="text-slate-400 hover:text-white text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Settlement Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={settlementMode}
                  onChange={(e) => setSettlementMode(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Google Pay</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT / RTGS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transaction / Cheque / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 or CHQ-998822"
                  value={settlementTxnId}
                  onChange={(e) => setSettlementTxnId(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared bill dated 15th Aug"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full px-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlementModalFirm(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isSettling ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADMIN EDIT FIRM MODAL                                           */}
      {/* ========================================================================= */}
      {editingFirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Admin Master Privilege
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-600" />
                  Edit Firm: {editingFirm.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingFirm(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData?.name ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editFormData?.contactPerson ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData?.phone ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editFormData?.gstin ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    placeholder="20AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brands Handled</label>
                  <input
                    type="text"
                    value={editFormData?.brandsHandled ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, brandsHandled: e.target.value })}
                    placeholder="e.g. Tata Tiscon, UltraTech, ACC"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* ADMIN ONLY: Beneficiary UPI ID */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1">
                    <KeyRound size={13} className="text-emerald-700" />
                    <span>Firm Beneficiary UPI ID (Admin Controlled) *</span>
                  </label>
                  <span className="text-[9px] uppercase tracking-wider font-black text-emerald-900 bg-emerald-200/90 px-1.5 py-0.5 rounded border border-emerald-300">
                    Admin Exclusive
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. smst@icici or 9835012345@paytm"
                  value={editFormData?.upiId ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, upiId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                />
                <p className="text-[10px] text-emerald-800 font-medium">
                  Dealers and field staff will generate payment QR codes exclusively directing funds to this verified VPA.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Yard Full Address</label>
                <textarea
                  rows={2}
                  value={editFormData?.address ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-2">
                <p className="text-xs font-bold text-amber-900">Dealer Pricing Matrix (₹ per unit)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Purchase (₹)</label>
                    <input
                      type="number"
                      value={editFormData?.purchasePrice ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Retail (₹)</label>
                    <input
                      type="number"
                      value={editFormData?.retailPrice ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, retailPrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Wholesale (₹)</label>
                    <input
                      type="number"
                      value={editFormData?.wholesalePrice ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, wholesalePrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={13} className="text-rose-500" />
                  GPS Geolocation Coordinates
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData?.lat ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, lat: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData?.lng ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, lng: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFirm(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isSavingEdit ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Firm Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADMIN DELETE FIRM CONFIRMATION                                  */}
      {/* ========================================================================= */}
      {deletingFirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 text-center">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
              Admin Action
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Delete Firm Permanently?</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6">
              Are you sure you want to delete <strong className="text-slate-900 font-bold">"{deletingFirm.name}"</strong>? This will remove the firm record from the Directory. Executive accounts will not be able to log new visits against this firm.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingFirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
