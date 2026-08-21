import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, PlusCircle, Camera, MapPin, Store, IndianRupee, 
  Clock, FileText, AlertCircle, RefreshCw, Layers, Check, ShoppingBag, 
  CreditCard, Edit3, Trash2, X, Calendar, Calculator, ShieldAlert, Sparkles,
  Truck, ArrowRight, UserCheck, MessageSquare, HelpCircle, Navigation,
  Crosshair, ShieldCheck, AlertTriangle, ExternalLink, Target
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Haversine distance calculator in meters between two GPS coordinates
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null || 
      lat2 === undefined || lat2 === null || lon2 === undefined || lon2 === null) {
    return null;
  }
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371e3; // Earth radius in meters
  const φ1 = (numLat1 * Math.PI) / 180;
  const φ2 = (numLat2 * Math.PI) / 180;
  const Δφ = ((numLat2 - numLat1) * Math.PI) / 180;
  const Δλ = ((numLon2 - numLon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Product incentive rate mapping with default pricing per unit
const PRODUCT_INCENTIVE_RATES = {
  'Cement (UltraTech / ACC)': { unit: 'Bags', rate: 10, defaultPricePerUnit: 336 },
  'TMT Steel (Tata Tiscon / Jindal)': { unit: 'MT', rate: 50, defaultPricePerUnit: 62000 },
  'Pipes & Fittings': { unit: 'Pcs', rate: 10, defaultPricePerUnit: 1200 },
  'Sand & Aggregates': { unit: 'CFT', rate: 2, defaultPricePerUnit: 48 },
  'Bricks & Blocks': { unit: 'Pcs', rate: 1, defaultPricePerUnit: 70 },
  'Structural Steel': { unit: 'MT', rate: 45, defaultPricePerUnit: 58000 },
  'Paints & Finishes': { unit: 'Pcs', rate: 15, defaultPricePerUnit: 2400 }
};

export default function VisitLogger({ user }) {
  // 1. LOCAL STORAGE & INITIAL STATE FALLBACK
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

  // Base Form State
  const [editingVisitId, setEditingVisitId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('Sales'); // 'Sales' | 'Payment Collection' | 'Follow-up' | 'Support' | 'Onboarding'

  // CONDITIONAL SECTION 1: Sales Inputs
  const [productName, setProductName] = useState('Cement (UltraTech / ACC)');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [deliveryType, setDeliveryType] = useState('Site Delivery / Dispatched');
  const [billingAmount, setBillingAmount] = useState('');
  const [autoCalcBilling, setAutoCalcBilling] = useState(true);

  // CONDITIONAL SECTION 2: Payment Collection Inputs
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // NEFT, UPI, Bank Transfer, Cheque, Cash Deposit
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionId, setTxnId] = useState('');

  // CONDITIONAL SECTION 3: Follow-up / Support / Onboarding Inputs
  const [discussionTopic, setDiscussionTopic] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // Common Additional Inputs
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ lat: 23.3441, lng: 85.3096 });
  const [isGpsLocating, setIsGpsLocating] = useState(false);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Proximity & Geofence cross-check computations
  const matchedFirm = useMemo(() => {
    if (!clientName.trim()) return null;
    const q = clientName.trim().toLowerCase();
    return firmsList.find(f => (f.name || '').trim().toLowerCase() === q) ||
           firmsList.find(f => (f.name || '').toLowerCase().includes(q));
  }, [clientName, firmsList]);

  const distanceToMatchedFirm = useMemo(() => {
    if (!matchedFirm?.location?.lat || !matchedFirm?.location?.lng || !gpsLocation?.lat || !gpsLocation?.lng) {
      return null;
    }
    return calculateDistanceMeters(gpsLocation.lat, gpsLocation.lng, matchedFirm.location.lat, matchedFirm.location.lng);
  }, [matchedFirm, gpsLocation]);

  const nearbyFirms = useMemo(() => {
    if (!gpsLocation?.lat || !gpsLocation?.lng || firmsList.length === 0) return [];
    return firmsList
      .map(f => {
        if (!f.location?.lat || !f.location?.lng) return null;
        const d = calculateDistanceMeters(gpsLocation.lat, gpsLocation.lng, f.location.lat, f.location.lng);
        return d !== null ? { ...f, distanceMeters: d } : null;
      })
      .filter(f => f && f.distanceMeters <= 500)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [firmsList, gpsLocation]);

  const closestNearbyFirm = nearbyFirms.length > 0 ? nearbyFirms[0] : null;

  // Fetch initial visits, firms, and GPS on mount
  useEffect(() => {
    fetchVisitsAndFirms();
    captureCurrentGps();
  }, []);

  const captureCurrentGps = () => {
    if (navigator.geolocation) {
      setIsGpsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          });
          setIsGpsLocating(false);
        },
        (err) => {
          console.warn('GPS location fetch fallback:', err.message);
          setIsGpsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  };

  const fetchVisitsAndFirms = async () => {
    try {
      const [visitsRes, firmsRes] = await Promise.allSettled([
        api.get('/visits'),
        api.get('/firms')
      ]);

      if (visitsRes.status === 'fulfilled' && Array.isArray(visitsRes.value.data?.visits)) {
        const serverVisits = visitsRes.value.data.visits;
        setVisits(serverVisits);
        localStorage.setItem('user_visits', JSON.stringify(serverVisits));
      }

      if (firmsRes.status === 'fulfilled' && Array.isArray(firmsRes.value.data?.firms)) {
        const serverFirms = firmsRes.value.data.firms;
        setFirmsList(serverFirms);
        localStorage.setItem('onboarded_firms', JSON.stringify(serverFirms));
      }
    } catch (err) {
      console.warn('API error fetching visits/firms, utilizing local storage cache.');
    }
  };

  // Product change handler
  const handleProductChange = (prod) => {
    setProductName(prod);
    const prodConfig = PRODUCT_INCENTIVE_RATES[prod];
    if (prodConfig) {
      setUnit(prodConfig.unit);
      if (quantity && autoCalcBilling) {
        const estAmount = parseFloat(quantity) * prodConfig.defaultPricePerUnit;
        setBillingAmount(estAmount ? estAmount.toString() : '');
      }
    }
  };

  // Quantity change handler with automatic billing calculation
  const handleQuantityChange = (val) => {
    setQuantity(val);
    if (autoCalcBilling && val) {
      const prodConfig = PRODUCT_INCENTIVE_RATES[productName];
      const rate = prodConfig ? prodConfig.defaultPricePerUnit : (unit === 'Bags' ? 336 : 1000);
      const estAmount = parseFloat(val) * rate;
      setBillingAmount(estAmount ? estAmount.toString() : '');
    }
  };

  // Real-time incentive calculation for Sales
  const activeProductKey = productName === 'Other' ? customProductName : productName;
  const currentRate = PRODUCT_INCENTIVE_RATES[productName]?.rate || (unit === 'MT' ? 50 : unit === 'Bags' ? 10 : 5);
  const numQty = parseFloat(quantity) || 0;
  const calculatedIncentive = visitPurpose === 'Sales' ? (numQty * currentRate) : 0;

  // Handle Photo Capture
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Start Edit Mode for an existing visit
  const handleStartEdit = (visit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const visitDate = (visit.paymentDate || visit.transactionDate || visit.timestamp || visit.createdAt || '').split('T')[0];

    if (visitDate !== todayStr && user?.role !== 'ADMIN') {
      setErrorMsg('Policy: Only today\'s visit logs can be edited.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setEditingVisitId(visit.id);
    setClientName(visit.clientName || visit.firmName || '');
    
    // Normalize visit purpose
    const p = visit.visitPurpose || visit.purpose || 'Sales';
    if (p.includes('Sales') || p.includes('Order')) setVisitPurpose('Sales');
    else if (p.includes('Payment')) setVisitPurpose('Payment Collection');
    else if (p.includes('Follow')) setVisitPurpose('Follow-up');
    else if (p.includes('Support')) setVisitPurpose('Support');
    else if (p.includes('Onboard')) setVisitPurpose('Onboarding');
    else setVisitPurpose(p);

    // Sales fields
    const existingProd = visit.productName || visit.product || 'Cement (UltraTech / ACC)';
    if (PRODUCT_INCENTIVE_RATES[existingProd]) {
      setProductName(existingProd);
    } else {
      setProductName('Other');
      setCustomProductName(existingProd);
    }
    setQuantity(visit.quantity ? visit.quantity.toString() : '');
    setUnit(visit.unit || 'Bags');
    setDeliveryType(visit.deliveryType || 'Site Delivery / Dispatched');
    setBillingAmount(visit.billingAmount ? visit.billingAmount.toString() : (visit.orderValue ? visit.orderValue.toString() : ''));
    setAutoCalcBilling(false);

    // Payment fields
    setPaymentMethod(visit.paymentMethod || visit.paymentMode || 'UPI');
    setTransactionAmount(visit.transactionAmount ? visit.transactionAmount.toString() : (visit.collectedAmount ? visit.collectedAmount.toString() : ''));
    setTransactionDate(visit.transactionDate || visit.paymentDate || todayStr);
    setTxnId(visit.transactionId || visit.txnId || '');

    // Follow-up fields
    setDiscussionTopic(visit.discussionTopic || '');
    setNextFollowUpDate(visit.nextFollowUpDate || '');

    // Common
    setNote(visit.note || visit.notes || '');
    setPhoto(visit.photo || '');
    setPhotoPreview(visit.photo || '');
    if (visit.location) setGpsLocation(visit.location);

    // Scroll smoothly to form top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingVisitId(null);
    resetFormFields();
  };

  // State isolation handler: clears purpose-specific inputs when switching modes
  const handlePurposeChange = (newPurpose) => {
    setVisitPurpose(newPurpose);
    if (!editingVisitId) {
      if (newPurpose === 'Sales') {
        setTransactionAmount('');
        setTxnId('');
        setDiscussionTopic('');
        setNextFollowUpDate('');
      } else if (newPurpose === 'Payment Collection') {
        setQuantity('');
        setBillingAmount('');
        setDiscussionTopic('');
        setNextFollowUpDate('');
      } else {
        setQuantity('');
        setBillingAmount('');
        setTransactionAmount('');
        setTxnId('');
      }
    }
  };

  const resetFormFields = () => {
    setClientName('');
    setVisitPurpose('Sales');
    setProductName('Cement (UltraTech / ACC)');
    setCustomProductName('');
    setQuantity('');
    setUnit('Bags');
    setDeliveryType('Site Delivery / Dispatched');
    setBillingAmount('');
    setAutoCalcBilling(true);
    setPaymentMethod('UPI');
    setTransactionAmount('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTxnId('');
    setDiscussionTopic('');
    setNextFollowUpDate('');
    setNote('');
    setPhoto('');
    setPhotoPreview('');
  };

  // Submit Visit Log Handler (New or Edit)
  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Please specify the Client / Firm Name.');
      return;
    }

    setLoading(true);

    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];
    const finalProdName = productName === 'Other' ? (customProductName.trim() || 'Custom Product') : productName;
    const parsedBilling = parseFloat(billingAmount) || 0;
    const parsedTxnAmount = parseFloat(transactionAmount) || 0;

    // Compute authoritative Geofence Cross-Check status
    let geofenceStatus = 'UNREGISTERED_LOCATION';
    let distanceFromFirm = null;
    if (matchedFirm && distanceToMatchedFirm !== null) {
      distanceFromFirm = distanceToMatchedFirm;
      if (distanceToMatchedFirm <= 250) {
        geofenceStatus = 'VERIFIED_ON_SITE';
      } else if (distanceToMatchedFirm <= 1500) {
        geofenceStatus = 'VICINITY';
      } else {
        geofenceStatus = 'DISCREPANCY';
      }
    }

    // Construct conditional specific payload based on visitPurpose
    let payload = {
      clientName: clientName.trim(),
      firmName: clientName.trim(),
      visitPurpose,
      purpose: visitPurpose,
      note: note.trim(),
      notes: note.trim(),
      photo: photoPreview || photo || '',
      location: gpsLocation,
      geofenceStatus,
      distanceFromFirmMeters: distanceFromFirm,
      firmLocation: matchedFirm?.location || null,
      status: 'VERIFIED',
      updatedAt: nowISO
    };

    if (visitPurpose === 'Sales') {
      payload = {
        ...payload,
        productName: finalProdName,
        product: finalProdName,
        quantity: numQty,
        unit,
        deliveryType,
        billingAmount: parsedBilling,
        orderValue: parsedBilling,
        bagIncentive: calculatedIncentive,
        collectedAmount: 0,
        paymentMode: 'None'
      };
    } else if (visitPurpose === 'Payment Collection') {
      payload = {
        ...payload,
        paymentMethod,
        paymentMode: paymentMethod,
        transactionAmount: parsedTxnAmount,
        collectedAmount: parsedTxnAmount,
        transactionDate: transactionDate || todayStr,
        paymentDate: transactionDate || todayStr,
        transactionId: transactionId.trim(),
        txnId: transactionId.trim(),
        orderValue: 0,
        quantity: 0,
        bagIncentive: 0
      };
    } else {
      // Follow-up / Support / Onboarding
      payload = {
        ...payload,
        discussionTopic: discussionTopic.trim(),
        nextFollowUpDate: nextFollowUpDate || null,
        orderValue: 0,
        collectedAmount: 0,
        bagIncentive: 0
      };
    }

    if (editingVisitId) {
      // UPDATE EXISTING VISIT
      const updatedList = visits.map(v => {
        if (v.id === editingVisitId) {
          return {
            ...v,
            ...payload
          };
        }
        return v;
      });

      setVisits(updatedList);
      localStorage.setItem('user_visits', JSON.stringify(updatedList));

      try {
        await api.put(`/visits/${editingVisitId}`, payload);
        setSuccessMsg(`Visit record for "${clientName.trim()}" updated successfully!`);
      } catch (err) {
        setSuccessMsg(`Visit record for "${clientName.trim()}" updated locally.`);
      }

      setEditingVisitId(null);
    } else {
      // CREATE NEW VISIT
      const newVisitId = 'visit_' + Date.now();
      const newVisitObj = {
        ...payload,
        id: newVisitId,
        userId: user?.userId || user?.user_id,
        exec_id: user?.userId || user?.user_id,
        timestamp: nowISO,
        createdAt: nowISO
      };

      const updatedVisits = [newVisitObj, ...visits];
      setVisits(updatedVisits);
      localStorage.setItem('user_visits', JSON.stringify(updatedVisits));

      // Update active shift visits counter
      try {
        const activeShiftStr = localStorage.getItem('activeShiftData');
        if (activeShiftStr) {
          const activeShift = JSON.parse(activeShiftStr);
          activeShift.visitsCount = (activeShift.visitsCount || 0) + 1;
          localStorage.setItem('activeShiftData', JSON.stringify(activeShift));
        }
      } catch (e) {}

      try {
        const res = await api.post('/visits', newVisitObj);
        if (res.data?.visit) {
          const serverUpdated = [res.data.visit, ...visits.filter(v => v.id !== newVisitId)];
          setVisits(serverUpdated);
          localStorage.setItem('user_visits', JSON.stringify(serverUpdated));
        }
        setSuccessMsg(`Visit for "${clientName.trim()}" (${visitPurpose}) logged successfully!`);
      } catch (err) {
        setSuccessMsg(`Visit for "${clientName.trim()}" (${visitPurpose}) saved locally (Offline Ready).`);
      }
    }

    resetFormFields();
    captureCurrentGps(); // Refresh GPS for next entry
    setLoading(false);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Delete Visit (Only today's)
  const handleDeleteVisit = async (visitId) => {
    const target = visits.find(v => v.id === visitId);
    if (!target) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const visitDate = (target.paymentDate || target.transactionDate || target.timestamp || target.createdAt || '').split('T')[0];

    if (visitDate !== todayStr && user?.role !== 'ADMIN') {
      setErrorMsg('Policy: Only today\'s visit logs can be deleted.');
      setDeleteConfirmId(null);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const filtered = visits.filter(v => v.id !== visitId);
    setVisits(filtered);
    localStorage.setItem('user_visits', JSON.stringify(filtered));
    setDeleteConfirmId(null);

    try {
      await api.delete(`/visits/${visitId}`);
      setSuccessMsg('Visit log deleted successfully.');
    } catch (err) {
      setSuccessMsg('Visit log deleted locally.');
    }
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Filter today's visits
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaysVisits = visits.filter(v => {
    const vDate = (v.paymentDate || v.transactionDate || v.timestamp || v.createdAt || '').split('T')[0];
    return vDate === todayDateStr || !v.timestamp;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VISIT LOGGER FORM */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-colors ${
              editingVisitId ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              {editingVisitId ? <Edit3 size={22} /> : <PlusCircle size={22} />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {editingVisitId ? 'Edit Today\'s Visit Record' : 'Log New Client / Firm Visit'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingVisitId 
                  ? 'Update conditional fields, pricing, and receipts for this record' 
                  : 'Record client visits with dynamic purpose-based forms and instant local persistence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
              <MapPin size={12} className={isGpsLocating ? 'text-amber-500 animate-pulse' : 'text-blue-600'} />
              <span>GPS: {gpsLocation.lat}, {gpsLocation.lng}</span>
            </div>

            {editingVisitId && (
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmitVisit} className="space-y-6">
          {/* PROACTIVE AUTO-DETECTED NEARBY FIRM PROMPT */}
          {closestNearbyFirm && (!clientName || clientName.trim() !== closestNearbyFirm.name) && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-blue-50/50 border border-emerald-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <Target size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">Auto-Detected Nearby Firm:</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {closestNearbyFirm.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Your live GPS coordinates match this shop baseline ({closestNearbyFirm.distanceMeters}m away).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClientName(closestNearbyFirm.name)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Check size={13} />
                Auto-Select Firm
              </button>
            </div>
          )}

          {/* Top Row: Client Name & Visit Purpose Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Client / Firm Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="firms-suggestions-list"
                  placeholder="e.g. SMST - Sundaram Mahadeo Steels / Gupta Hardware"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                />
                <datalist id="firms-suggestions-list">
                  {firmsList.map((f) => (
                    <option key={f.id} value={f.name} />
                  ))}
                </datalist>
                <Store size={18} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* LIVE GEOLOCATION CROSS-CHECK STATUS */}
              {clientName.trim() && (
                <div className="mt-2">
                  {matchedFirm ? (
                    matchedFirm.location?.lat && matchedFirm.location?.lng ? (
                      distanceToMatchedFirm !== null ? (
                        distanceToMatchedFirm <= 250 ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold">
                              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                              <span>Geolocation Verified On-Site: You are within {distanceToMatchedFirm}m of registered shop GPS</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[10px] uppercase">
                              PASSED (0m - 250m)
                            </span>
                          </div>
                        ) : distanceToMatchedFirm <= 1500 ? (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-amber-800 font-bold">
                              <Navigation size={16} className="text-amber-600 shrink-0" />
                              <span>Vicinity Detection: You are {distanceToMatchedFirm}m from registered shop coordinates</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                              NEARBY ({distanceToMatchedFirm}m)
                            </span>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-rose-800 font-bold">
                              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                              <span>Location Variance Alert: Live GPS is {(distanceToMatchedFirm / 1000).toFixed(1)} km away from registered baseline</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-extrabold text-[10px] uppercase">
                              DISCREPANCY FLAGGED
                            </span>
                          </div>
                        )
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500" />
                          Calculating live geofence verification...
                        </p>
                      )
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        Firm has no baseline GPS registered. Current visit coordinates will calibrate baseline.
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Store size={12} className="text-blue-500" />
                      Unregistered / custom establishment. Will record live coordinates ({gpsLocation.lat}, {gpsLocation.lng}).
                    </p>
                  )}
                </div>
              )}

              {firmsList.length > 0 && !clientName && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Select from {firmsList.length} onboarded group entities/dealers or enter new shop name.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Visit Purpose <span className="text-blue-600 font-normal text-[11px]">(Switches Form)</span>
              </label>
              <select
                value={visitPurpose}
                onChange={(e) => handlePurposeChange(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold border-2 border-blue-600/30 rounded-xl bg-blue-50/40 text-blue-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sales">Sales (Order & Incentive)</option>
                <option value="Payment Collection">Payment Collection</option>
                <option value="Follow-up">Follow-up Meeting</option>
                <option value="Support">Support & Feedback</option>
                <option value="Onboarding">New Dealer Onboarding</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONDITIONAL BLOCK 1: SALES & PRODUCT ORDERING                             */}
          {/* ========================================================================= */}
          {visitPurpose === 'Sales' && (
            <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 p-5 rounded-2xl border border-blue-200/90 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sales Order & Billing Information
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Product rates, quantity, delivery dispatch, and auto incentive math
                    </p>
                  </div>
                </div>
                <div className="text-[11px] bg-blue-100/80 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
                  Incentive: ₹{currentRate} / {unit}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Product Name */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={productName}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(PRODUCT_INCENTIVE_RATES).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="Other">Other / Custom Material</option>
                  </select>

                  {productName === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom product name..."
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bags">Bags</option>
                    <option value="MT">MT (Metric Tonnes)</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Pcs">Pcs</option>
                    <option value="CFT">CFT</option>
                  </select>
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Type
                  </label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Site Delivery / Dispatched">Site Delivery / Dispatched</option>
                    <option value="Ex-Yard / Direct Pickup">Ex-Yard / Direct Pickup</option>
                    <option value="Warehouse Transfer">Warehouse Transfer</option>
                    <option value="Transport / Carrier">Transport / Carrier</option>
                  </select>
                </div>

                {/* Billing Amount */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Billing Amount (₹)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {unit === 'Bags' ? 'e.g. ₹336/bag calculated' : 'Auto-calculated or custom'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="₹ 0.00"
                      value={billingAmount}
                      onChange={(e) => {
                        setBillingAmount(e.target.value);
                        setAutoCalcBilling(false);
                      }}
                      className="w-full pl-8 pr-4 py-2.5 text-sm font-black border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 text-slate-900"
                      required
                    />
                    <IndianRupee size={15} className="absolute left-2.5 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Estimated Incentive Math Card */}
              <div className="bg-blue-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Calculator size={18} className="text-blue-200 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Estimated Bag / Volume Incentive</p>
                    <p className="text-[11px] text-blue-100">
                      {numQty > 0 
                        ? `${numQty} ${unit} × ₹${currentRate}/${unit}` 
                        : 'Enter quantity above to calculate incentive'}
                    </p>
                  </div>
                </div>
                <div className="text-lg font-black tracking-tight font-mono">
                  ₹{calculatedIncentive.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONDITIONAL BLOCK 2: PAYMENT COLLECTION                                   */}
          {/* ========================================================================= */}
          {visitPurpose === 'Payment Collection' && (
            <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 p-5 rounded-2xl border border-emerald-200/90 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Payment Collection & Transaction Details
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Record payment instrument, txn reference, and received amount
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  Ledger Settlement
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                  </select>
                </div>

                {/* Transaction Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Txn Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="₹ 0.00"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-sm font-black border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-mono"
                      required
                    />
                    <IndianRupee size={15} className="absolute left-2.5 top-3 text-emerald-600" />
                  </div>
                </div>

                {/* Transaction Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Transaction Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Transaction ID / Ref <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-82910 or CHQ-3029"
                    value={transactionId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONDITIONAL BLOCK 3: FOLLOW-UP / SUPPORT / ONBOARDING                     */}
          {/* ========================================================================= */}
          {(visitPurpose === 'Follow-up' || visitPurpose === 'Support' || visitPurpose === 'Onboarding') && (
            <div className="bg-gradient-to-br from-purple-50/70 to-slate-50 p-5 rounded-2xl border border-purple-200/90 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Client Discussion & Engagement Log
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {visitPurpose === 'Onboarding' 
                        ? 'New dealer onboarding checklist, GSTIN & shop profiling' 
                        : 'Client relationship, feedback, stock verification & action items'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-purple-700 font-bold bg-purple-100/80 px-2.5 py-1 rounded-lg">
                  {visitPurpose} Mode
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Discussion Topic / Key Agenda
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Price review, Brand display board, New credit terms..."
                    value={discussionTopic}
                    onChange={(e) => setDiscussionTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Next Follow-up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMMON SECTION: Notes & Shop Front Photo Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Visit Notes & Remarks <span className="text-slate-400 font-normal text-[11px]">(Specific Details)</span>
              </label>
              <textarea
                rows="3"
                placeholder={
                  visitPurpose === 'Sales' 
                    ? 'Delivery dispatch instructions, site contact person, billing remarks...' 
                    : visitPurpose === 'Payment Collection'
                    ? 'Invoice reference numbers, bank branch remarks, clearing notes...'
                    : 'Client discussion summary, market feedback, competitor prices, action items...'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shop Front / Visit Photo Proof
              </label>
              <div className="flex gap-3 items-center">
                <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-3 rounded-xl cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                  <Camera size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Attach / Snap Photo</span>
                  <span className="text-[10px] text-slate-400">Geo-tagged visit verification</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>

                {photoPreview ? (
                  <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative">
                    <img src={photoPreview} alt="Visit Proof" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                      <Check size={10} />
                    </span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center px-1 shrink-0">
                    No photo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {editingVisitId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-1/3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all text-sm"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                editingVisitId 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : visitPurpose === 'Payment Collection'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base`}
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : editingVisitId ? (
                <Edit3 size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {editingVisitId ? 'Update Visit Record' : 'Submit Visit Log'}
            </button>
          </div>
        </form>
      </div>

      {/* TODAY'S LOGGED VISITS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Today's Logged Visits</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
              {todaysVisits.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">Immediate Local Persistence:</span> Today's logs editable
          </p>
        </div>

        {todaysVisits.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
              <Store size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">No visits logged for today yet.</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the dynamic form above to record your client visits, sales volume, and payment collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysVisits.map((visit) => {
              const p = visit.visitPurpose || visit.purpose || 'Sales';
              const isSales = p.includes('Sale') || p.includes('Order');
              const isPayment = p.includes('Payment');

              return (
                <div
                  key={visit.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all space-y-3 relative"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {visit.clientName || visit.firmName}
                      </h4>
                      <span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                        isSales 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : isPayment 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {p}
                      </span>
                    </div>

                    {/* Actions: Edit / Delete for Today's log */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(visit)}
                        title="Edit this today's log"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>

                      {deleteConfirmId === visit.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                          <button
                            onClick={() => handleDeleteVisit(visit.id)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-0.5 text-slate-500 hover:text-slate-700"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(visit.id)}
                          title="Delete this today's log"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SALES CARD */}
                  {isSales && (visit.productName || visit.product || visit.billingAmount > 0 || visit.orderValue > 0) && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-bold text-slate-900">
                          {visit.productName || visit.product || 'Product'}{' '}
                          {visit.quantity ? `(${visit.quantity} ${visit.unit || 'Bags'})` : ''}
                        </span>
                        <span className="font-black text-slate-900 text-sm">
                          ₹{(visit.billingAmount || visit.orderValue || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {visit.deliveryType && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Truck size={12} className="text-slate-400" />
                          <span>{visit.deliveryType}</span>
                        </div>
                      )}

                      {visit.bagIncentive > 0 && (
                        <div className="flex justify-between items-center text-[11px] text-blue-700 pt-1.5 border-t border-slate-200 font-semibold">
                          <span>Volume Incentive:</span>
                          <span className="font-bold">₹{visit.bagIncentive.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PAYMENT COLLECTION CARD */}
                  {isPayment && (visit.transactionAmount > 0 || visit.collectedAmount > 0) && (
                    <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-emerald-950 font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <CreditCard size={14} className="text-emerald-700" />
                          {visit.paymentMethod || visit.paymentMode || 'Cash'}
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-800">
                          ₹{(visit.transactionAmount || visit.collectedAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {(visit.transactionId || visit.txnId) && (
                        <p className="text-[11px] font-mono text-emerald-700">
                          Txn ID: {visit.transactionId || visit.txnId}
                        </p>
                      )}
                      {(visit.transactionDate || visit.paymentDate) && (
                        <p className="text-[10px] text-emerald-600">
                          Txn Date: {visit.transactionDate || visit.paymentDate}
                        </p>
                      )}
                    </div>
                  )}

                  {/* FOLLOW-UP / SUPPORT / ONBOARDING CARD */}
                  {!isSales && !isPayment && (
                    <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-100 space-y-1.5 text-xs">
                      {visit.discussionTopic && (
                        <div className="font-semibold text-purple-900">
                          <span className="text-purple-600 font-bold">Topic:</span> {visit.discussionTopic}
                        </div>
                      )}
                      {visit.nextFollowUpDate && (
                        <div className="text-[11px] text-purple-700 flex items-center gap-1">
                          <Calendar size={11} /> Next Follow-up: {visit.nextFollowUpDate}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remarks / Notes */}
                  {(visit.note || visit.notes) && (
                    <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl italic border border-slate-100">
                      "{visit.note || visit.notes}"
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(visit.timestamp || visit.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {visit.location && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {visit.location.lat}, {visit.location.lng}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

