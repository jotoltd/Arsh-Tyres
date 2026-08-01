import React, { useState, useMemo } from 'react';
import { Booking, CartItem } from '../types';
import { useSupabase } from '../contexts/SupabaseContext';
import { getUnitPrice } from '../data';
import {
  User, Mail, LogOut, Calendar, Clock, Car, Package, CheckCircle2,
  ChevronDown, ChevronUp, ShoppingBag, Truck, MapPin, Phone, AlertTriangle,
  Loader2, TrendingUp, CreditCard
} from 'lucide-react';

interface CustomerAccountProps {
  onReorder: (items: CartItem[]) => void;
}

export default function CustomerAccount({ onReorder }: CustomerAccountProps) {
  const { user, bookings, signIn, signOut } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(b =>
      b.customerEmail?.toLowerCase() === user.email?.toLowerCase()
    );
  }, [bookings, user]);

  const stats = useMemo(() => {
    const completed = myBookings.filter(b => b.status === 'Completed');
    const scheduled = myBookings.filter(b => b.status === 'Scheduled');
    const totalSpent = completed.reduce((s, b) => s + b.totalPrice, 0);
    const tyresBought = completed.reduce((s, b) => s + b.cartItems.reduce((qs, i) => qs + i.quantity, 0), 0);
    return { completed: completed.length, scheduled: scheduled.length, totalSpent, tyresBought };
  }, [myBookings]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error.message);
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'Scheduled':
        return <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">Scheduled</span>;
      case 'Completed':
        return <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">Completed</span>;
      case 'Cancelled':
        return <span className="bg-rose-500/10 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/20">Cancelled</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Not logged in — show auth form
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="relative">
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-racing-red/10 blur-3xl rounded-full scale-90 -z-10" />

          <div className="bg-gradient-to-b from-[#1a1c1c] to-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-racing-red to-transparent" />

            <div className="p-8 border-b border-white/5 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-racing-red/30 blur-xl rounded-full" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-racing-red/20 to-black rounded-2xl flex items-center justify-center mx-auto border border-racing-red/30">
                  <img src="/assets/logo.jpg" alt="Arsh Autos" className="w-14 h-14 rounded-xl object-contain" />
                </div>
              </div>
              <h2 className="font-display font-black text-bright-snow text-2xl">Welcome Back</h2>
              <p className="text-gray-400 text-sm mt-1">
                Sign in to view your orders and bookings
              </p>
            </div>

            <form onSubmit={handleAuth} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-xl pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-racing-red focus:ring-2 focus:ring-racing-red/20 transition"
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-bright-snow rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-racing-red focus:ring-2 focus:ring-racing-red/20 transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-racing-red/10 border border-racing-red/20 rounded-xl p-3 text-xs text-racing-red font-semibold flex items-center gap-2 animate-fade-in-up">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm px-5 py-3.5 rounded-xl transition shadow-lg shadow-racing-red/30 disabled:opacity-50 hover:shadow-racing-red/40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                Sign In
              </button>

              <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
                No account yet? An account is created automatically when you place your first order. We'll email you your login details.
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — show account dashboard
  return (
    <div className="max-w-4xl mx-auto my-8 px-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-racing-red/10 via-black to-black rounded-2xl border border-white/5 p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-racing-red/20 blur-lg rounded-xl" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-racing-red/20 to-black rounded-xl flex items-center justify-center border border-racing-red/30">
              <User className="w-7 h-7 text-racing-red" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-black text-bright-snow text-2xl">My Account</h2>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs font-bold text-bright-snow bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500/5 to-black rounded-xl p-4 border border-blue-500/10">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Scheduled</span>
          </div>
          <p className="text-2xl font-extrabold text-bright-snow">{stats.scheduled}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-black rounded-xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Completed</span>
          </div>
          <p className="text-2xl font-extrabold text-bright-snow">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-racing-red/5 to-black rounded-xl p-4 border border-racing-red/10">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-racing-red" />
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tyres Bought</span>
          </div>
          <p className="text-2xl font-extrabold text-bright-snow">{stats.tyresBought}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-black rounded-xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Total Spent</span>
          </div>
          <p className="text-2xl font-extrabold text-bright-snow">£{stats.totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Bookings */}
      <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-bright-snow text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-racing-red" />
            My Orders & Bookings
          </h3>
        </div>

        {myBookings.length === 0 ? (
          <div className="p-8 text-center">
            <div className="bg-[#1e2121] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">No orders yet. When you place an order with this email, it'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {myBookings.map((booking) => {
              const isExpanded = expandedId === booking.id;
              const totalTyres = booking.cartItems.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={booking.id} className="p-4 hover:bg-white/[0.02] transition">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-racing-red/10 rounded-lg flex items-center justify-center border border-racing-red/20 shrink-0">
                        {booking.fittingType === 'delivery' ? <Truck className="w-5 h-5 text-racing-red" /> :
                         booking.fittingType === 'collection' ? <Package className="w-5 h-5 text-racing-red" /> :
                         <Car className="w-5 h-5 text-racing-red" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-bright-snow text-sm truncate">
                          {totalTyres} {totalTyres === 1 ? 'tyre' : 'tyres'} · £{booking.totalPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {formatDate(booking.date)} · {booking.timeSlot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(booking.status)}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 animate-fade-in-up">
                      {/* Items */}
                      <div className="bg-[#1e2121] rounded-lg p-4 space-y-3">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Items</p>
                        {booking.cartItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="min-w-0">
                              <p className="font-semibold text-bright-snow truncate">{item.tyre.brand} {item.tyre.model}</p>
                              <p className="text-xs text-gray-400">{item.tyre.width}/{item.tyre.profile} R{item.tyre.rim} · Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-bright-snow shrink-0 ml-2">£{(getUnitPrice(item.tyre, item.quantity) * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Car className="w-4 h-4 text-racing-red shrink-0" />
                          <span><span className="font-mono bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded tracking-wider text-[11px]">{booking.vehicleRegistration}</span> — {booking.vehicleMakeModel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-4 h-4 text-racing-red shrink-0" />
                          <span>{booking.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Phone className="w-4 h-4 text-racing-red shrink-0" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4 text-racing-red shrink-0" />
                          <span className="capitalize">{booking.fittingType}</span>
                        </div>
                      </div>

                      {/* Price breakdown */}
                      <div className="bg-[#1e2121] rounded-lg p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>Subtotal</span>
                          <span>£{booking.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Fitting Fee</span>
                          <span>£{booking.fittingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-bright-snow pt-2 border-t border-white/5">
                          <span>Total</span>
                          <span className="text-racing-red">£{booking.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Re-order */}
                      {booking.status !== 'Cancelled' && (
                        <button
                          onClick={() => onReorder(booking.cartItems)}
                          className="w-full flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-bold text-sm px-4 py-2.5 rounded-lg transition"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Re-order These Tyres
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
