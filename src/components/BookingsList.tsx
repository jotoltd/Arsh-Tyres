import React, { useState } from 'react';
import { Booking } from '../types';
import { Calendar, Clock, Car, User, Mail, Phone, MapPin, CheckCircle2, ChevronDown, ChevronUp, Printer, AlertTriangle, ShieldAlert } from 'lucide-react';

interface BookingsListProps {
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
}

export default function BookingsList({ bookings, onCancelBooking }: BookingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
    const dateObj = new Date(dateStr + 'T12:00:00');
    return dateObj.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-black rounded-2xl p-8 border border-white/5 shadow-lg text-center max-w-xl mx-auto my-8 animate-fade-in-up">
        <div className="bg-[#1e2121] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Calendar className="w-10 h-10 text-racing-red" />
        </div>
        <h3 className="font-display font-extrabold text-bright-snow text-2xl mb-2">No Bookings Found</h3>
        <p className="text-sm text-gray-400 mb-6">
          You haven't booked any fittings or purchased any tyres yet. Browse our inventory, add tyres to your cart, and book your service.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-racing-red/30 inline-flex items-center gap-2"
        >
          Browse Tyres
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 space-y-6">
      <div className="border-b border-white/5 pb-4">
        <h2 className="font-display font-extrabold text-bright-snow text-3xl tracking-tight">Your Fitting Appointments & Purchases</h2>
        <p className="text-gray-400 text-sm mt-1">Manage, view, or cancel your tyre fitting bookings below.</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking, index) => {
          const isExpanded = expandedId === booking.id;
          const totalTyresCount = booking.cartItems.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div
              key={booking.id}
              className="bg-black rounded-2xl border border-white/5 shadow-lg hover:shadow-xl transition overflow-hidden shadow-[0_0_30px_rgba(239,18,25,0.15)] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Main Summary Panel */}
              <div
                onClick={() => toggleExpand(booking.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 select-none"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-gray-400/80">Order ID: {booking.id.toUpperCase()}</span>
                    {getStatusBadge(booking.status)}
                    {booking.fittingType === 'delivery' ? (
                      <span className="bg-white/5 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">Standard Delivery</span>
                    ) : (
                      <span className="bg-racing-red/10 text-racing-red border border-racing-red/20 text-xs font-bold px-2 py-0.5 rounded-full">
                        {booking.fittingType === 'shop' ? 'In-Shop Appointment' : 'Mobile Van Visit'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-bright-snow text-base flex flex-wrap items-center gap-1.5">
                    {booking.fittingType === 'delivery' ? (
                      <span>Direct Home Delivery</span>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 text-racing-red shrink-0" />
                        <span>{formatDate(booking.date)}</span>
                        <span className="text-gray-400/80 font-normal">at</span>
                        <Clock className="w-4 h-4 text-racing-red shrink-0 ml-1" />
                        <span className="font-mono">{booking.timeSlot}</span>
                      </>
                    )}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-gray-400/85" />
                      Vehicle: <strong className="font-mono bg-racing-red text-bright-snow px-1.5 py-0.5 rounded font-extrabold text-[11px]">{booking.vehicleRegistration}</strong> ({booking.vehicleMakeModel})
                    </span>
                    <span className="text-white/5">|</span>
                    <span>{totalTyresCount}x Tyres</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-gray-400 block font-semibold uppercase">Total Paid/Due</span>
                    <span className="font-display font-extrabold text-racing-red text-xl">£{booking.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-400 hover:text-racing-red transition">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded details block */}
              {isExpanded && (
                <div className="border-t border-white/5 bg-[#101212] p-6 space-y-6">
                  {/* Timeline progress indicator */}
                  {booking.status === 'Scheduled' && (
                    <div className="bg-black border border-white/5 rounded-xl p-4 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Live Booking Progress</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-emerald-600 text-bright-snow rounded-full flex items-center justify-center text-xs font-bold">✔</div>
                          <div>
                            <span className="block text-xs font-bold text-bright-snow">Order Registered</span>
                            <span className="text-[10px] text-gray-400/80">Stock is securely locked</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-white/5">
                          <div className="w-7 h-7 bg-blue-700 text-bright-snow rounded-full flex items-center justify-center text-xs font-bold">2</div>
                          <div>
                            <span className="block text-xs font-bold text-blue-300">Tyres Dispatched</span>
                            <span className="text-[10px] text-gray-400">Allocated to fitting bay</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-white/5">
                          <div className="w-7 h-7 bg-white/5 text-gray-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                          <div>
                            <span className="block text-xs font-bold text-gray-400/80">Awaiting Fitting</span>
                            <span className="text-[10px] text-gray-400/80">
                              {booking.fittingType === 'delivery' ? 'Home Delivery' : 'Drive down or receive van'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer and Shop Information Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info Card */}
                    <div className="bg-black border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-racing-red" />
                        Customer Information
                      </h4>
                      <div className="space-y-2 text-xs text-gray-400">
                        <p className="flex justify-between">
                          <span className="font-semibold text-gray-400/80">Name:</span>
                          <span className="font-bold text-bright-snow">{booking.customerName}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-semibold text-gray-400/80">Email:</span>
                          <span className="font-bold text-bright-snow">{booking.customerEmail}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-semibold text-gray-400/80">Phone:</span>
                          <span className="font-bold text-bright-snow font-mono">{booking.customerPhone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Shop Coordinates or Delivery Info */}
                    <div className="bg-black border border-white/5 rounded-xl p-4 shadow-sm space-y-3">
                      {booking.fittingType === 'delivery' ? (
                        <>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-racing-red" />
                            Delivery Coordinates
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                            Standard shipping destination: Doorstep delivery address registered on booking form files. Tracking code will be generated upon carrier pick up.
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-racing-red" />
                            {booking.fittingType === 'shop' ? 'Shop Location Address' : 'Mobile Dispatch Center'}
                          </h4>
                          <div className="text-xs text-gray-400 space-y-1">
                            <p className="font-bold text-bright-snow">Arsh Autos Auto Tyre Shop</p>
                            <p>48 Harrow Road, Harrow</p>
                            <p>London, HA1 2YF</p>
                            <p className="font-semibold text-racing-red pt-1">Tel: 020 8427 1234</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Complete Invoice breakdown */}
                  <div className="bg-black border border-white/5 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Invoice / Receipt Summary</h4>
                      <button
                        onClick={() => window.print()}
                        type="button"
                        className="text-gray-400 hover:text-bright-snow text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Invoice
                      </button>
                    </div>

                    <div className="space-y-3 divide-y divide-white/5 text-xs">
                      {booking.cartItems.map((item) => (
                        <div key={item.tyre.id} className="pt-2 flex justify-between items-start">
                          <div>
                            <span className="font-bold text-bright-snow">{item.tyre.brand} {item.tyre.model}</span>
                            <span className="block text-[10px] text-gray-400/80 font-mono mt-0.5">
                              {item.tyre.width}/{item.tyre.profile} R{item.tyre.rim} {item.tyre.loadIndex}{item.tyre.speedRating} ({item.tyre.category})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-medium text-gray-400">{item.quantity}x @ £{item.tyre.price.toFixed(2)}</span>
                            <span className="block font-bold text-bright-snow font-mono mt-0.5">£{(item.tyre.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}

                      {/* Fitting line */}
                      <div className="pt-3 flex justify-between items-center text-gray-400">
                        <span>
                          {booking.fittingType === 'shop' && 'In-Shop Valve, Balancing & Disposal Fitting'}
                          {booking.fittingType === 'mobile' && 'Mobile Fleet Van Dispatch (Callout Fee)'}
                          {booking.fittingType === 'delivery' && 'Home Delivery Shipping'}
                        </span>
                        <span className="font-bold text-bright-snow font-mono">
                          {booking.fittingFee === 0 ? 'FREE' : `£${booking.fittingFee.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Complete Invoice pricing summary footer */}
                      <div className="pt-3 border-t-2 border-white/5 flex flex-col items-end space-y-1.5 text-xs font-medium">
                        <div className="flex justify-between w-full max-w-xs">
                          <span className="text-gray-400/85">Subtotal:</span>
                          <span className="font-mono text-bright-snow">£{booking.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-xs">
                          <span className="text-gray-400/85">VAT (20% Included):</span>
                          <span className="font-mono text-bright-snow">£{(booking.totalPrice * 0.2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between w-full max-w-xs pt-1.5 border-t border-white/5 font-bold text-sm">
                          <span className="text-bright-snow">Grand Total:</span>
                          <span className="font-mono text-racing-red text-base">£{booking.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (like canceling) */}
                  {booking.status === 'Scheduled' && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to cancel this booking appointment?')) {
                            onCancelBooking(booking.id);
                          }
                        }}
                        type="button"
                        className="text-racing-red hover:bg-[#1e2121] hover:text-racing-red/90 text-xs font-bold px-4 py-2.5 rounded-lg border border-racing-red/20 transition flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        Cancel Fitting Appointment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
