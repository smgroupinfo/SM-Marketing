import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, PlusCircle, Camera, MapPin, Store, IndianRupee, 
  Clock, FileText, AlertCircle, RefreshCw, Layers, Check, ShoppingBag, 
  CreditCard, Edit3, Trash2, X, Calendar, Calculator, ShieldAlert, Sparkles,
  Truck, ArrowRight, UserCheck, MessageSquare, HelpCircle, Navigation,
  Crosshair, ShieldCheck, AlertTriangle, ExternalLink, Target, Search,
  History, Building2, Package, Tag, ArrowUpRight, ArrowDownLeft, Lock
} from 'lucide-react';
import { api } from '../lib/api';
import { captureLiveLocation } from '../lib/locationService';
import { sendMobilePushNotification } from '../lib/notificationEngine';
import { DEFAULT_APP_CONFIG } from '../lib/supabaseDataService';
import { queueOfflineVisit } from '../lib/offlineSyncEngine';
import DynamicUpiQrModal from './DynamicUpiQrModal';

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

// Delivery Types as requested
const DELIVERY_TYPES = [
  'FOR Factory',
  'From Warehouse',
  'Ex Factory',
  'Direct Pickup'
];

export default function VisitLogger({ user, onNavigateToShift }) {
  // Check active shift state for shift gate
  const [activeShift, setActiveShift] = useState(() => {
    try {
      const saved = localStorage.getItem('activeShiftData');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Local storage visits & firms
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

  // Configured products loaded from Admin Config
  const [configuredProducts, setConfiguredProducts] = useState(() => {
    try {
      const savedCfg = localStorage.getItem('app_config');
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        if (Array.isArray(parsed.incentives) && parsed.incentives.length > 0) {
          return parsed.incentives;
        }
      }
      return DEFAULT_APP_CONFIG.incentives || [];
    } catch (e) {
      return DEFAULT_APP_CONFIG.incentives || [];
    }
  });

  // Autocomplete search & suggestions state
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSuggestionsOpen, setIsClientSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Helper to load persistent draft from LocalStorage so entering data is never lost or deleted
  const loadSavedDraft = () => {
    try {
      const saved = localStorage.getItem('visit_logger_form_draft');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };
  const initialDraft = loadSavedDraft();

  // Base Form State (Initialized with saved draft if available)
  const [editingVisitId, setEditingVisitId] = useState(null);
  const [clientName, setClientName] = useState(() => initialDraft?.clientName || '');
  const [visitPurpose, setVisitPurpose] = useState(() => initialDraft?.visitPurpose || 'Sales'); // 'Sales' | 'Payment Collection' | 'Follow-up' | 'Support' | 'Onboarding'

  // CONDITIONAL SECTION 1: Multi-Product Sales Items
  // Structure: [{ id, productName, unit, quantity, billingAmount, unitCost, incentiveRate }]
  const [salesProducts, setSalesProducts] = useState(() => {
    if (Array.isArray(initialDraft?.salesProducts) && initialDraft.salesProducts.length > 0) {
      return initialDraft.salesProducts;
    }
    const defaultProd = configuredProducts[0] || { name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 };
    return [
      {
        id: 'item_1',
        productName: defaultProd.name,
        unit: defaultProd.unit || 'Bags',
        quantity: '',
        billingAmount: '',
        unitCost: '0.00',
        incentiveRate: defaultProd.rate || 10
      }
    ];
  });
  const [deliveryType, setDeliveryType] = useState(() => initialDraft?.deliveryType || 'FOR Factory');

  // CONDITIONAL SECTION 2: Payment Collection Inputs
  const [paymentMethod, setPaymentMethod] = useState(() => initialDraft?.paymentMethod || 'UPI'); // NEFT, UPI, Bank Transfer, Cheque, Cash Deposit
  const [transactionAmount, setTransactionAmount] = useState(() => initialDraft?.transactionAmount || '');
  const [transactionDate, setTransactionDate] = useState(() => initialDraft?.transactionDate || new Date().toISOString().split('T')[0]);
  const [transactionId, setTxnId] = useState(() => initialDraft?.transactionId || '');

  // CONDITIONAL SECTION 3: Follow-up / Support / Onboarding Inputs
  const [discussionTopic, setDiscussionTopic] = useState(() => initialDraft?.discussionTopic || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => initialDraft?.nextFollowUpDate || '');

  // Common Additional Inputs
  const [note, setNote] = useState(() => initialDraft?.note || '');
  const [photo, setPhoto] = useState(() => initialDraft?.photo || '');
  const [photoPreview, setPhotoPreview] = useState(() => initialDraft?.photoPreview || '');
  const [gpsLocation, setGpsLocation] = useState({ lat: 23.3441, lng: 85.3096 });
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(Boolean(initialDraft));

  // UI Status
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Dynamic BharatPe / NPCI UPI QR Modal State
  const [isUpiQrModalOpen, setIsUpiQrModalOpen] = useState(false);
  const [upiQrParams, setUpiQrParams] = useState({
    firmName: '',
    firmUpiId: '',
    amount: '',
    invoiceNote: ''
  });

  const handleOpenUpiQr = (customAmount = null) => {
    const targetFirmName = clientName.trim() || matchedFirm?.name || 'Sundaram Mahadeo Group';
    const targetUpiId = matchedFirm?.upiId || matchedFirm?.upi_id || 'sundarammahadeo@icici';
    const targetAmount = customAmount !== null 
      ? customAmount 
      : (visitPurpose === 'Sales' ? salesTotals.totalBilling : (transactionAmount || selectedFirmHistory?.netDues || 0));

    setUpiQrParams({
      firmName: targetFirmName,
      firmUpiId: targetUpiId,
      amount: targetAmount,
      invoiceNote: `Invoice settlement for ${targetFirmName}`
    });
    setIsUpiQrModalOpen(true);
  };

  const handlePaymentConfirmedFromQr = (details) => {
    setPaymentMethod('UPI');
    setTransactionAmount(details.amount.toString());
    setTxnId(details.txnId);
    if (visitPurpose !== 'Payment Collection') {
      setVisitPurpose('Payment Collection');
    }
    setSuccessMsg(`UPI Payment of ₹${details.amount.toLocaleString('en-IN')} confirmed via ${details.upiId}!`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsClientSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial visits, firms, config, and GPS on mount
  useEffect(() => {
    fetchVisitsAndFirms();
    fetchAdminConfig();
    checkShiftStatus();
    captureCurrentGps();

    const handleConfigUpdate = (e) => {
      if (e?.detail?.incentives) {
        setConfiguredProducts(e.detail.incentives);
      } else {
        fetchAdminConfig();
      }
    };
    window.addEventListener('app_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('app_config_updated', handleConfigUpdate);
  }, []);

  // Automatic Draft Persistence: save form inputs so data being entered is never lost or deleted
  useEffect(() => {
    if (editingVisitId) return; // Do not overwrite draft when editing historical logs

    const hasContent = Boolean(
      clientName.trim() ||
      transactionAmount ||
      transactionId.trim() ||
      discussionTopic.trim() ||
      nextFollowUpDate ||
      note.trim() ||
      photoPreview ||
      salesProducts.some(p => p.quantity || p.billingAmount)
    );

    if (hasContent) {
      const draftData = {
        clientName,
        visitPurpose,
        salesProducts,
        deliveryType,
        paymentMethod,
        transactionAmount,
        transactionDate,
        transactionId,
        discussionTopic,
        nextFollowUpDate,
        note,
        photo,
        photoPreview,
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('visit_logger_form_draft', JSON.stringify(draftData));
        setHasUnsavedDraft(true);
      } catch (e) {}
    }
  }, [
    clientName, visitPurpose, salesProducts, deliveryType,
    paymentMethod, transactionAmount, transactionDate, transactionId,
    discussionTopic, nextFollowUpDate, note, photo, photoPreview, editingVisitId
  ]);

  const checkShiftStatus = async () => {
    try {
      const res = await api.get('/shifts/current');
      if (res.data?.shift && res.data.shift.status === 'ACTIVE') {
        setActiveShift(res.data.shift);
        localStorage.setItem('activeShiftData', JSON.stringify(res.data.shift));
      } else if (!res.data?.shift) {
        // Double check local storage
        const saved = localStorage.getItem('activeShiftData');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.status === 'ACTIVE') setActiveShift(parsed);
          else setActiveShift(null);
        } else {
          setActiveShift(null);
        }
      }
    } catch (e) {
      const saved = localStorage.getItem('activeShiftData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.status === 'ACTIVE') setActiveShift(parsed);
          else setActiveShift(null);
        } catch (err) {
          setActiveShift(null);
        }
      }
    }
  };

  const fetchAdminConfig = async () => {
    try {
      const res = await api.get('/admin/config');
      if (res.data?.incentives && Array.isArray(res.data.incentives) && res.data.incentives.length > 0) {
        setConfiguredProducts(res.data.incentives);
        localStorage.setItem('app_config', JSON.stringify(res.data));
      }
    } catch (e) {
      console.warn('Using cached config products for sales form.');
    }
  };

  const captureCurrentGps = async () => {
    setIsGpsLocating(true);
    try {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsLocation({
              lat: Number(pos.coords.latitude.toFixed(5)),
              lng: Number(pos.coords.longitude.toFixed(5))
            });
            setIsGpsLocating(false);
          },
          async () => {
            const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 8000 });
            if (res.success && res.coords) {
              setGpsLocation({
                lat: Number(res.coords.lat.toFixed(5)),
                lng: Number(res.coords.lng.toFixed(5))
              });
            }
            setIsGpsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
        return;
      }
      const res = await captureLiveLocation({ preferHighAccuracy: true, timeoutMs: 8000 });
      if (res.success && res.coords) {
        setGpsLocation({
          lat: Number(res.coords.lat.toFixed(5)),
          lng: Number(res.coords.lng.toFixed(5))
        });
      }
    } catch (e) {
      console.warn('[VisitLogger] GPS notice:', e);
    } finally {
      setIsGpsLocating(false);
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
        const cleanFirms = firmsRes.value.data.firms.filter(f => !['f-smst', 'f-smbnc', 'f-smgh', 'f-pss', 'f-smm', 'f-06', 'f-08'].includes(f.id));
        setFirmsList(cleanFirms);
        localStorage.setItem('onboarded_firms', JSON.stringify(cleanFirms));
      }
    } catch (err) {
      console.warn('API error fetching visits/firms, utilizing local storage cache.');
    }
  };

  // Matched Firm identification based on exact or close clientName
  const matchedFirm = useMemo(() => {
    if (!clientName.trim()) return null;
    const q = clientName.trim().toLowerCase();
    return firmsList.find(f => (f.name || '').trim().toLowerCase() === q) ||
           firmsList.find(f => (f.name || '').toLowerCase().includes(q));
  }, [clientName, firmsList]);

  // Similar firms list for Autocomplete dropdown when typing in client name
  const suggestedFirms = useMemo(() => {
    const query = (clientSearchQuery || clientName || '').trim().toLowerCase();
    if (!query) return firmsList.slice(0, 8); // show top onboarded firms when empty/focused
    return firmsList.filter(f => {
      const name = (f.name || '').toLowerCase();
      const contact = (f.contactPerson || '').toLowerCase();
      const phone = (f.phone || '').toLowerCase();
      const addr = (f.address || '').toLowerCase();
      const gstin = (f.gstin || '').toLowerCase();
      return name.includes(query) || contact.includes(query) || phone.includes(query) || addr.includes(query) || gstin.includes(query);
    }).slice(0, 12);
  }, [clientSearchQuery, clientName, firmsList]);

  // Selected Firm Ledger Stats & Past Order History for Payment Collection Form
  const selectedFirmHistory = useMemo(() => {
    if (!matchedFirm && !clientName.trim()) return null;
    const searchTarget = (matchedFirm?.name || clientName).trim().toLowerCase();
    
    // Filter all visits matching this firm name
    const firmVisits = visits.filter(v => {
      const fName = (v.clientName || v.firmName || '').trim().toLowerCase();
      return fName === searchTarget || fName.includes(searchTarget);
    });

    const totalBilled = firmVisits.reduce((sum, v) => sum + (parseFloat(v.orderValue || v.billingAmount) || 0), 0);
    const totalCollected = firmVisits.reduce((sum, v) => sum + (parseFloat(v.collectedAmount || v.transactionAmount) || 0), 0);
    const netDues = Math.max(0, totalBilled - totalCollected);

    return {
      firm: matchedFirm,
      firmName: matchedFirm?.name || clientName.trim(),
      gstin: matchedFirm?.gstin || 'URP-Registered',
      phone: matchedFirm?.phone || 'N/A',
      address: matchedFirm?.address || 'Market Location',
      totalBilled,
      totalCollected,
      netDues,
      ordersCount: firmVisits.length,
      pastOrders: firmVisits.sort((a, b) => new Date(b.timestamp || b.paymentDate || 0) - new Date(a.timestamp || a.paymentDate || 0))
    };
  }, [matchedFirm, clientName, visits]);

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

  // Handle choosing a firm from the autocomplete suggestions
  const handleSelectFirm = (firm) => {
    setClientName(firm.name);
    setClientSearchQuery('');
    setIsClientSuggestionsOpen(false);

    // If in payment collection mode and firm has dues, suggest auto-filling
    if (visitPurpose === 'Payment Collection') {
      const searchTarget = firm.name.trim().toLowerCase();
      const firmVisits = visits.filter(v => (v.clientName || v.firmName || '').trim().toLowerCase() === searchTarget);
      const totalBilled = firmVisits.reduce((sum, v) => sum + (parseFloat(v.orderValue || v.billingAmount) || 0), 0);
      const totalCollected = firmVisits.reduce((sum, v) => sum + (parseFloat(v.collectedAmount || v.transactionAmount) || 0), 0);
      const dues = Math.max(0, totalBilled - totalCollected);
      if (dues > 0 && !transactionAmount) {
        setTransactionAmount(dues.toString());
      }
    }
  };

  // MULTI-PRODUCT SALES HANDLERS
  const handleAddSalesProduct = () => {
    const firstConfig = configuredProducts[0] || { name: 'Standard Item', unit: 'Bags', rate: 10 };
    setSalesProducts(prev => [
      ...prev,
      {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        productName: firstConfig.name,
        unit: firstConfig.unit || 'Bags',
        quantity: '',
        billingAmount: '',
        unitCost: '0.00',
        incentiveRate: firstConfig.rate || 10
      }
    ]);
  };

  const handleRemoveSalesProduct = (id) => {
    if (salesProducts.length <= 1) {
      // Don't remove if only 1 item, just reset it
      setSalesProducts([{
        id: 'item_1',
        productName: configuredProducts[0]?.name || 'Standard Item',
        unit: configuredProducts[0]?.unit || 'Bags',
        quantity: '',
        billingAmount: '',
        unitCost: '0.00',
        incentiveRate: configuredProducts[0]?.rate || 10
      }]);
      return;
    }
    setSalesProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateSalesProduct = (id, field, value) => {
    setSalesProducts(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      if (field === 'productName') {
        const found = configuredProducts.find(cp => cp.name === value);
        if (found) {
          updated.unit = found.unit || 'Bags';
          updated.incentiveRate = found.rate || 10;
        }
      }

      // Re-calculate unitCost when quantity or billingAmount changes
      const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
      const billing = parseFloat(field === 'billingAmount' ? value : updated.billingAmount) || 0;

      if (qty > 0 && billing > 0) {
        updated.unitCost = (billing / qty).toFixed(2);
      } else {
        updated.unitCost = '0.00';
      }

      return updated;
    }));
  };

  // Multi-Product Aggregate Calculations
  const salesTotals = useMemo(() => {
    let totalBilling = 0;
    let totalIncentive = 0;
    let totalQty = 0;

    salesProducts.forEach(item => {
      const q = parseFloat(item.quantity) || 0;
      const b = parseFloat(item.billingAmount) || 0;
      const rate = parseFloat(item.incentiveRate) || 0;

      totalBilling += b;
      totalQty += q;
      totalIncentive += (q * rate);
    });

    return {
      totalBilling,
      totalIncentive,
      totalQty,
      itemsCount: salesProducts.length
    };
  }, [salesProducts]);

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

    // Sales fields (support multi-product or legacy single-product)
    if (Array.isArray(visit.products) && visit.products.length > 0) {
      setSalesProducts(visit.products);
    } else {
      const existingProd = visit.productName || visit.product || configuredProducts[0]?.name || 'Standard Product';
      const existingQty = visit.quantity || '';
      const existingBilling = visit.billingAmount || visit.orderValue || '';
      const existingUnit = visit.unit || 'Bags';
      const foundCfg = configuredProducts.find(cp => cp.name === existingProd);
      const unitCost = (parseFloat(existingQty) > 0 && parseFloat(existingBilling) > 0)
        ? (parseFloat(existingBilling) / parseFloat(existingQty)).toFixed(2)
        : '0.00';

      setSalesProducts([
        {
          id: 'item_edit_1',
          productName: existingProd,
          unit: existingUnit,
          quantity: existingQty ? existingQty.toString() : '',
          billingAmount: existingBilling ? existingBilling.toString() : '',
          unitCost,
          incentiveRate: foundCfg?.rate || 10
        }
      ]);
    }
    
    setDeliveryType(visit.deliveryType || 'FOR Factory');

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

  // Safe non-destructive purpose switcher: preserves user inputs when switching modes
  const handlePurposeChange = (newPurpose) => {
    setVisitPurpose(newPurpose);
    // Deliberately keep all entered fields intact so that user data is NEVER deleted while typing or exploring modes
  };

  const resetFormFields = () => {
    try {
      localStorage.removeItem('visit_logger_form_draft');
    } catch (e) {}
    setHasUnsavedDraft(false);
    setClientName('');
    setClientSearchQuery('');
    setVisitPurpose('Sales');
    const firstCfg = configuredProducts[0] || { name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 };
    setSalesProducts([
      {
        id: 'item_1',
        productName: firstCfg.name,
        unit: firstCfg.unit || 'Bags',
        quantity: '',
        billingAmount: '',
        unitCost: '0.00',
        incentiveRate: firstCfg.rate || 10
      }
    ]);
    setDeliveryType('FOR Factory');
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

    // HARDCODED SHIFT CHECK: Executives must be on active duty to log visits
    if (user?.role !== 'ADMIN' && (!activeShift || activeShift.status !== 'ACTIVE')) {
      setErrorMsg('Policy Violation: You must start your shift in the Shift Dashboard before logging visits.');
      return;
    }

    if (!clientName.trim()) {
      setErrorMsg('Please specify the Client / Firm Name.');
      return;
    }

    // Validate Sales Products if in Sales mode
    if (visitPurpose === 'Sales') {
      const invalidItem = salesProducts.find(p => !p.quantity || parseFloat(p.quantity) <= 0 || !p.billingAmount || parseFloat(p.billingAmount) <= 0);
      if (invalidItem) {
        setErrorMsg('Please enter valid Quantity and Billing Amount for all added products.');
        return;
      }
    }

    setLoading(true);

    const nowISO = new Date().toISOString();
    const todayStr = nowISO.split('T')[0];
    const parsedTxnAmount = parseFloat(transactionAmount) || 0;

    // Compute authoritative Geofence Cross-Check status
    let geofenceStatus = visitPurpose === 'Sales' ? 'FIELD_SALES_ORDER' : 'UNREGISTERED_LOCATION';
    let distanceFromFirm = null;
    if (matchedFirm && distanceToMatchedFirm !== null) {
      distanceFromFirm = distanceToMatchedFirm;
      if (distanceToMatchedFirm <= 250) {
        geofenceStatus = 'VERIFIED_ON_SITE';
      } else if (distanceToMatchedFirm <= 1500) {
        geofenceStatus = visitPurpose === 'Sales' ? 'FIELD_SALES_ORDER' : 'VICINITY';
      } else {
        geofenceStatus = visitPurpose === 'Sales' ? 'REMOTE_SALES_ORDER' : 'DISCREPANCY';
      }
    }

    // Construct specific payload based on visitPurpose
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
      // Primary summary product descriptor
      const primaryProduct = salesProducts[0]?.productName || 'Multi-Product Order';
      const primaryUnit = salesProducts[0]?.unit || 'Units';

      payload = {
        ...payload,
        products: salesProducts,
        productName: salesProducts.length > 1 ? `${primaryProduct} + ${salesProducts.length - 1} more` : primaryProduct,
        product: salesProducts.length > 1 ? `${primaryProduct} + ${salesProducts.length - 1} more` : primaryProduct,
        quantity: salesTotals.totalQty,
        unit: primaryUnit,
        deliveryType,
        billingAmount: salesTotals.totalBilling,
        orderValue: salesTotals.totalBilling,
        bagIncentive: salesTotals.totalIncentive,
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
        transactionId: transactionId.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        txnId: transactionId.trim() || `TXN-${Date.now().toString().slice(-6)}`,
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

      // Buffer into IndexedDB Offline Engine immediately
      try {
        await queueOfflineVisit(newVisitObj);
      } catch (idbErr) {
        console.warn('IndexedDB buffer note:', idbErr);
      }

      // Update active shift visits counter
      try {
        const activeShiftStr = localStorage.getItem('activeShiftData');
        if (activeShiftStr) {
          const shiftObj = JSON.parse(activeShiftStr);
          shiftObj.visitsCount = (shiftObj.visitsCount || 0) + 1;
          localStorage.setItem('activeShiftData', JSON.stringify(shiftObj));
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
        sendMobilePushNotification(
          '📍 Visit Recorded',
          `Visit for ${clientName.trim()} (${visitPurpose}) logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          { type: 'success' }
        );
      } catch (err) {
        setSuccessMsg(`Visit for "${clientName.trim()}" (${visitPurpose}) saved locally (Offline Ready).`);
        sendMobilePushNotification(
          '💾 Visit Saved (Offline IndexedDB)',
          `Visit for ${clientName.trim()} saved to local offline database. Will sync automatically upon network reconnection.`,
          { type: 'info' }
        );
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

  // =========================================================================
  // HARDCODED SHIFT GATE FOR FIELD EXECUTIVES
  // =========================================================================
  const isExecutiveOffDuty = user?.role !== 'ADMIN' && (!activeShift || activeShift.status !== 'ACTIVE');

  if (isExecutiveOffDuty) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white text-center shadow-xl border border-slate-700/60 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
            <Lock size={32} />
          </div>
          
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              Shift Required • Off-Duty
            </span>
            <h2 className="text-2xl font-black text-white">Active Shift Required to Log Visits</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Field Executives must start their daily shift and submit an opening odometer reading before logging visits, sales orders, or collecting payments.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert size={16} /> Compliance & Travel Reimbursement Notice:
            </div>
            <p>
              Starting your shift activates high-precision GPS geofencing, calculates your KM travel reimbursement at ₹5/KM, and unlocks client logging.
            </p>
          </div>

          <button
            onClick={() => {
              if (onNavigateToShift) {
                onNavigateToShift();
              } else {
                window.location.hash = '#dashboard';
                window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'dashboard' }));
              }
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
          >
            <Clock size={18} />
            <span>Go to Shift Dashboard to Start Shift</span>
          </button>
        </div>
      </div>
    );
  }

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
                {editingVisitId ? 'Edit Today\'s Visit Record' : 'Log Client / Firm Visit'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingVisitId 
                  ? 'Update conditional fields, pricing, and receipts for this record' 
                  : 'Record client visits, multi-product sales, and payment collections with instant ledger sync'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingVisitId && hasUnsavedDraft && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Draft Saved</span>
                <button
                  type="button"
                  onClick={resetFormFields}
                  className="ml-1 text-slate-400 hover:text-rose-600 transition-colors text-[10px] underline"
                  title="Clear saved draft"
                >
                  Clear
                </button>
              </div>
            )}

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

        <form 
          onSubmit={handleSubmitVisit} 
          onKeyDown={(e) => {
            // Prevent accidental form submission when pressing Enter in text/number inputs
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
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
                onClick={() => handleSelectFirm(closestNearbyFirm)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Check size={13} />
                Auto-Select Firm
              </button>
            </div>
          )}

          {/* Top Row: Client Name (WITH INTERACTIVE AUTOCOMPLETE FOR ALL FORMS) & Visit Purpose Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2" ref={searchContainerRef}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Client / Firm Name <span className="text-rose-500">*</span>
                </label>
                {matchedFirm && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={12} /> Onboarded Dealer Verified
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Type firm name or dealer..."
                  value={clientName}
                  onFocus={() => setIsClientSuggestionsOpen(true)}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setClientSearchQuery(e.target.value);
                    setIsClientSuggestionsOpen(true);
                  }}
                  className="w-full px-4 py-3 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white pr-10"
                  required
                />
                <Store size={18} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />

                {/* INTERACTIVE CLIENT AUTOCOMPLETE DROPDOWN */}
                {isClientSuggestionsOpen && suggestedFirms.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1">
                    <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 border-b border-slate-200">
                      <span>Matching Onboarded Firms ({suggestedFirms.length})</span>
                      <span>Click to auto-populate</span>
                    </div>
                    {suggestedFirms.map((firm) => (
                      <button
                        key={firm.id}
                        type="button"
                        onClick={() => handleSelectFirm(firm)}
                        className="w-full text-left p-3 hover:bg-blue-50/80 transition-colors flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                            <Store size={14} className="text-slate-400 group-hover:text-blue-600" />
                            <span>{firm.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                            <span>{firm.contactPerson || 'Proprietor'}</span>
                            {firm.phone && <span>• {firm.phone}</span>}
                            {firm.address && <span className="truncate max-w-[200px]">• {firm.address}</span>}
                          </div>
                        </div>

                        {firm.gstin && (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">
                            {firm.gstin}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LIVE GEOLOCATION CROSS-CHECK STATUS */}
              {clientName.trim() && (
                <div className="mt-2">
                  {visitPurpose === 'Sales' ? (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <Navigation size={16} className="text-blue-600 shrink-0" />
                        <span>
                          {matchedFirm && distanceToMatchedFirm !== null && distanceToMatchedFirm <= 250
                            ? `On-Site Order: Verified within ${distanceToMatchedFirm}m of dealer yard`
                            : `Remote / Field Sales Order: Order booking allowed from anywhere • Live GPS tracked (${gpsLocation.lat}, ${gpsLocation.lng})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={captureCurrentGps}
                          disabled={isGpsLocating}
                          className="px-2 py-0.5 rounded bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={10} className={isGpsLocating ? 'animate-spin' : ''} />
                          {isGpsLocating ? 'Locating...' : 'Refresh GPS'}
                        </button>
                        <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-extrabold text-[10px] uppercase">
                          GPS ACTIVE
                        </span>
                      </div>
                    </div>
                  ) : matchedFirm ? (
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
                <option value="Sales">Sales (Multi-Product Order)</option>
                <option value="Payment Collection">Payment Collection & Dues</option>
                <option value="Follow-up">Follow-up Meeting</option>
                <option value="Support">Support & Feedback</option>
                <option value="Onboarding">New Dealer Onboarding</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONDITIONAL BLOCK 1: SALES & MULTI-PRODUCT ORDERING (CONFIG PRODUCTS ONLY) */}
          {/* ========================================================================= */}
          {visitPurpose === 'Sales' && (
            <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 p-5 rounded-2xl border border-blue-200/90 space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Sales Order & Multi-Product Billing
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add multiple products, auto-derive per-unit cost, and aggregate total billing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Delivery Type Dropdown as requested */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Delivery:</span>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold border border-blue-300 rounded-lg bg-white text-blue-950 focus:ring-2 focus:ring-blue-500"
                    >
                      {DELIVERY_TYPES.map(dt => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSalesProduct}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                  >
                    <PlusCircle size={13} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC MULTI-PRODUCT LIST */}
              <div className="space-y-3">
                {salesProducts.map((item, idx) => (
                  <div 
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Item #{idx + 1}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Incentive: <span className="font-bold text-emerald-700">₹{item.incentiveRate || 0}/{item.unit}</span>
                        </span>
                        {salesProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSalesProduct(item.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Product Line"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Product Selection - Configured Products Only */}
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Product (From Config) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={item.productName || ''}
                          onChange={(e) => handleUpdateSalesProduct(item.id, 'productName', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          {configuredProducts.map((cp) => (
                            <option key={cp.id || cp.name} value={cp.name}>
                              {cp.name} ({cp.unit || 'Units'})
                            </option>
                          ))}
                          {configuredProducts.length === 0 && (
                            <option value="Cement (UltraTech / ACC)">Cement (UltraTech / ACC)</option>
                          )}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Quantity ({item.unit || 'Units'}) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          placeholder="e.g. 100"
                          value={item.quantity ?? ''}
                          onChange={(e) => handleUpdateSalesProduct(item.id, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Line Item Total Billing Amount */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Billing Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="1"
                            placeholder="₹ 0.00"
                            value={item.billingAmount ?? ''}
                            onChange={(e) => handleUpdateSalesProduct(item.id, 'billingAmount', e.target.value)}
                            className="w-full pl-6 pr-3 py-2 text-xs font-black border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-slate-900"
                            required
                          />
                          <IndianRupee size={12} className="absolute left-2 top-2.5 text-slate-400" />
                        </div>
                      </div>

                      {/* Unit Cost Calculation: Billing / Quantity */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Unit Cost (Rate)</span>
                        <div className="text-xs font-extrabold text-blue-900 mt-0.5">
                          {parseFloat(item.unitCost) > 0 ? (
                            <span>₹{item.unitCost} <span className="text-[10px] font-semibold text-slate-500">/ {item.unit}</span></span>
                          ) : (
                            <span className="text-slate-400 font-normal">Enter Qty & Bill</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRAND TOTAL SUMMARY BAR */}
              <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 text-white rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-blue-300">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-200">
                      Total Order Summary ({salesTotals.itemsCount} Product Lines)
                    </p>
                    <p className="text-xs text-slate-200">
                      Total Volume: <span className="font-bold text-white">{salesTotals.totalQty} Units</span> • Est. Incentive: <span className="font-bold text-emerald-300">₹{salesTotals.totalIncentive.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {salesTotals.totalBilling > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenUpiQr(salesTotals.totalBilling)}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                      title="Generate dynamic UPI QR Code for this order"
                    >
                      <Sparkles size={14} className="text-emerald-950 animate-pulse" />
                      <span>⚡ Instant UPI QR</span>
                    </button>
                  )}

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-blue-200">Total Billing Amount</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
                      ₹{salesTotals.totalBilling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONDITIONAL BLOCK 2: PAYMENT COLLECTION & DUES / PAST ORDERS VISIBILITY   */}
          {/* ========================================================================= */}
          {visitPurpose === 'Payment Collection' && (
            <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 p-5 rounded-2xl border border-emerald-200/90 space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Payment Collection & Outstanding Dues Ledger
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Inspect past orders, total outstanding dues balance, and record payment receipt
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  Ledger Direct Collection
                </span>
              </div>

              {/* DUES SUMMARY & PAST ORDER CARD FOR SELECTED FIRM */}
              {selectedFirmHistory && (
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{selectedFirmHistory.firmName}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {selectedFirmHistory.gstin}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {selectedFirmHistory.address} {selectedFirmHistory.phone !== 'N/A' && `• Contact: ${selectedFirmHistory.phone}`}
                      </p>
                    </div>

                    {/* DUES STATS */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Outstanding Balance</span>
                        <div className={`text-base sm:text-lg font-black font-mono ${
                          selectedFirmHistory.netDues > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          ₹{selectedFirmHistory.netDues.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {selectedFirmHistory.netDues > 0 && (
                        <button
                          type="button"
                          onClick={() => setTransactionAmount(selectedFirmHistory.netDues.toString())}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all shrink-0"
                        >
                          Collect Full Due
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PAST ORDERS TABLE */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <History size={13} className="text-emerald-600" />
                        Past Orders & Transactions ({selectedFirmHistory.pastOrders.length})
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        Total Billed: <span className="font-bold text-slate-800">₹{selectedFirmHistory.totalBilled.toLocaleString('en-IN')}</span> | Paid: <span className="font-bold text-emerald-700">₹{selectedFirmHistory.totalCollected.toLocaleString('en-IN')}</span>
                      </span>
                    </div>

                    {selectedFirmHistory.pastOrders.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500 border border-slate-100">
                        No previous orders or payment transactions logged for this firm yet.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 text-xs">
                        {selectedFirmHistory.pastOrders.slice(0, 10).map((po, idx) => {
                          const isSale = (po.visitPurpose || po.purpose || '').includes('Sale') || (po.orderValue > 0);
                          const isPay = (po.visitPurpose || po.purpose || '').includes('Pay') || (po.collectedAmount > 0);
                          const dateStr = (po.paymentDate || po.transactionDate || po.timestamp || '').split('T')[0];

                          return (
                            <div key={po.id || idx} className="p-2.5 hover:bg-slate-50 flex items-center justify-between gap-3">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                  <span className={`w-2 h-2 rounded-full ${isSale ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                  <span className="truncate">{po.productName || po.product || (isSale ? 'Sales Order' : 'Payment Receipt')}</span>
                                  {po.deliveryType && (
                                    <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {po.deliveryType}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span>{dateStr}</span>
                                  {po.quantity > 0 && <span>• Qty: {po.quantity} {po.unit || 'Units'}</span>}
                                  {po.paymentMode && po.paymentMode !== 'None' && <span>• Mode: {po.paymentMode}</span>}
                                  {po.txnId && <span>• Ref: {po.txnId}</span>}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {isSale && (
                                  <div className="font-bold text-blue-700 font-mono">
                                    +₹{(po.orderValue || po.billingAmount || 0).toLocaleString('en-IN')}
                                  </div>
                                )}
                                {isPay && (
                                  <div className="font-bold text-emerald-700 font-mono">
                                    -₹{(po.collectedAmount || po.transactionAmount || 0).toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PAYMENT COLLECTION INPUTS */}
              <div className="space-y-3">
                {/* Instant Dynamic UPI QR Action Bar */}
                <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Sparkles size={16} className="text-emerald-200 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-black">Dynamic BharatPe / NPCI UPI QR Generator</p>
                      <p className="text-[11px] text-emerald-100">
                        Dealer scans live screen to settle exact amount to <span className="font-bold underline">{matchedFirm?.upiId || 'Firm UPI ID'}</span> with zero manual entry
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenUpiQr(transactionAmount || selectedFirmHistory?.netDues || null)}
                    className="px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 text-xs font-black rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <CreditCard size={14} className="text-emerald-700" />
                    <span>⚡ Show Dynamic QR</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentMethod || 'UPI'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="UPI">Google Pay / UPI</option>
                      <option value="NEFT">NEFT / NetBanking</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                      <option value="Cheque">Cheque Deposit</option>
                      <option value="Cash Deposit">Cash Deposit</option>
                    </select>
                  </div>

                  {/* Transaction Amount */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Collected Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        placeholder="₹ 0.00"
                        value={transactionAmount ?? ''}
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
                      value={transactionDate || ''}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Txn ID / UTR / Cheque No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-928410 or CHQ-0032"
                      value={transactionId || ''}
                      onChange={(e) => setTxnId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
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
                    value={discussionTopic || ''}
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
                    value={nextFollowUpDate || ''}
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
                value={note || ''}
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
              Use the dynamic form above to record your client visits, multi-product sales, and payment collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysVisits.map((visit) => {
              const p = visit.visitPurpose || visit.purpose || 'Sales';
              const isSales = p.includes('Sale') || p.includes('Order');
              const isPayment = p.includes('Payment');
              const hasMultiProducts = Array.isArray(visit.products) && visit.products.length > 0;

              return (
                <div 
                  key={visit.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isSales ? 'bg-blue-100 text-blue-800' : isPayment ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {p}
                        </span>
                        {visit.deliveryType && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {visit.deliveryType}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {visit.clientName || visit.firmName || 'Client Visit'}
                      </h4>
                    </div>

                    {/* Action buttons (Edit & Delete for today's logs) */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => handleStartEdit(visit)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Today's Record"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(visit.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="p-3 bg-slate-50/80 rounded-xl space-y-1.5 text-xs text-slate-700">
                    {isSales && (
                      <>
                        {hasMultiProducts ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-600">Products Ordered ({visit.products.length}):</span>
                            {visit.products.map((item, pidx) => (
                              <div key={pidx} className="flex justify-between text-[11px] pl-2 border-l-2 border-blue-400">
                                <span>{item.productName} ({item.quantity} {item.unit})</span>
                                <span className="font-bold text-slate-900">₹{(parseFloat(item.billingAmount) || 0).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Product:</span>
                            <span className="font-bold text-slate-900">{visit.productName || visit.product} ({visit.quantity} {visit.unit})</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-500 font-bold">Total Billing:</span>
                          <span className="font-black text-blue-700 font-mono">₹{(visit.orderValue || visit.billingAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {visit.bagIncentive > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-emerald-700 font-semibold">Sales Incentive Earned:</span>
                            <span className="font-bold text-emerald-700 font-mono">+₹{visit.bagIncentive.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </>
                    )}

                    {isPayment && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Mode:</span>
                          <span className="font-bold text-emerald-800">{visit.paymentMethod || visit.paymentMode || 'UPI'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Txn Ref:</span>
                          <span className="font-mono font-bold text-slate-800">{visit.transactionId || visit.txnId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-500 font-bold">Collected Amount:</span>
                          <span className="font-black text-emerald-700 font-mono">₹{(visit.collectedAmount || visit.transactionAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}

                    {!isSales && !isPayment && (
                      <div className="space-y-1">
                        {visit.discussionTopic && (
                          <div>
                            <span className="text-slate-500">Topic: </span>
                            <span className="font-medium text-slate-800">{visit.discussionTopic}</span>
                          </div>
                        )}
                        {visit.nextFollowUpDate && (
                          <div>
                            <span className="text-slate-500">Next Follow-up: </span>
                            <span className="font-bold text-purple-700">{visit.nextFollowUpDate}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {visit.note && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                        "{visit.note}"
                      </p>
                    )}
                  </div>

                  {/* Geofence verification pill */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} /> {new Date(visit.timestamp || visit.paymentDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {visit.geofenceStatus === 'VERIFIED_ON_SITE' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <ShieldCheck size={11} /> Verified On-Site ({visit.distanceFromFirmMeters || 0}m)
                      </span>
                    ) : visit.geofenceStatus === 'VICINITY' ? (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">
                        <Navigation size={11} /> Vicinity ({visit.distanceFromFirmMeters}m)
                      </span>
                    ) : null}
                  </div>

                  {/* Delete Confirmation Modal */}
                  {deleteConfirmId === visit.id && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 z-10 animate-in fade-in">
                      <AlertTriangle size={24} className="text-rose-600" />
                      <p className="text-xs font-bold text-slate-900">
                        Delete this visit log for "{visit.clientName || visit.firmName}"?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteVisit(visit.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic BharatPe / NPCI UPI QR Modal */}
      <DynamicUpiQrModal
        user={user}
        isOpen={isUpiQrModalOpen}
        onClose={() => setIsUpiQrModalOpen(false)}
        firmName={upiQrParams.firmName}
        firmUpiId={upiQrParams.firmUpiId}
        amount={upiQrParams.amount}
        invoiceNote={upiQrParams.invoiceNote}
        onPaymentConfirmed={handlePaymentConfirmedFromQr}
      />
    </div>
  );
}
