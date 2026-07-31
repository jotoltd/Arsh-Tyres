import React, { useState } from 'react';
import { Tyre } from '../types';
import { getUnitPrice } from '../data';
import { ShoppingBag, ShieldCheck, Truck, Layers, Disc, Wrench, Check } from 'lucide-react';

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
      case 'Runflat':
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'Commercial':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-racing-red" />;
    }
  };

  return (
    <div className="bg-[#1e2121] rounded-2xl border border-white/5 hover:border-white/15 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col h-full overflow-hidden">
      {/* Tyre Image Area */}
      <div className="relative h-36 w-full bg-black/40 overflow-hidden flex items-center justify-center border-b border-white/5">
        {!tyre.imageUrl || imageError ? (
          <div className="flex flex-col items-center text-gray-600">
            <Disc className="w-12 h-12 mb-1 opacity-40" />
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
        {/* Category badge overlay */}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          tyre.category === 'Runflat' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
          tyre.category === 'Commercial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          'bg-racing-red/20 text-racing-red border border-racing-red/30'
        }`}>
          {getCategoryIcon(tyre.category)}
          {tyre.category}
        </span>
        {/* Stock badge */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          tyre.stock > 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-racing-red/20 text-racing-red border border-racing-red/30'
        }`}>
          {tyre.stock > 8 ? 'In stock' : `Only ${tyre.stock} left`}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Brand + Model */}
        <div className="mb-3">
          <span className="text-[11px] uppercase tracking-wider font-bold text-racing-red block">{tyre.brand}</span>
          <h3 className="font-display font-bold text-base text-bright-snow leading-snug">{tyre.model}</h3>
        </div>

        {/* Size — inline, compact */}
        <div className="font-mono text-sm font-bold text-bright-snow bg-black/40 rounded-lg px-3 py-2 mb-3 flex items-center justify-center gap-1">
          <span>{tyre.width}</span>
          <span className="text-gray-500">/</span>
          <span>{tyre.profile}</span>
          <span className="text-gray-500 text-xs">R</span>
          <span>{tyre.rim}{tyre.category === 'Commercial' ? 'C' : ''}</span>
          {(tyre.loadIndex || tyre.speedRating) && (
            <span className="text-racing-red ml-1">{tyre.loadIndex}{tyre.speedRating}</span>
          )}
        </div>

        {/* Fitting included */}
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mb-3">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>Fitting, balancing & valves included</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-display text-2xl font-extrabold text-bright-snow">£{getUnitPrice(tyre, quantity).toFixed(2)}</span>
            <span className="text-gray-500 text-xs">/ tyre</span>
          </div>
          {tyre.price4 !== undefined && (
            <div className={`text-[11px] font-bold mb-3 ${quantity >= 4 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {quantity >= 4
                ? `✓ Multi-buy price applied (was £${tyre.price.toFixed(2)})`
                : `Buy 4+ for £${tyre.price4.toFixed(2)} each`}
            </div>
          )}
          {tyre.price4 === undefined && <div className="mb-3" />}

          {/* Quantity + Add */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center border border-white/10 rounded-lg overflow-hidden h-10 shrink-0 bg-black/40">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 hover:bg-white/5 font-bold text-gray-400 transition disabled:opacity-30"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-3 font-mono font-bold text-sm text-bright-snow">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => Math.min(tyre.stock, prev + 1))}
                className="px-3 py-1 hover:bg-white/5 font-bold text-gray-400 transition disabled:opacity-30"
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
                  : 'bg-racing-red hover:bg-racing-red/90 text-bright-snow shadow-md hover:shadow-lg'
              }`}
            >
              {isAdded ? (
                <><Check className="w-4 h-4" /> Added!</>
              ) : (
                <><ShoppingBag className="w-4 h-4" /> Add {quantity}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
