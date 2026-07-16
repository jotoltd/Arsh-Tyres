import React from 'react';
import { TIME_SLOTS } from '../data';
import { Calendar as CalendarIcon, Clock, Wrench, CheckCircle } from 'lucide-react';

interface BookingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  selectedTimeSlot: string;
  onTimeSlotChange: (slot: string) => void;
  fittingType: 'shop' | 'mobile' | 'delivery';
}

export default function BookingCalendar({
  selectedDate,
  onDateChange,
  selectedTimeSlot,
  onTimeSlotChange,
  fittingType
}: BookingCalendarProps) {
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
        <p className="text-xs text-gray-400 max-w-md mx-auto">
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
          <p className="text-xs text-gray-400">
            {fittingType === 'shop' 
              ? 'Choose when to bring your car into Arsh Autos Shop' 
              : 'Choose when our mobile fitting van will arrive at your home/work'}
          </p>
        </div>
      </div>

      {/* Date Carousel Selector */}
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">1. Select Fitting Date</label>
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
                  : 'bg-[#1e2121] border-white/5 text-gray-400 hover:border-white/20 hover:text-bright-snow'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-bright-snow/85' : 'text-gray-400/80'}`}>
                {day.dayName}
              </span>
              <span className="text-lg font-extrabold font-display my-0.5">{day.dayNum}</span>
              <span className={`text-[10px] font-semibold ${isSelected ? 'text-bright-snow/85' : 'text-gray-400'}`}>
                {day.monthName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time Slot Selector */}
      <div className="mt-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">2. Select Time Slot</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotChange(slot)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold font-mono transition ${
                  isSelected
                    ? 'bg-racing-red border-racing-red text-bright-snow shadow-sm font-extrabold'
                    : 'bg-[#1e2121] border-white/5 text-bright-snow/90 hover:border-white/20 hover:text-bright-snow'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Included Services Badge */}
      <div className="mt-6 bg-[#1e2121] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-bright-snow font-bold text-xs uppercase tracking-wider">
          <Wrench className="w-4 h-4 text-racing-red" />
          <span>Professional Fitting Package Included</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400 font-medium">
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
