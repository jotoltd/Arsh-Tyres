import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tyre, SearchFilters } from '../types';
import { useSupabase } from '../contexts/SupabaseContext';
import TyreCard from '../components/TyreCard';
import { Disc, ArrowLeft, Search, Calendar, ShoppingBag, User, Phone } from 'lucide-react';
import { SkeletonGrid } from '../components/Skeleton';

export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tyres, tyresLoading, tyresError, cartItems, bookings } = useSupabase();
  const filters = location.state?.filters as SearchFilters || {
    width: '',
    profile: '',
    rim: '',
    speedRating: '',
    category: 'All'
  };

  const [isLoading, setIsLoading] = useState(true);
  const [filteredTyres, setFilteredTyres] = useState<Tyre[]>([]);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      const results = tyres.filter(tyre => {
        if (filters.width && tyre.width !== parseInt(filters.width)) return false;
        if (filters.profile && tyre.profile !== parseInt(filters.profile)) return false;
        if (filters.rim && tyre.rim !== parseInt(filters.rim)) return false;
        if (filters.speedRating && tyre.speedRating !== filters.speedRating) return false;
        if (filters.category !== 'All' && tyre.category !== filters.category) return false;
        return true;
      });
      setFilteredTyres(results);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, tyres]);

  const handleAddToCart = (tyre: Tyre, quantity: number) => {
    // Navigate back to home with cart action
    navigate('/cart', { state: { addToCart: { tyre, quantity } } });
  };

  const totalCartTyres = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const scheduledCount = bookings.filter(b => b.status === 'Scheduled').length;

  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => navigate('/shop')}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition text-racing-red"
        >
          <Search className="w-4 h-4" />
          <span className="text-[9px] font-bold">Tyres</span>
        </button>
        <button
          onClick={() => navigate('/bookings')}
          className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition text-bright-snow/40`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9px] font-bold">Bookings</span>
          {scheduledCount > 0 && (
            <span className="absolute top-1 right-[calc(50%-22px)] bg-racing-red text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {scheduledCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/cart')}
          className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition text-bright-snow/40`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[9px] font-bold">Order</span>
          {cartItems.length > 0 && (
            <span className="absolute top-1 right-[calc(50%-22px)] bg-racing-red text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {totalCartTyres}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/contact')}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition text-bright-snow/40"
        >
          <Phone className="w-4 h-4" />
          <span className="text-[9px] font-bold">Contact</span>
        </button>
        <button
          onClick={() => navigate('/account')}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition text-bright-snow/40"
        >
          <User className="w-4 h-4" />
          <span className="text-[9px] font-bold">Account</span>
        </button>
      </div>
    </nav>
  );

  if (isLoading || tyresLoading) {
    return (
      <div className="min-h-screen bg-black text-bright-snow font-sans antialiased pb-20 md:pb-8">
        <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-bright-snow/60 hover:text-bright-snow transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold">Back to Search</span>
            </button>
            <h1 className="font-display font-black text-xl text-bright-snow">Search Results</h1>
            <div className="w-24"></div>
          </div>
        </header>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="font-display font-extrabold text-bright-snow text-xl flex items-center gap-2">
                  <Disc className="w-5 h-5 text-racing-red" />
                  Searching...
                </h2>
                <p className="text-xs text-bright-snow/60 mt-1">
                  Finding premium tyres matching your specification.
                </p>
              </div>
            </div>
            <SkeletonGrid count={6} />
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-bright-snow font-sans antialiased pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-bright-snow/60 hover:text-bright-snow transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back to Search</span>
          </button>
          <h1 className="font-display font-black text-xl text-bright-snow">Search Results</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="font-display font-extrabold text-bright-snow text-xl flex items-center gap-2">
                <Disc className="w-5 h-5 text-racing-red" />
                Search Results
              </h2>
              <p className="text-xs text-bright-snow/60 mt-1">
                Found {filteredTyres.length} premium tyres matching your specification.
              </p>
            </div>

            {/* Categories tab filters */}
            <div className="flex gap-1 bg-black p-1 rounded-xl border border-white/5">
              {['All', 'Standard', 'Runflat', 'Commercial'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const newFilters = { ...filters, category: cat };
                    navigate('/search-results', { state: { filters: newFilters }, replace: true });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
                    filters.category === cat
                      ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                      : 'text-bright-snow/60 hover:text-bright-snow'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {filteredTyres.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTyres.map((tyre) => (
                <TyreCard
                  key={tyre.id}
                  tyre={tyre}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="bg-black border border-white/5 rounded-2xl p-8 text-center shadow-md w-full">
              <span className="text-3xl block mb-2 text-racing-red">ℹ</span>
              <h4 className="font-display font-bold text-bright-snow mb-1">No Matches Found</h4>
              <p className="text-xs text-bright-snow/60 mb-4">
                The requested combination doesn't have local warehouse stock right now.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-xs px-4 py-2 rounded-lg transition"
              >
                Back to Search
              </button>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
