import React, { useState, useEffect } from 'react';
import { TIME_SLOTS } from '../data';
import { Calendar as CalendarIcon, Clock, Wrench, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface BookingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  selectedTimeSlot: string;
  onTimeSlotChange: (slot: string) => void;
  fittingType: 'fitting' | 'mobile' | 'delivery';
}

export default function BookingCalendar({
  selectedDate,
  onDateChange,
  selectedTimeSlot,
  onTimeSlotChange,
  fittingType
}: BookingCalendarProps) {
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const configured = isSupabaseConfigured();

  // Load booked slots from Supabase for the next 14 days
  useEffect(() => {
    if (!configured) return;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 15);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    supabase
      .from('bookings')
      .select('booking_date, booking_time')
      .gte('booking_date', startStr)
      .lte('booking_date', endStr)
      .neq('status', 'Cancelled')
      .then(({ data, error }) => {
        if (error || !data) return;
        const map: Record<string, string[]> = {};
        data.forEach((row: any) => {
          const date = row.booking_date;
          const time = row.booking_time;
          if (!map[date]) map[date] = [];
          map[date].push(time);
        });
        setBookedSlots(map);
      });
  }, [configured]);

  // Clear selected time slot if it becomes booked
  useEffect(() => {
    if (selectedDate && selectedTimeSlot && bookedSlots[selectedDate]?.includes(selectedTimeSlot)) {
      onTimeSlotChange('');
    }
  }, [bookedSlots, selectedDate, selectedTimeSlot, onTimeSlotChange]);

  // Generate next 14 days
  const getUpcomingDays = () => {
    const days = [];
    const baseDate = new Date();

    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + i);
      
      // Skip Sundays for fitting services
      if (nextDate.getDay() === 0) continue;

      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const dayName = nextDate.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNum = nextDate.getDate();
      const monthName = nextDate.toLocaleDateString('en-GB', { month: 'short' });

      days.push({
        dateString,
        dayName,
        dayNum,
        monthName
      });
    }
    return days;
  };

  const upcomingDays = getUpcomingDays();

  if (fittingType === 'delivery') {
    return (
      <div className="bg-racing-red/10 border border-racing-red/20 rounded-xl p-5 text-center">
        <span className="text-2xl mb-2 block">🚚</span>
        <h4 className="font-display font-bold text-bright-snow mb-1">Standard Home Delivery Only</h4>
        <p className="text-xs text-bright-snow/60 max-w-md mx-auto">
          We will ship your tyres directly to your delivery address within 1-2 working days. Tracking info will be sent via email. Fitting appointment is not required.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black border border-white/5 rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="bg-racing-red text-bright-snow p-2 rounded-lg">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-bright-snow text-base">Select Fitting Date & Time</h3>
          <p className="text-xs text-bright-snow/60">
            {fittingType === 'fitting'
              ? 'Bookings available from tomorrow onwards. Choose a date and time slot.'
              : 'Choose when our mobile fitting van will arrive at your home/work'}
          </p>
        </div>
      </div>

      {/* Date Carousel Selector */}
      <label className="block text-xs font-bold uppercase tracking-wider text-bright-snow/60 mb-3">1. Select Fitting Date</label>
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/5">
        {upcomingDays.map((day) => {
          const isSelected = selectedDate === day.dateString;
          return (
            <button
              key={day.dateString}
              type="button"
              onClick={() => onDateChange(day.dateString)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[72px] text-center transition ${
                isSelected
                  ? 'bg-racing-red border-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'bg-[#1e2121] border-white/5 text-bright-snow/60 hover:border-white/20 hover:text-bright-snow'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-bright-snow/85' : 'text-bright-snow/60/80'}`}>
                {day.dayName}
              </span>
              <span className="text-lg font-extrabold font-display my-0.5">{day.dayNum}</span>
              <span className={`text-[10px] font-semibold ${isSelected ? 'text-bright-snow/85' : 'text-bright-snow/60'}`}>
                {day.monthName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time Slot Selector */}
      <div className="mt-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-bright-snow/60 mb-3">2. Select Time Slot</label>
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            const isBooked = selectedDate && bookedSlots[selectedDate]?.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => onTimeSlotChange(slot)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-bold transition ${
                  isBooked
                    ? 'bg-black/40 border-white/5 text-bright-snow/30 cursor-not-allowed line-through opacity-50'
                    : isSelected
                    ? 'bg-racing-red border-racing-red text-bright-snow shadow-md font-extrabold'
                    : 'bg-[#1e2121] border-white/5 text-bright-snow/90 hover:border-white/20 hover:text-bright-snow'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                {slot}
                {isBooked && <span className="text-[9px] uppercase ml-1">Booked</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-bright-snow/40 mt-2">Morning: 8:30am–1pm · Afternoon: 1pm–6pm</p>
      </div>

      {/* Included Services Badge */}
      <div className="mt-6 bg-[#1e2121] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-bright-snow font-bold text-xs uppercase tracking-wider">
          <Wrench className="w-4 h-4 text-racing-red" />
          <span>Professional Fitting Package Included</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-bright-snow/60 font-medium">
          <li className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>New tubeless rubber valves</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Precision computerized wheel balancing</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Eco-friendly old tyre recycling disposal</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Safety torque check & PSI adjustment</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
