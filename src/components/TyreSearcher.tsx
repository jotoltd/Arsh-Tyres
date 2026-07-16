import React from 'react';
import { SearchFilters } from '../types';
import { WIDTHS, PROFILES, RIMS, SPEED_RATINGS } from '../data';
import { Search, Info } from 'lucide-react';

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
  const handleSelectChange = (key: keyof SearchFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="carbon-fiber rounded-2xl shadow-2xl border border-white/5 overflow-hidden max-w-5xl mx-auto shadow-[0_0_40px_rgba(220,38,38,0.4)] border-racing-red/40 relative">
      {/* Ribbon Banner */}
      <div className="absolute top-0 right-0 z-10">
        <div className="bg-racing-red text-bright-snow font-extrabold text-xs uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-lg">
          Tyre Finder
        </div>
      </div>
      <div className="p-8 md:p-12">
        <div className="mb-8">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-bright-snow mb-3 flex items-center gap-3">
            <Search className="w-7 h-7 text-racing-red" />
            Find Your Perfect Tyres
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Width Selector */}
          <div>
            <label className="block text-xs uppercase text-bright-snow/80 font-bold tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-racing-red rounded-full"></span>
              Width
            </label>
            <select
               value={filters.width}
               onChange={(e) => handleSelectChange('width', e.target.value)}
               className="w-full bg-[#1e2121] border-2 border-white/10 text-bright-snow rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/30 focus:border-racing-red font-bold text-lg neon-border-focus transition-all"
            >
              <option value="" className="bg-[#1e2121]">Select Width</option>
              {WIDTHS.map(w => (
                <option key={w} value={w} className="bg-[#1e2121]">{w} mm</option>
              ))}
            </select>
          </div>

          {/* Profile Selector */}
          <div>
            <label className="block text-xs uppercase text-bright-snow/80 font-bold tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-racing-red rounded-full"></span>
              Profile
            </label>
            <select
              value={filters.profile}
              onChange={(e) => handleSelectChange('profile', e.target.value)}
              className="w-full bg-[#1e2121] border-2 border-white/10 text-bright-snow rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/30 focus:border-racing-red font-bold text-lg neon-border-focus transition-all"
            >
              <option value="" className="bg-[#1e2121]">Select Profile</option>
              {PROFILES.map(p => (
                <option key={p} value={p} className="bg-[#1e2121]">{p}%</option>
              ))}
            </select>
          </div>

          {/* Rim Size Selector */}
          <div>
            <label className="block text-xs uppercase text-bright-snow/80 font-bold tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-racing-red rounded-full"></span>
              Rim Size
            </label>
            <select
              value={filters.rim}
              onChange={(e) => handleSelectChange('rim', e.target.value)}
              className="w-full bg-[#1e2121] border-2 border-white/10 text-bright-snow rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/30 focus:border-racing-red font-bold text-lg neon-border-focus transition-all"
            >
              <option value="" className="bg-[#1e2121]">Select Rim</option>
              {RIMS.map(r => (
                <option key={r} value={r} className="bg-[#1e2121]">{r} inches</option>
              ))}
            </select>
          </div>

          {/* Speed Rating Selector */}
          <div>
            <label className="block text-xs uppercase text-bright-snow/80 font-bold tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-racing-red rounded-full"></span>
              Speed Rating
            </label>
            <select
              value={filters.speedRating}
              onChange={(e) => handleSelectChange('speedRating', e.target.value)}
              className="w-full bg-[#1e2121] border-2 border-white/10 text-bright-snow rounded-xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-racing-red/30 focus:border-racing-red font-bold text-lg neon-border-focus transition-all"
            >
              <option value="" className="bg-[#1e2121]">Any Speed</option>
              {SPEED_RATINGS.map(sr => (
                <option key={sr.code} value={sr.code} className="bg-[#1e2121]">
                  {sr.code} ({sr.desc.split(' (')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-bright-snow/70 text-sm md:text-base flex items-center gap-2 mb-6">
          <Info className="w-4 h-4 text-racing-red shrink-0" />
          Enter your tyre dimensions from the sidewall (e.g., 205/55 R16 91V)
        </p>

        <div className="flex flex-wrap justify-end gap-4 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClear}
            className="px-6 py-3 text-sm font-bold text-bright-snow/70 hover:text-bright-snow hover:bg-white/5 rounded-xl transition border border-white/10 hover:border-white/20"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center gap-3 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm tracking-widest uppercase px-8 py-3.5 rounded-xl transition shadow-lg hover:shadow-xl hover:shadow-racing-red/20 border-2 border-racing-red"
          >
            <Search className="w-5 h-5" />
            Find Tyres
          </button>
        </div>
      </div>
    </div>
  );
}
