import React, { useState, useEffect } from 'react';
import { CartItem, Booking, SearchFilters } from '../types';
import { FITTING_FEES } from '../data';
import { ShoppingBag, Trash2, CreditCard, ChevronRight, Sparkles, Search } from 'lucide-react';

interface CartSectionProps {
  cartItems: CartItem[];
  onUpdateQuantity: (tyreId: string, qty: number) => void;
  onRemoveItem: (tyreId: string) => void;
  onCompleteBooking: (bookingData: {
    cartItems: CartItem[];
    subtotal: number;
    fittingFee: number;
    totalPrice: number;
    fittingType: 'shop' | 'mobile' | 'delivery';
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

export default function CartSection({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteBooking,
  selectedReg,
  selectedMakeModel
}: CartSectionProps) {
  const [fittingType] = useState<'delivery'>('delivery');
  
  // Checkout fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState(selectedReg || '');
  const [vehicleMakeModel, setVehicleMakeModel] = useState(selectedMakeModel || '');
  const [formError, setFormError] = useState('');

  // Sync plate lookup from parent searcher
  useEffect(() => {
    if (selectedReg) {
      setVehicleRegistration(selectedReg);
    }
    if (selectedMakeModel) {
      setVehicleMakeModel(selectedMakeModel);
    }
  }, [selectedReg, selectedMakeModel]);

  if (cartItems.length === 0) {
    return (
      <div className="carbon-fiber rounded-2xl p-8 border border-white/5 shadow-lg text-center max-w-xl mx-auto my-8 animate-fade-in-up">
        <div className="bg-[#1e2121] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="font-display font-extrabold text-bright-snow text-2xl mb-2">Your Shopping Cart is Empty</h3>
        <p className="text-sm text-gray-400 mb-6">
          Use the tyre searcher above to find the correct specifications for your car and add them to your cart.
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

  // Cost Calculations
  const tyreCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.tyre.price * item.quantity), 0);
  
  const getFittingFee = () => {
    switch (fittingType) {
      case 'shop':
        return FITTING_FEES.shop * tyreCount;
      case 'mobile':
        return FITTING_FEES.mobile + (10.00 * tyreCount); // £25 callout + £10 per tyre
      case 'delivery':
        return FITTING_FEES.delivery;
    }
  };

  const fittingFee = getFittingFee();
  const totalPrice = subtotal + fittingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Please enter a contact phone number');
      return;
    }
    if (!vehicleRegistration.trim()) {
      setFormError('Please enter your vehicle registration plate');
      return;
    }
    if (!vehicleMakeModel.trim()) {
      setFormError('Please enter your vehicle manufacturer and model (e.g. BMW 3 Series)');
      return;
    }

    onCompleteBooking({
      cartItems,
      subtotal,
      fittingFee,
      totalPrice,
      fittingType,
      date: '',
      timeSlot: '',
      customerName,
      customerEmail,
      customerPhone,
      vehicleRegistration: vehicleRegistration.toUpperCase(),
      vehicleMakeModel
    });
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: Cart list and booking details */}
      <div className="lg:col-span-7 space-y-6">
        {/* Cart Item Cards */}
        <div className="bg-black rounded-2xl border border-white/5 shadow-lg p-6 shadow-[0_0_40px_rgba(239,18,25,0.2)]">
          <h3 className="font-display font-extrabold text-bright-snow text-xl mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-racing-red/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-racing-red" />
            </div>
            Selected Tyres ({tyreCount})
          </h3>
          <div className="divide-y divide-white/5">
            {cartItems.map((item, index) => (
              <div key={item.tyre.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-racing-red">{item.tyre.brand}</span>
                    <span className="text-[10px] bg-racing-red/10 text-racing-red border border-racing-red/20 font-bold px-1.5 py-0.5 rounded uppercase">
                      {item.tyre.category}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-bright-snow text-sm">{item.tyre.model}</h4>
                  <p className="font-mono text-xs text-gray-400 mt-1">
                    Size: <strong className="text-bright-snow">{item.tyre.width}/{item.tyre.profile} R{item.tyre.rim} {item.tyre.loadIndex}{item.tyre.speedRating}</strong>
                  </p>
                  <p className="text-xs text-gray-400/80 mt-0.5">Price per tyre: £{item.tyre.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Quantity adjustment */}
                  <div className="flex items-center border border-white/5 rounded-lg overflow-hidden h-9 bg-[#1e2121]">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tyre.id, Math.max(1, item.quantity - 1))}
                      className="px-2 py-0.5 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 text-sm transition"
                    >
                      -
                    </button>
                    <span className="px-3 font-mono font-bold text-xs text-bright-snow">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tyre.id, Math.min(item.tyre.stock, item.quantity + 1))}
                      className="px-2 py-0.5 hover:bg-racing-red/20 hover:text-racing-red font-semibold text-gray-400 text-sm transition"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-display font-extrabold text-bright-snow text-sm">
                      £{(item.tyre.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.tyre.id)}
                      className="text-racing-red hover:text-racing-red/85 text-xs font-semibold flex items-center gap-1 mt-1 transition ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Order Summary and details checkout form */}
      <div className="lg:col-span-5">
        <form onSubmit={handleSubmit} className="bg-black rounded-2xl border border-white/5 shadow-2xl p-6 space-y-5 sticky top-6 shadow-[0_0_40px_rgba(239,18,25,0.2)]">
          <h3 className="font-display font-extrabold text-bright-snow text-xl border-b border-white/5 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-racing-red/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-racing-red" />
            </div>
            Secure Checkout
          </h3>

          {/* Vehicle Information section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-racing-red">Vehicle Details</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Reg Plate</label>
                <input
                  type="text"
                  placeholder="PLATE"
                  value={vehicleRegistration}
                  onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                  className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 font-mono font-bold text-sm text-center uppercase tracking-wider focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Make & Model</label>
                <input
                  type="text"
                  placeholder="e.g. BMW 3 Series"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                />
              </div>
            </div>
          </div>

          {/* Customer Information section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-racing-red">Contact & Billing Info</h4>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Phone Number</label>
                <input
                  type="tel"
                  placeholder="07123 456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                />
              </div>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="border-t border-b border-white/5 py-3.5 space-y-2 bg-black/30 rounded-xl p-4">
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Tyres Total ({tyreCount} items)</span>
              <span className="text-bright-snow">£{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Delivery Shipping Fee</span>
              <span className="text-emerald-400 font-bold">FREE</span>
            </div>

            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>VAT (20% Included)</span>
              <span>£{(totalPrice * 0.20).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
              <span className="font-display font-bold text-bright-snow text-base">Grand Total</span>
              <span className="font-display font-extrabold text-racing-red text-2xl">£{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Form error block */}
          {formError && (
            <div className="p-3 bg-racing-red/10 border border-racing-red/25 text-bright-snow rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="bg-[#1e2121] rounded-xl p-3 text-[11px] text-gray-400 space-y-1.5 font-medium border border-white/5">
            <div className="flex items-center gap-1.5 text-bright-snow font-bold uppercase tracking-wider text-[9px]">
              <Sparkles className="w-3.5 h-3.5 text-racing-red" />
              <span>Arsh Autos Triple Guarantee</span>
            </div>
            <p>✔ No upfront payment required - Pay in shop or upon mobile completion</p>
            <p>✔ 100% Free wheel balancing and old tyre recycling</p>
            <p>✔ Lifetime manufacturing defect warranty on all selected brands</p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold uppercase tracking-wider py-3.5 rounded-xl transition shadow-lg shadow-racing-red/30 hover:shadow-racing-red/50 flex items-center justify-center gap-2 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            Book & Secure Order
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
