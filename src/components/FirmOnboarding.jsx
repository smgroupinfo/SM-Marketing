import React, { useState, useEffect } from 'react';
import { 
  Store, PlusCircle, Search, MapPin, Phone, User, 
  FileText, CheckCircle2, AlertCircle, Camera, Check, RefreshCw, Tag,
  Calendar, ShoppingBag, CreditCard, ChevronRight, History, ExternalLink, IndianRupee,
  Navigation, Crosshair, Compass, ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { captureLiveLocation } from '../lib/locationService';

export default function FirmOnboarding({ user }) {
  // 1. LOCAL STORAGE & INITIAL STATE FALLBACK
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

  // Form input states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [brandsHandled, setBrandsHandled] = useState('Tata Tiscon, UltraTech, ACC');
  const [purchasePrice, setPurchasePrice] = useState('320');
  const [retailPrice, setRetailPrice] = useState('350');
  const [wholesalePrice, setWholesalePrice] = useState('335');
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  // GPS Location Capture States
  const [gpsCoords, setGpsCoords] = useState({ lat: 23.3441, lng: 85.3096 });
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // in meters
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('Ready to capture');
  const [gpsCapturedTime, setGpsCapturedTime] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Single-Date Lifting History Modal/Drawer state
  const [selectedFirmForHistory, setSelectedFirmForHistory] = useState(null);
  const [historyFilterDate, setHistoryFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchFirmsAndVisits();
    captureLiveGpsLocation(false);
  }, []);

  const captureLiveGpsLocation = async (showNotification = true) => {
    setIsCapturingGps(true);
    setGpsStatusMsg('Acquiring high-precision satellite fix...');

    const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 8000 });

    if (res.success && res.coords) {
      setGpsCoords({ lat: res.coords.lat, lng: res.coords.lng });
      setGpsAccuracy(res.accuracy || 25);
      setGpsCapturedTime(new Date().toLocaleTimeString());
      setIsCapturingGps(false);
      setGpsStatusMsg(`Locked: ±${res.accuracy || 25}m accuracy`);

      if (showNotification) {
        setSuccessMsg(`GPS Location captured successfully: ${res.coords.lat}° N, ${res.coords.lng}° E (±${res.accuracy || 25}m)`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } else {
      setIsCapturingGps(false);
      setGpsStatusMsg(res.error || 'GPS signal unavailable. Please retry.');
      if (showNotification) {
        setErrorMsg(res.error || 'Unable to lock GPS. Please verify location permissions.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    }
  };

  const fetchFirmsAndVisits = async () => {
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

  // Form submission wiring
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

  // Calculate lifting history for a specific firm and date
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

  const totalHistoryLiftingQty = selectedFirmHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const totalHistoryBilling = selectedFirmHistory.reduce((sum, h) => sum + (h.orderValue || 0), 0);
  const totalHistoryCollected = selectedFirmHistory.reduce((sum, h) => sum + (h.collectedAmount || 0), 0);

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

      {/* ONBOARD NEW FIRM FORM (ADMIN ONLY) */}
      {user?.role === 'ADMIN' ? (
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Onboard New Firm / Dealer</h2>
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
                placeholder="e.g. SMST - Sundaram Mahadeo Steels & Traders"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                GSTIN / Tax ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 20AABCS1234F1Z1 (or blank for URP)"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Owner / Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Anand Sundaram"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Phone / Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9835102938"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Shop Address & Market Location
            </label>
            <input
              type="text"
              placeholder="e.g. Plot 4, Industrial Steel Yard, Kokar, Ranchi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* ========================================================================= */}
          {/* LIVE GPS GEOLOCATION & GEOFENCE BASELINE CAPTURE                          */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-slate-50 to-blue-50/50 p-5 rounded-2xl border border-emerald-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/70">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <Navigation size={18} className={isCapturingGps ? 'animate-spin' : ''} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Live GPS Geotag & Baseline Location</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Auto Geofence Base
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Authoritative GPS coordinates for real-time executive visit verification & automated cross-check
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => captureLiveGpsLocation(true)}
                disabled={isCapturingGps}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
              >
                <RefreshCw size={13} className={isCapturingGps ? 'animate-spin' : ''} />
                {isCapturingGps ? 'Capturing Fix...' : 'Recapture Current GPS'}
              </button>
            </div>

            {/* Coordinates and accuracy telemetry display */}
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
                  GPS Accuracy & Status
                </label>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    {gpsAccuracy !== null ? `±${gpsAccuracy} meters` : 'Acquired'}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 underline"
                  >
                    Maps <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800/90 bg-emerald-100/50 p-2.5 rounded-xl flex items-center gap-2 border border-emerald-200/50">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
              <span>
                <strong>Automatic Geofencing Enabled:</strong> When field executives log sales or payment collections at this firm, the system will automatically cross-check their live GPS against these coordinates ({gpsCoords.lat}, {gpsCoords.lng}).
              </span>
            </p>
          </div>

          {/* Brands & Pricing Intelligence */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={15} className="text-blue-600" /> Market Pricing & Brand Intelligence
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Brands Handled / Stocked
              </label>
              <input
                type="text"
                placeholder="e.g. Tata Tiscon, Jindal Panther, UltraTech, ACC"
                value={brandsHandled}
                onChange={(e) => setBrandsHandled(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Purchase (₹/Unit)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Retail (₹/Unit)</label>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Wholesale (₹/Unit)</label>
                <input
                  type="number"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Storefront Photo Capture */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Storefront / Shop Board Photo Proof
            </label>
            <div className="flex gap-3 items-center">
              <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-3 rounded-xl cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                <Camera size={22} className="text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Capture / Upload Storefront</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoPreview ? (
                <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 relative">
                  <img src={photoPreview} alt="Shop Front" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
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
      ) : (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded tracking-wider border border-amber-500/30">
                Admin Exclusive Control
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Authorized Dealership Directory & Pricing Catalog</h3>
            <p className="text-xs text-slate-400 mt-1">
              Adding new firms, editing dealer master records, and firm deletion are restricted to Administrator accounts. Field executives can browse authorized dealer records, verify dealer pricing, and view lifting history below.
            </p>
          </div>
        </div>
      )}

      {/* SEARCHABLE FIRM DIRECTORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Sundaram Mahadeo Group & Dealers Directory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                {firms.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Searchable catalog with shop GPS coordinates, pricing, and single-date lifting histories
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by firm, brand, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* DIRECTORY CARDS */}
        {filteredFirms.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
              <Store size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {firms.length === 0
                ? 'No firms onboarded yet. Fill the form above to onboard your first shop.'
                : 'No matching firms found for your search query.'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {firms.length === 0
                ? 'Onboarding dealers and hardware shops builds your client territory and allows swift order logging.'
                : 'Try modifying your search keywords or clear the search field to see all shops.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFirms.map((firm) => {
              const lat = firm.location?.lat || 23.3441;
              const lng = firm.location?.lng || 85.3096;
              const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

              return (
                <div
                  key={firm.id}
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

                  {/* Contact Info & GPS PIN */}
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

                  {/* GPS Pin & Map Coordinates */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs">
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

                  {/* CUSTOM SINGLE-DATE LIFTING HISTORY BUTTON */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedFirmForHistory(firm);
                        setHistoryFilterDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-blue-200"
                    >
                      <History size={14} />
                      View Single-Date Lifting History
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SINGLE-DATE LIFTING HISTORY MODAL */}
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
    </div>
  );
}
