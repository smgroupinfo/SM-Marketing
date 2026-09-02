import React, { useState } from 'react';
import { 
  Building2, PlusCircle, ShieldCheck, Users, CreditCard, 
  RefreshCw, AlertCircle, CheckCircle2, PauseCircle, PlayCircle, 
  Settings2, Search, Filter, Calendar, Phone, Lock, ExternalLink, 
  TrendingUp, IndianRupee, Layers, ShieldAlert, Sparkles, X, ChevronRight,
  Sliders, Check, Copy, AlertTriangle, ArrowRight, Tag, Zap, DollarSign,
  QrCode, FileCheck, Send, CheckSquare
} from 'lucide-react';

/**
 * SuperAdminSubscriptionsAndPricing
 * 
 * Commercial monetization & subscription engine for Super Admin:
 * - Create and configure subscription plans (Starter, Growth, Enterprise, Custom)
 * - Define seat pricing per user / monthly / yearly
 * - Dynamic QR / UPI Payment Link generator for client onboarding & invoice checkout
 * - Payment collection tracking & recurring billing models
 */
export default function SuperAdminSubscriptionsAndPricing({ tenants = [], onUpdateTenantBilling }) {
  const [plans, setPlans] = useState([
    {
      id: 'plan_starter',
      name: 'Starter Tier (Field Force)',
      priceMonthly: 4999,
      priceAnnual: 49999,
      includedSeats: 5,
      extraSeatPrice: 499,
      features: [
        'Up to 5 Field Executive Seats',
        'Geo-fenced Shift Tracking & Log Visits',
        'Offline-First IndexedDB Sync',
        'Basic Daily Financial Ledger',
        'Single Firm Direct UPI Gateway'
      ],
      popular: false,
      status: 'ACTIVE'
    },
    {
      id: 'plan_growth',
      name: 'Business Pro (Multi-Outlet)',
      priceMonthly: 11999,
      priceAnnual: 119999,
      includedSeats: 15,
      extraSeatPrice: 399,
      features: [
        'Up to 15 Executive + 2 Admin Seats',
        'Multi-Firm Group Ledger (SMST, SMBNC, SMGH, PSS, SMM)',
        'Automated Executive Assistant View-Only Portal',
        'Real-time UPI & Card Gateway Rails',
        'Daily WhatsApp / Push Notifications Dispatch',
        'Priority Phone & Cloud Backup'
      ],
      popular: true,
      status: 'ACTIVE'
    },
    {
      id: 'plan_enterprise',
      name: 'Group Enterprise (Unlimited)',
      priceMonthly: 24999,
      priceAnnual: 249999,
      includedSeats: 50,
      extraSeatPrice: 299,
      features: [
        'Up to 50 Field Executives & Unlimited Admins',
        'Automated Chief Financial Auditor Ledger Extraction',
        'Custom Dedicated Domain & White-label Branding',
        'Direct Bank API & Multi-Merchant VPA Routing',
        'DPDP Act 2023 & Statutory Compliance Suite',
        'Dedicated Technical Account Manager'
      ],
      popular: false,
      status: 'ACTIVE'
    }
  ]);

  // Pricing Model Creator State
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPriceMonthly, setNewPriceMonthly] = useState(7999);
  const [newPriceAnnual, setNewPriceAnnual] = useState(79999);
  const [newIncludedSeats, setNewIncludedSeats] = useState(10);
  const [newExtraSeatPrice, setNewExtraSeatPrice] = useState(399);
  const [newPlanFeature, setNewPlanFeature] = useState('');
  const [newPlanFeaturesList, setNewPlanFeaturesList] = useState([
    'Complete Field Force Automation',
    'Real-time Ledger & Gross Profit Split'
  ]);

  // Quick Payment Link & Invoice Generator State
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState(tenants[0]?.id || '');
  const [selectedPlanForInvoice, setSelectedPlanForInvoice] = useState('plan_growth');
  const [billingCycle, setBillingCycle] = useState('ANNUAL'); // 'MONTHLY' | 'ANNUAL'
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Feature
  const handleAddFeature = () => {
    if (newPlanFeature.trim()) {
      setNewPlanFeaturesList([...newPlanFeaturesList, newPlanFeature.trim()]);
      setNewPlanFeature('');
    }
  };

  const handleRemoveFeature = (index) => {
    setNewPlanFeaturesList(newPlanFeaturesList.filter((_, i) => i !== index));
  };

  // Create New Subscription Plan
  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;

    const newPlan = {
      id: 'plan_' + Date.now(),
      name: newPlanName.trim(),
      priceMonthly: parseInt(newPriceMonthly, 10) || 0,
      priceAnnual: parseInt(newPriceAnnual, 10) || 0,
      includedSeats: parseInt(newIncludedSeats, 10) || 5,
      extraSeatPrice: parseInt(newExtraSeatPrice, 10) || 499,
      features: newPlanFeaturesList.length > 0 ? newPlanFeaturesList : ['Standard SaaS Core Features'],
      popular: false,
      status: 'ACTIVE'
    };

    setPlans([...plans, newPlan]);
    setIsCreatingPlan(false);
    setNewPlanName('');
    setNewPlanFeaturesList(['Complete Field Force Automation', 'Real-time Ledger & Gross Profit Split']);
  };

  // Generate Payment & Subscription Link for Client
  const handleGeneratePaymentLink = () => {
    const tenant = tenants.find(t => t.id === selectedClientForInvoice) || tenants[0];
    const plan = plans.find(p => p.id === selectedPlanForInvoice) || plans[0];

    if (!tenant || !plan) return;

    const amount = billingCycle === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;
    const upiLink = `upi://pay?pa=${encodeURIComponent(tenant.upi_id || 'merchant@upi')}&pn=${encodeURIComponent(tenant.name || 'Client')}&am=${amount}&cu=INR&tn=${encodeURIComponent(`SaaS License: ${plan.name} (${billingCycle})`)}`;

    const checkoutUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/#checkout?tenant=${tenant.id}&plan=${plan.id}&cycle=${billingCycle}&amt=${amount}`;

    setGeneratedInvoice({
      tenant,
      plan,
      billingCycle,
      amount,
      upiLink,
      checkoutUrl,
      invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    setCopiedLink(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>SaaS Monetization &amp; Subscription Models</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Commercial Rail</span>
            </h2>
            <p className="text-xs text-slate-400">
              Create commercial pricing tiers, sell licenses to other business clients, and generate instant UPI checkout links
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingPlan(!isCreatingPlan)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all shrink-0 self-start sm:self-center"
        >
          <PlusCircle size={15} />
          <span>{isCreatingPlan ? 'Close Plan Creator' : 'Create Custom Tier'}</span>
        </button>
      </div>

      {/* Plan Creator Collapsible Form */}
      {isCreatingPlan && (
        <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-amber-400" />
              <h3 className="font-bold text-white text-base">Design New SaaS Subscription Plan</h3>
            </div>
            <button onClick={() => setIsCreatingPlan(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Plan Tier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Construction & Infra Pro"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Monthly Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newPriceMonthly}
                  onChange={(e) => setNewPriceMonthly(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Annual Price (₹ - Discounted) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newPriceAnnual}
                  onChange={(e) => setNewPriceAnnual(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Included User Seats *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={newIncludedSeats}
                  onChange={(e) => setNewIncludedSeats(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

            </div>

            {/* Feature Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">Plan Feature Highlights</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Unlimited Branch Multi-Tenancy or Automated Auditing"
                  value={newPlanFeature}
                  onChange={(e) => setNewPlanFeature(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Add Feature
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {newPlanFeaturesList.map((feat, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg">
                    <Check size={12} className="text-emerald-400" />
                    <span>{feat}</span>
                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-slate-500 hover:text-rose-400 ml-1">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingPlan(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98"
              >
                <CheckCircle2 size={15} />
                <span>Save &amp; Publish Tier</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-slate-950 rounded-3xl border p-6 flex flex-col justify-between shadow-2xl relative transition-all ${
              plan.popular ? 'border-amber-400 shadow-amber-400/10' : 'border-slate-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-400 font-mono">₹{plan.priceMonthly.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  or ₹{plan.priceAnnual.toLocaleString('en-IN')} billed annually (Save ~16%)
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Included Quota:</span>
                  <span className="font-bold text-white font-mono">{plan.includedSeats} Active Seats</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Extra Seats:</span>
                  <span className="font-mono text-amber-300">₹{plan.extraSeatPrice}/seat/mo</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Features &amp; Modules:</span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedPlanForInvoice(plan.id);
                  const el = document.getElementById('payment-generator-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Generate Deal Link</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Link & Instant Onboarding Link Generator */}
      <div id="payment-generator-section" className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Client Payment &amp; Instant Onboarding Link Generator</h3>
            <p className="text-xs text-slate-400">Generate personalized invoice links or UPI QR codes to collect subscription fees from new or renewing clients</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Target Client */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">Select Client / Tenant *</label>
            <select
              value={selectedClientForInvoice}
              onChange={(e) => setSelectedClientForInvoice(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.admin_phone})</option>
              ))}
            </select>
          </div>

          {/* Selected Plan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">Choose Subscription Tier *</label>
            <select
              value={selectedPlanForInvoice}
              onChange={(e) => setSelectedPlanForInvoice(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ₹{p.priceMonthly}/mo</option>
              ))}
            </select>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">Billing Tenure *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Annual (12 Mo)
              </button>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleGeneratePaymentLink}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
          >
            <QrCode size={15} />
            <span>Generate Payment Invoice &amp; Link</span>
          </button>
        </div>

        {/* Generated Invoice Box */}
        {generatedInvoice && (
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{generatedInvoice.invoiceNumber}</span>
                <h4 className="text-white font-bold text-sm">Invoice for {generatedInvoice.tenant.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400 font-mono">₹{generatedInvoice.amount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block">({generatedInvoice.billingCycle} Subscription)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Left: Summary */}
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="font-bold text-white">{generatedInvoice.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target VPA Gateway:</span>
                  <span className="font-mono text-blue-300">{generatedInvoice.tenant.upi_id || 'merchant@upi'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seat Allocation:</span>
                  <span className="font-mono text-amber-300">{generatedInvoice.plan.includedSeats} Active Seats</span>
                </div>
              </div>

              {/* Right: Payment Links */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInvoice.checkoutUrl}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-mono text-amber-300 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInvoice.checkoutUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={generatedInvoice.upiLink}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Send size={13} />
                    <span>Launch UPI App / QR</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Hello ${generatedInvoice.tenant.name}, your SaaS subscription for ${generatedInvoice.plan.name} (Amount: ₹${generatedInvoice.amount}) is ready. Pay via: ${generatedInvoice.checkoutUrl}`;
                      window.open(`https://wa.me/91${generatedInvoice.tenant.admin_phone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="py-2 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
