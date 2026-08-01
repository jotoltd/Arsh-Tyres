import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { getUnitPrice, LOCKING_NUT_REMOVAL_PRICE } from '../data';
import BookingCalendar from './BookingCalendar';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePayment';
import { getStripePublishableKey, getStripeMode } from '../paymentSettings';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShoppingBag, Trash2, ChevronRight, ChevronLeft, Search, KeyRound, Check, Car, Calendar, User, Sparkles, ShieldCheck, Wrench, Package, CreditCard, Lock, Loader2, Tag, X } from 'lucide-react';
import { useSupabase } from '../contexts/SupabaseContext';

let stripePromiseCache: Promise<any> | null = null;
function getStripePromise() {
  const key = getStripePublishableKey();
  if (!stripePromiseCache || (stripePromiseCache as any).__key !== key) {
    stripePromiseCache = loadStripe(key);
    (stripePromiseCache as any).__key = key;
  }
  return stripePromiseCache;
}

interface CartSectionProps {
  cartItems: CartItem[];
  onUpdateQuantity: (tyreId: string, qty: number) => void;
  onRemoveItem: (tyreId: string) => void;
  onCompleteBooking: (bookingData: {
    cartItems: CartItem[];
    subtotal: number;
    fittingFee: number;
    totalPrice: number;
    fittingType: 'shop' | 'collection';
    date: string;
    timeSlot: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleRegistration: string;
    vehicleMakeModel: string;
  }) => void;
  selectedReg: string;
  selectedMakeModel: string;
}

const STEPS = [
  { id: 0, label: 'My Order', icon: ShoppingBag },
  { id: 1, label: 'Extras', icon: KeyRound },
  { id: 2, label: 'Date & Time', icon: Calendar },
  { id: 3, label: 'Your Details', icon: User },
  { id: 4, label: 'Payment', icon: CreditCard },
  { id: 5, label: 'Confirm', icon: Check },
];

export default function CartSection({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteBooking,
  selectedReg,
  selectedMakeModel
}: CartSectionProps) {
  const { stockManagementEnabled } = useSupabase();
  const [step, setStep] = useState(0);
  const [fittingType, setFittingType] = useState<'shop' | 'collection'>('shop');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [lockingNutCount, setLockingNutCount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState(selectedReg || '');
  const [vehicleMakeModel, setVehicleMakeModel] = useState(selectedMakeModel || '');
  const [formError, setFormError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isFetchingIntent, setIsFetchingIntent] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoMessage('');
    const code = promoInput.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .single();
      if (error || !data) {
        setPromoMessage('Invalid promo code');
        setPromoChecking(false);
        return;
      }
      if (!data.active) {
        setPromoMessage('This promo code is no longer active');
        setPromoChecking(false);
        return;
      }
      if (new Date(data.expiry) < new Date()) {
        setPromoMessage('This promo code has expired');
        setPromoChecking(false);
        return;
      }
      setPromoCode(data.code);
      setPromoDiscount(data.discount);
      setPromoMessage(`Promo applied: ${data.discount}% off!`);
    } else {
      setPromoMessage('Unable to verify promo code');
    }
    setPromoChecking(false);
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoInput('');
    setPromoMessage('');
  };

  useEffect(() => {
    if (selectedReg) setVehicleRegistration(selectedReg);
    if (selectedMakeModel) setVehicleMakeModel(selectedMakeModel);
  }, [selectedReg, selectedMakeModel]);

  if (cartItems.length === 0) {
    return (
      <div className="carbon-fiber rounded-2xl p-8 border border-white/5 shadow-lg text-center max-w-xl mx-auto my-8 animate-fade-in-up">
        <div className="bg-[#1e2121] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="font-display font-extrabold text-bright-snow text-2xl mb-2">Your Order is Empty</h3>
        <p className="text-sm text-gray-400 mb-6">
          Search for your tyre size and add them to your order to get started.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-racing-red/30 inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Browse Tyres
        </button>
      </div>
    );
  }

  const tyreCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const tyresTotal = cartItems.reduce((acc, item) => acc + (getUnitPrice(item.tyre, item.quantity) * item.quantity), 0);
  const multiBuySaving = cartItems.reduce(
    (acc, item) => acc + ((item.tyre.price - getUnitPrice(item.tyre, item.quantity)) * item.quantity),
    0
  );
  const lockingNutTotal = lockingNutCount * LOCKING_NUT_REMOVAL_PRICE;
  const subtotal = tyresTotal + lockingNutTotal;
  const fittingFee = 0;
  const discountAmount = promoDiscount > 0 ? (subtotal * promoDiscount) / 100 : 0;
  const totalPrice = subtotal + fittingFee - discountAmount;

  const validateStep = (s: number): boolean => {
    setFormError('');
    if (s === 2) {
      if (!selectedDate) { setFormError('Please pick a fitting date'); return false; }
      if (!selectedTimeSlot) { setFormError('Please pick a time slot'); return false; }
    }
    if (s === 3) {
      if (!customerName.trim()) { setFormError('Please enter your full name'); return false; }
      if (!customerEmail.trim() || !customerEmail.includes('@')) { setFormError('Please enter a valid email'); return false; }
      if (!customerPhone.trim()) { setFormError('Please enter your phone number'); return false; }
      if (!vehicleRegistration.trim()) { setFormError('Please enter your registration plate'); return false; }
      if (!vehicleMakeModel.trim()) { setFormError('Please enter your vehicle make & model'); return false; }
    }
    return true;
  };

  const fetchPaymentIntent = async () => {
    if (clientSecret) return;
    setIsFetchingIntent(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice, mode: getStripeMode() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialise payment');
    } finally {
      setIsFetchingIntent(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      // Skip date/time step for collection-only orders
      if (step === 1 && fittingType === 'collection') {
        setStep(3);
      } else {
        const next = Math.min(5, step + 1);
        setStep(next);
        if (next === 4) fetchPaymentIntent();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prevStep = () => {
    setFormError('');
    // Skip date/time step when going back from details for collection-only
    if (step === 3 && fittingType === 'collection') {
      setStep(1);
    } else {
      setStep(s => Math.max(0, s - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirm = () => {
    if (!paymentIntentId) {
      setFormError('Please complete payment first');
      return;
    }
    onCompleteBooking({
      cartItems,
      subtotal,
      fittingFee,
      totalPrice,
      fittingType,
      date: fittingType === 'collection' ? '' : selectedDate,
      timeSlot: fittingType === 'collection' ? '' : selectedTimeSlot,
      customerName,
      customerEmail,
      customerPhone,
      vehicleRegistration: vehicleRegistration.toUpperCase(),
      vehicleMakeModel
    });
  };

  const ProgressBar = () => (
    <div className="mb-8">
      {/* Desktop progress bar */}
      <div className="hidden sm:flex items-center justify-between max-w-2xl mx-auto px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/40 scale-110 ring-4 ring-racing-red/20' :
                  'bg-[#1e2121] text-gray-500 border border-white/5'
                }`}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition ${active ? 'text-bright-snow' : done ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded transition-all duration-500 relative overflow-hidden">
                  <div className={`absolute inset-0 transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-white/5'}`} />
                  {i === step - 1 && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-racing-red animate-pulse" />}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Mobile progress bar — compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-bright-snow">Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-bold text-racing-red">{STEPS[step].label}</span>
        </div>
        <div className="h-2 bg-[#1e2121] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-racing-red to-racing-red/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  const MiniSummary = () => (
    <div className="bg-black rounded-2xl border border-white/5 p-5 shadow-lg shadow-[0_0_30px_rgba(239,18,25,0.15)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Summary</span>
        <span className="text-[10px] font-bold text-racing-red bg-racing-red/10 px-2 py-0.5 rounded-full">{STEPS[step].label}</span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>Tyres ({tyreCount})</span>
          <span className="text-bright-snow">£{tyresTotal.toFixed(2)}</span>
        </div>
        {multiBuySaving > 0 && (
          <div className="flex justify-between text-emerald-400 font-bold">
            <span>Multi-buy saving</span>
            <span>-£{multiBuySaving.toFixed(2)}</span>
          </div>
        )}
        {lockingNutCount > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>Locking nut removal x{lockingNutCount}</span>
            <span className="text-bright-snow">£{lockingNutTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-400">
          <span>{fittingType === 'shop' ? 'Fitting & balancing' : 'Collection only'}</span>
          <span className={fittingType === 'shop' ? 'text-emerald-400 font-bold' : 'text-gray-500'}>{fittingType === 'shop' ? 'Included' : 'No fitting'}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-400 font-bold">
            <span>Promo ({promoCode})</span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-white/5">
        <span className="font-display font-bold text-bright-snow text-sm">Total</span>
        <span className="font-display font-extrabold text-racing-red text-xl">£{totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );

  const NavButtons = ({ isLast }: { isLast?: boolean }) => (
    <div className="flex gap-3 mt-6">
      {step > 0 && (
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#1e2121] border border-white/5 text-gray-400 hover:text-bright-snow hover:border-white/20 transition font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}
      {!isLast ? (
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold uppercase tracking-wider text-sm transition shadow-lg shadow-racing-red/30"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase tracking-wider text-sm transition shadow-lg shadow-emerald-600/30"
        >
          <Check className="w-5 h-5" />
          Confirm Booking
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto my-8 px-4">
      <ProgressBar />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          {formError && (
            <div className="mb-4 p-3 bg-racing-red/10 border border-racing-red/25 text-bright-snow rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* STEP 0: My Order */}
          {step === 0 && (
            <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6 animate-fade-in-up">
              <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1">Your Tyres</h3>
              <p className="text-xs text-gray-400 mb-5">Review your selection and adjust quantities. Buying 4+ of the same tyre unlocks a multi-buy discount.</p>
              <div className="divide-y divide-white/5">
                {cartItems.map((item) => (
                  <div key={item.tyre.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-bright-snow text-sm">{item.tyre.model}</h4>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">
                        {item.tyre.width}/{item.tyre.profile} R{item.tyre.rim}{item.tyre.category === 'Commercial' ? 'C' : ''}
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          item.tyre.category === 'Runflat' ? 'bg-blue-500/10 text-blue-400' :
                          item.tyre.category === 'Commercial' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-racing-red/10 text-racing-red'
                        }`}>{item.tyre.category}</span>
                      </p>
                      <p className="text-xs text-gray-400/80 mt-0.5">
                        £{getUnitPrice(item.tyre, item.quantity).toFixed(2)} each
                        {item.quantity < 4 && item.tyre.price4 !== undefined && (
                          <span className="text-emerald-400 ml-1">- buy 4 for £{item.tyre.price4.toFixed(2)} each</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center border border-white/5 rounded-lg overflow-hidden h-9 bg-[#1e2121]">
                        <button type="button" onClick={() => onUpdateQuantity(item.tyre.id, Math.max(1, item.quantity - 1))} className="px-3 py-0.5 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 text-sm transition">-</button>
                        <span className="px-3 font-mono font-bold text-xs text-bright-snow">{item.quantity}</span>
                        <button type="button" onClick={() => onUpdateQuantity(item.tyre.id, stockManagementEnabled ? Math.min(item.tyre.stock, item.quantity + 1) : item.quantity + 1)} className="px-3 py-0.5 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 text-sm transition">+</button>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-extrabold text-bright-snow text-sm">£{(getUnitPrice(item.tyre, item.quantity) * item.quantity).toFixed(2)}</p>
                        <button type="button" onClick={() => onRemoveItem(item.tyre.id)} className="text-racing-red hover:text-racing-red/85 text-xs font-semibold flex items-center gap-1 mt-1 transition ml-auto">
                          <Trash2 className="w-3 h-3" />Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {multiBuySaving > 0 && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  You're saving £{multiBuySaving.toFixed(2)} with multi-buy pricing!
                </div>
              )}

              {/* Promo code input */}
              <div className="mt-4 pt-4 border-t border-white/5">
                {promoCode ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                      <Tag className="w-4 h-4" />
                      {promoCode} — {promoDiscount}% off
                    </div>
                    <button type="button" onClick={handleRemovePromo} className="text-gray-400 hover:text-racing-red transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                        placeholder="Promo code"
                        className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg pl-9 pr-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoChecking || !promoInput.trim()}
                      className="px-4 py-2.5 rounded-lg bg-racing-red hover:bg-racing-red/90 disabled:opacity-50 text-bright-snow font-bold text-sm transition whitespace-nowrap"
                    >
                      {promoChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {promoMessage && !promoCode && (
                  <p className={`text-xs mt-2 font-semibold ${promoMessage.includes('applied') ? 'text-emerald-400' : 'text-racing-red'}`}>{promoMessage}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: Extras */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Fitting type toggle */}
              <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6">
                <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1">How do you want your tyres?</h3>
                <p className="text-xs text-gray-400 mb-5">Choose whether you want us to fit them or just collect them from our shop.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFittingType('shop')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      fittingType === 'shop'
                        ? 'border-racing-red bg-racing-red/10'
                        : 'border-white/5 bg-[#1e2121] hover:border-white/20'
                    }`}
                  >
                    <Wrench className={`w-6 h-6 mb-2 ${fittingType === 'shop' ? 'text-racing-red' : 'text-gray-500'}`} />
                    <p className="font-display font-bold text-bright-snow text-sm">Fitting at our shop</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Fitting, balancing & new valves included. Pick a date & time slot.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFittingType('collection')}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      fittingType === 'collection'
                        ? 'border-racing-red bg-racing-red/10'
                        : 'border-white/5 bg-[#1e2121] hover:border-white/20'
                    }`}
                  >
                    <Package className={`w-6 h-6 mb-2 ${fittingType === 'collection' ? 'text-racing-red' : 'text-gray-500'}`} />
                    <p className="font-display font-bold text-bright-snow text-sm">Collection only</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Pick up from our shop during opening hours. No fitting — just the tyres.</p>
                  </button>
                </div>
              </div>

              {fittingType === 'shop' && (
                <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6">
                  <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-racing-red" />
                    Locking Wheel Nut Removal
                  </h3>
                <p className="text-xs text-gray-400 mb-5">Lost your locking wheel nut key? We can safely remove them - £{LOCKING_NUT_REMOVAL_PRICE.toFixed(2)} per nut. Add how many you need below.</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-white/5 rounded-lg overflow-hidden h-10 bg-[#1e2121]">
                    <button type="button" onClick={() => setLockingNutCount(c => Math.max(0, c - 1))} className="px-4 py-1 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 transition">-</button>
                    <span className="px-4 font-mono font-bold text-sm text-bright-snow">{lockingNutCount}</span>
                    <button type="button" onClick={() => setLockingNutCount(c => Math.min(8, c + 1))} className="px-4 py-1 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 transition">+</button>
                  </div>
                  <span className="font-display font-extrabold text-bright-snow text-sm">
                    {lockingNutCount > 0 ? `£${lockingNutTotal.toFixed(2)}` : 'Not required'}
                  </span>
                </div>
                </div>
              )}

              {fittingType === 'shop' && (
                <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6">
                  <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-racing-red" />
                    TPMS Sensors
                  </h3>
                  <p className="text-xs text-gray-400">
                    We supply Autel TPMS sensors including fitting and programming. Give us a call on <span className="text-racing-red font-bold">020 8427 1234</span> for a quote - we'll sort it out on the day.
                  </p>
                </div>
              )}

              <div className="bg-[#1e2121] rounded-xl p-4 text-[11px] text-gray-400 border border-white/5">
                <p className="flex items-center gap-1.5 text-bright-snow font-bold uppercase tracking-wider text-[9px] mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-racing-red" />
                  {fittingType === 'shop' ? "What's included with fitting" : 'Good to know'}
                </p>
                {fittingType === 'shop' ? (
                  <>
                    <p>Professional fitting & wheel balancing</p>
                    <p>New valves & eco-friendly old tyre disposal</p>
                    <p>No upfront payment - pay in shop on completion</p>
                  </>
                ) : (
                  <>
                    <p>Collect from: 48 Harrow Road, London, HA1 2YF</p>
                    <p>Opening hours: Mon-Sat 8:30am - 6pm, Sun closed</p>
                    <p>Pay in shop when you collect - no upfront payment</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onTimeSlotChange={setSelectedTimeSlot}
                fittingType={fittingType}
              />
            </div>
          )}

          {/* STEP 3: Your Details */}
          {step === 3 && (
            <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6 space-y-5 animate-fade-in-up">
              <div>
                <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1 flex items-center gap-2">
                  <Car className="w-5 h-5 text-racing-red" />
                  Vehicle Details
                </h3>
                <p className="text-xs text-gray-400 mb-4">So we know what car we're working on.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Reg Plate</label>
                    <input type="text" placeholder="PLATE" value={vehicleRegistration} onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                      className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 font-mono font-bold text-sm text-center uppercase tracking-wider focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Make & Model</label>
                    <input type="text" placeholder="e.g. BMW 3 Series" value={vehicleMakeModel} onChange={(e) => setVehicleMakeModel(e.target.value)}
                      className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition" />
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-5">
                <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1 flex items-center gap-2">
                  <User className="w-5 h-5 text-racing-red" />
                  Contact Details
                </h3>
                <p className="text-xs text-gray-400 mb-4">We'll send your booking confirmation here.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Full Name</label>
                    <input type="text" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Email</label>
                      <input type="email" placeholder="john@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Phone</label>
                      <input type="tel" placeholder="07123 456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6">
                <h3 className="font-display font-extrabold text-bright-snow text-xl mb-1">Payment</h3>
                <p className="text-xs text-gray-400 mb-5">Enter your card details to pay for your booking securely.</p>

                {paymentError && (
                  <div className="bg-racing-red/10 border border-racing-red/20 rounded-lg p-3 text-xs text-racing-red font-semibold mb-4">
                    {paymentError}
                  </div>
                )}

                {isFetchingIntent && (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initialising secure payment...
                  </div>
                )}

                {!isFetchingIntent && clientSecret && (
                  <Elements stripe={getStripePromise()} options={{
                    clientSecret,
                    appearance: {
                      theme: 'night' as const,
                      variables: {
                        colorBackground: '#1e2121',
                        colorText: '#ffffff',
                        colorPrimary: '#ef1219',
                        colorDanger: '#ef1219',
                        borderRadius: '12px',
                        spacingUnit: '4px',
                        fontSizeBase: '14px',
                        colorIconTabSelected: '#ef1219',
                      },
                      rules: {
                        '.Tab': {
                          backgroundColor: '#1e2121',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#9ca3af',
                        },
                        '.Tab--selected': {
                          backgroundColor: 'rgba(239,18,25,0.1)',
                          borderColor: 'rgba(239,18,25,0.3)',
                          color: '#ef1219',
                        },
                        '.Tab:hover': {
                          color: '#ffffff',
                        },
                        '.TabIcon': {
                          color: '#9ca3af',
                        },
                        '.TabIcon--selected': {
                          color: '#ef1219',
                        },
                        '.Input': {
                          backgroundColor: '#1e2121',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#ffffff',
                        },
                        '.Input--invalid': {
                          borderColor: '#ef1219',
                          color: '#ef1219',
                        },
                        '.Input:focus': {
                          borderColor: '#ef1219',
                          boxShadow: '0 0 0 2px rgba(239,18,25,0.2)',
                        },
                        '.Label': {
                          color: '#9ca3af',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                          letterSpacing: '0.05em',
                        },
                        '.Error': {
                          color: '#ef1219',
                          fontSize: '12px',
                        },
                        '.TermsText': {
                          color: '#6b7280',
                          fontSize: '11px',
                        },
                        '.UppercaseText': {
                          color: '#9ca3af',
                        },
                        '.Link': {
                          color: '#ef1219',
                        },
                        '.Menu': {
                          backgroundColor: '#1e2121',
                          border: '1px solid rgba(255,255,255,0.08)',
                        },
                        '.MenuAction': {
                          color: '#ffffff',
                        },
                        '.MenuAction:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                        },
                        '.MenuItem': {
                          color: '#9ca3af',
                        },
                        '.MenuItem:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                        },
                      },
                    },
                  }}>
                    <StripePaymentForm
                      amount={totalPrice}
                      onSuccess={(id) => {
                        setPaymentIntentId(id);
                        setPaymentError('');
                        setTimeout(() => nextStep(), 500);
                      }}
                      onError={(msg) => setPaymentError(msg)}
                    />
                  </Elements>
                )}

                {!isFetchingIntent && !clientSecret && !paymentError && (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing payment...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Confirm */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6">
                <h3 className="font-display font-extrabold text-bright-snow text-xl mb-5">Review Your Booking</h3>
                <div className="space-y-2 mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-racing-red mb-2">Tyres</p>
                  {cartItems.map(item => (
                    <div key={item.tyre.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">{item.tyre.model} x{item.quantity}</span>
                      <span className="text-bright-snow font-bold">£{(getUnitPrice(item.tyre, item.quantity) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {lockingNutCount > 0 && (
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-gray-400">Locking nut removal x{lockingNutCount}</span>
                    <span className="text-bright-snow font-bold">£{lockingNutTotal.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-emerald-400 font-bold">Promo ({promoCode}) — {promoDiscount}% off</span>
                    <span className="text-emerald-400 font-bold">-£{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-racing-red mb-2">{fittingType === 'shop' ? 'Appointment' : 'Collection'}</p>
                  {fittingType === 'shop' ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-gray-400 block">Date</span><span className="text-bright-snow font-bold">{selectedDate}</span></div>
                      <div><span className="text-gray-400 block">Time</span><span className="text-bright-snow font-bold">{selectedTimeSlot}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <span className="text-gray-400 block">Pick up from</span>
                      <span className="text-bright-snow font-bold">48 Harrow Road, London, HA1 2YF</span>
                      <span className="text-gray-400 block mt-1.5">Opening hours</span>
                      <span className="text-bright-snow font-bold">Mon-Sat 8:30am - 6pm</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/5 pt-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-racing-red mb-2">Customer</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-gray-400 block">Name</span><span className="text-bright-snow font-bold">{customerName}</span></div>
                    <div><span className="text-gray-400 block">Vehicle</span><span className="text-bright-snow font-bold">{vehicleRegistration} - {vehicleMakeModel}</span></div>
                    <div><span className="text-gray-400 block">Email</span><span className="text-bright-snow font-bold">{customerEmail}</span></div>
                    <div><span className="text-gray-400 block">Phone</span><span className="text-bright-snow font-bold">{customerPhone}</span></div>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Payment Confirmed
                  </p>
                  <div className="text-xs text-gray-400">
                    <span>Card charged: </span>
                    <span className="text-bright-snow font-bold">£{totalPrice.toFixed(2)}</span>
                    <span className="text-gray-500 block mt-0.5">Transaction ID: {paymentIntentId.slice(0, 20)}...</span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display font-bold text-bright-snow text-base">Grand Total</span>
                    <span className="font-display font-extrabold text-racing-red text-2xl">£{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                Payment received. Hit confirm to {fittingType === 'shop' ? 'lock in your fitting slot.' : 'reserve your tyres for collection.'}
              </div>
            </div>
          )}

          <NavButtons isLast={step === 5} />
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <MiniSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
