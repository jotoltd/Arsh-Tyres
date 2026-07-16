import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tyre, SearchFilters } from '../types';
import { useSupabase } from '../contexts/SupabaseContext';
import TyreCard from '../components/TyreCard';
import { Disc, ArrowLeft, Search } from 'lucide-react';

export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tyres, tyresLoading, tyresError } = useSupabase();
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
    navigate('/', { state: { addToCart: { tyre, quantity } } });
  };

  if (isLoading || tyresLoading) {
    return (
      <div className="min-h-screen bg-black text-bright-snow font-sans antialiased flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-racing-red/30 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-10 h-10 text-racing-red" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-bright-snow">
              Finding your best match...
            </h2>
            <p className="text-gray-400 text-sm">Searching through our premium tyre database</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-bright-snow font-sans antialiased pb-16">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-bright-snow transition"
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
              <p className="text-xs text-gray-400 mt-1">
                Found {filteredTyres.length} premium tyres matching your specification.
              </p>
            </div>

            {/* Categories tab filters */}
            <div className="flex gap-1 bg-black p-1 rounded-xl border border-white/5">
              {['All', 'Summer', 'Winter', 'All-Season'].map((cat) => (
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
                      : 'text-gray-400 hover:text-bright-snow'
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
              <p className="text-xs text-gray-400 mb-4">
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
    </div>
  );
}
