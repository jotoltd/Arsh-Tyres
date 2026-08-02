import React, { useState } from 'react';
import { SearchFilters } from '../types';
import { WIDTHS, PROFILES, RIMS, TYRE_TYPES } from '../data';
import { Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TyreSearcherProps {
  filters: SearchFilters;
  onFilterChange: (newFilters: SearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function TyreSearcher({
  filters,
  onFilterChange,
  onSearch,
  onClear
}: TyreSearcherProps) {
  const [showGuide, setShowGuide] = useState(false);
  const handleSelectChange = (key: keyof SearchFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center bg-[#1e2121] rounded-2xl p-3 border border-white/10 shadow-2xl">
        <select
           value={filters.width}
           onChange={(e) => handleSelectChange('width', e.target.value)}
           className="flex-1 bg-black/60 border border-white/10 text-bright-snow rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/40 focus:border-racing-red font-bold text-base transition"
        >
          <option value="">Width</option>
          {WIDTHS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <span className="hidden sm:block text-bright-snow/30 font-bold text-lg">/</span>

        <select
          value={filters.profile}
          onChange={(e) => handleSelectChange('profile', e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 text-bright-snow rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/40 focus:border-racing-red font-bold text-base transition"
        >
          <option value="">Profile</option>
          {PROFILES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <span className="hidden sm:block text-bright-snow/30 font-bold text-lg">R</span>

        <select
          value={filters.rim}
          onChange={(e) => handleSelectChange('rim', e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 text-bright-snow rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/40 focus:border-racing-red font-bold text-base transition"
        >
          <option value="">Rim</option>
          {RIMS.map(r => (
            <option key={r} value={r}>{r}"</option>
          ))}
        </select>

        <button
          type="button"
          onClick={onSearch}
          className="flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-lg shadow-racing-red/30 whitespace-nowrap"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 px-1">
        <select
          value={filters.category === 'All' ? '' : filters.category}
          onChange={(e) => handleSelectChange('category', e.target.value || 'All')}
          className="bg-transparent text-bright-snow/70 text-xs font-bold border-none focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-[#1e2121]">All Types</option>
          {TYRE_TYPES.map(t => (
            <option key={t} value={t} className="bg-[#1e2121]">
              {t === 'Commercial' ? 'Commercial (Van)' : t}
            </option>
          ))}
        </select>
        {(filters.width || filters.profile || filters.rim) && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-bright-snow/40 hover:text-bright-snow transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tyre Size Guide */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-xs font-bold text-bright-snow/60 hover:text-bright-snow transition"
        >
          <HelpCircle className="w-4 h-4 text-racing-red" />
          How to find your tyre size
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showGuide && (
          <div className="mt-3 bg-[#1e2121] rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up">
            <img
              src="/assets/how_to_tyres.png"
              alt="How to find your tyre size guide"
              className="w-full h-auto"
            />
            <div className="p-4 text-sm text-bright-snow/60 leading-relaxed">
              <p className="mb-2">
                <span className="text-bright-snow font-bold">Width</span> — the first number (e.g. 205) is the tyre width in millimetres.
              </p>
              <p className="mb-2">
                <span className="text-bright-snow font-bold">Profile</span> — the second number (e.g. 55) is the sidewall height as a percentage of the width.
              </p>
              <p className="mb-2">
                <span className="text-bright-snow font-bold">Rim</span> — the number after 'R' (e.g. 16) is the wheel diameter in inches.
              </p>
              <p className="text-xs text-bright-snow/40 mt-3 pt-3 border-t border-white/5">
                You can find these numbers on the sidewall of your tyre, or in your vehicle's handbook.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
