import React, { useState } from 'react';
import { Tyre } from '../types';
import { ShoppingCart, Star, Eye, ShieldCheck, HelpCircle, Sun, Snowflake, Layers, Disc } from 'lucide-react';

interface TyreCardProps {
  tyre: Tyre;
  onAddToCart: (tyre: Tyre, qty: number) => void;
  key?: string;
}

export default function TyreCard({ tyre, onAddToCart }: TyreCardProps) {
  const [quantity, setQuantity] = useState(4); // default is usually 4 tyres for a full car replacement
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdd = () => {
    onAddToCart(tyre, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Summer':
        return <Sun className="w-3.5 h-3.5 text-racing-red" />;
      case 'Winter':
        return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-racing-red" />;
    }
  };

  const getEUClassColor = (grade: 'A' | 'B' | 'C' | 'D' | 'E') => {
    switch (grade) {
      case 'A': return 'bg-emerald-500 text-white';
      case 'B': return 'bg-teal-500 text-white';
      case 'C': return 'bg-yellow-500 text-black font-bold';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-racing-red text-white';
    }
  };

  return (
    <div className="carbon-fiber rounded-xl border border-white/5 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Tyre Image */}
      <div className="relative h-44 w-full bg-[#1a1d1d] overflow-hidden flex items-center justify-center border-b border-white/5">
        {!tyre.imageUrl || imageError ? (
          <div className="flex flex-col items-center text-gray-500">
            <Disc className="w-14 h-14 mb-2 opacity-40" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tyre.brand}</span>
          </div>
        ) : (
          <img
            src={tyre.imageUrl}
            alt={`${tyre.brand} ${tyre.model}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Top Banner with Badges */}
      <div className="p-4 pb-0 flex justify-between items-center">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          tyre.category === 'Summer' ? 'bg-racing-red/10 text-racing-red border border-racing-red/20' :
          tyre.category === 'Winter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
          'bg-racing-red/10 text-bright-snow border border-racing-red/20'
        }`}>
          {getCategoryIcon(tyre.category)}
          {tyre.category}
        </span>

        <div className="flex gap-1">
          {tyre.isRunflat && (
            <span className="bg-white/10 text-bright-snow/95 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-white/5" title="Runflat Technology">
              RFT
            </span>
          )}
          {tyre.isReinforced && (
            <span className="bg-racing-red/10 text-bright-snow border border-racing-red/20 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" title="Extra Load / Reinforced">
              XL
            </span>
          )}
        </div>
      </div>

      {/* Tyre Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-racing-red block mb-0.5">{tyre.brand}</span>
          <h3 className="font-display font-bold text-lg text-bright-snow leading-snug">{tyre.model}</h3>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex text-yellow-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 fill-current ${
                  i < Math.floor(tyre.rating) ? 'text-yellow-400' : 'text-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-bright-snow/90">{tyre.rating}</span>
          <span className="text-[11px] text-gray-400">({tyre.reviewsCount} reviews)</span>
        </div>

        {/* Size Code Display */}
        <div className="bg-[#1e2121] border border-white/5 rounded-lg p-3 mb-4">
          <div className="font-mono text-center font-bold text-bright-snow text-base flex justify-center items-center gap-1">
            <span className="text-bright-snow text-lg font-extrabold">{tyre.width}</span>
            <span className="text-gray-400 font-normal">/</span>
            <span className="text-bright-snow text-lg font-extrabold">{tyre.profile}</span>
            <span className="text-gray-400 font-normal text-sm ml-1">R</span>
            <span className="text-bright-snow text-lg font-extrabold">{tyre.rim}</span>
            <span className="text-racing-red ml-1.5 text-lg font-extrabold">{tyre.loadIndex}{tyre.speedRating}</span>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1 uppercase tracking-wider font-semibold">
            Width / Profile / Rim / Speed Code
          </p>
        </div>

        {/* EU Label Specifications Widget */}
        <div className="mt-auto border-t border-white/5 pt-4 mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400/80 mb-2">Official EU Tyre Label</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Fuel Efficiency */}
            <div className="bg-[#1e2121] border border-white/5 rounded p-1.5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Fuel</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">⛽</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${getEUClassColor(tyre.fuelEfficiency)}`}>
                  {tyre.fuelEfficiency}
                </span>
              </div>
            </div>

            {/* Wet Grip */}
            <div className="bg-[#1e2121] border border-white/5 rounded p-1.5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Grip</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">🌧️</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${getEUClassColor(tyre.wetGrip)}`}>
                  {tyre.wetGrip}
                </span>
              </div>
            </div>

            {/* Noise Rating */}
            <div className="bg-[#1e2121] border border-white/5 rounded p-1.5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Noise</span>
              <div className="flex items-center gap-0.5 mt-1">
                <span className="text-[10px] font-bold text-bright-snow">{tyre.noiseLevel} dB</span>
                <span className="text-[10px] text-gray-400">🔊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-auto">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Price per Tyre</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold text-bright-snow">£{tyre.price.toFixed(2)}</span>
              <span className="text-gray-400 text-xs font-medium">inc. VAT</span>
            </div>
          </div>

          <div className="text-right">
            {tyre.stock > 8 ? (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">In Stock</span>
            ) : (
              <span className="text-xs text-racing-red font-semibold bg-racing-red/10 border border-racing-red/20 px-2 py-0.5 rounded">Only {tyre.stock} Left</span>
            )}
          </div>
        </div>

        {/* Quantity and Add Selector */}
        <div className="mt-4 flex gap-2 items-center">
          <div className="flex items-center border border-white/5 rounded-lg overflow-hidden h-10 shrink-0 bg-[#1e2121]">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 hover:bg-white/5 font-semibold text-gray-400 transition"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-3 font-mono font-bold text-sm text-bright-snow">{quantity}</span>
            <button
              onClick={() => setQuantity(prev => Math.min(tyre.stock, prev + 1))}
              className="px-2.5 py-1 hover:bg-white/5 font-semibold text-gray-400 transition"
              disabled={quantity >= tyre.stock}
            >
              +
            </button>
          </div>

          <button
            onClick={handleAdd}
            className={`flex-1 h-10 font-bold text-xs tracking-wider uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-racing-red hover:bg-racing-red/90 text-bright-snow shadow-md hover:shadow-lg font-bold'
            }`}
          >
            {isAdded ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
