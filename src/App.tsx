import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tyre, CartItem, Booking, SearchFilters } from './types';
import { getUnitPrice } from './data';
import { useSupabase } from './contexts/SupabaseContext';
import TyreSearcher from './components/TyreSearcher';
import TyreCard from './components/TyreCard';
import CartSection from './components/CartSection';
import BookingsList from './components/BookingsList';
import AdminPanel from './components/AdminPanel';
import SearchResults from './pages/SearchResults';
import {
  Wrench,
  Truck,
  MapPin,
  Clock,
  Star,
  Disc,
  Car,
  ShoppingBag,
  Calendar,
  Phone,
  AlertCircle,
  X,
  CheckCircle2,
  Info,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Award,
  Search,
  User,
  LogOut
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // State variables
  const [filters, setFilters] = useState<SearchFilters>({
    width: '',
    profile: '',
    rim: '',
    speedRating: '',
    category: 'All'
  });

  const [selectedReg, setSelectedReg] = useState('');
  const [selectedMakeModel, setSelectedMakeModel] = useState('');
  const [activeTab, setActiveTab] = useState<'shop' | 'bookings' | 'cart' | 'admin'>('shop');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'size'>('price-low');
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(null);

  const {
    tyres,
    cartItems,
    setCartItems,
    bookings,
    addBooking,
    cancelBooking,
    updateBookingStatus,
    user,
    signIn,
    signUp,
    signOut,
    tyresError
  } = useSupabase();

  // Auth UI state
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Cart operations
  const handleAddToCart = (tyre: Tyre, quantity: number) => {
    const updated = [...cartItems];
    const existingIndex = updated.findIndex(item => item.tyre.id === tyre.id);

    if (existingIndex >= 0) {
      updated[existingIndex].quantity += quantity;
    } else {
      updated.push({ tyre, quantity });
    }

    setCartItems(updated);

    // Navigate to cart tab
    setActiveTab('cart');
  };

  const handleUpdateCartQuantity = (tyreId: string, quantity: number) => {
    const updated = cartItems.map(item => {
      if (item.tyre.id === tyreId) {
        return { ...item, quantity };
      }
      return item;
    });
    setCartItems(updated);
  };

  const handleRemoveCartItem = (tyreId: string) => {
    const updated = cartItems.filter(item => item.tyre.id !== tyreId);
    setCartItems(updated);
  };

  // Booking operations
  const handleCompleteBooking = async (bookingData: {
    cartItems: CartItem[];
    subtotal: number;
    fittingFee: number;
    totalPrice: number;
    fittingType: 'shop' | 'collection';
    date: string;
    timeSlot: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleRegistration: string;
    vehicleMakeModel: string;
  }) => {
    const newBooking = await addBooking(bookingData);
    if (!newBooking) return;

    // Clear cart
    setCartItems([]);

    // Open receipt modal / show confirmed state
    setLastConfirmedBooking(newBooking);

    // Clear registration details
    setSelectedReg('');
    setSelectedMakeModel('');

    // Scroll to top to show confirmation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelBooking = async (bookingId: string) => {
    await cancelBooking(bookingId);
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await updateBookingStatus(bookingId, status);
  };

  // Search logic and filtering
  const handleRegSelected = (reg: string, makeModel: string) => {
    setSelectedReg(reg);
    setSelectedMakeModel(makeModel);
    setSearchTriggered(true);
    
    // Auto scroll down to filtered tyres
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const handleClearFilters = () => {
    setFilters({
      width: '',
      profile: '',
      rim: '',
      speedRating: '',
      category: 'All'
    });
    setSelectedReg('');
    setSelectedMakeModel('');
    setSearchTriggered(false);
  };

  const handleExecuteSearch = () => {
    navigate('/search-results', { state: { filters } });
  };

  // Handle "Add to cart" actions routed back from the search results page
  useEffect(() => {
    const payload = location.state?.addToCart as { tyre: Tyre; quantity: number } | undefined;
    if (payload) {
      handleAddToCart(payload.tyre, payload.quantity);
      navigate(location.pathname, { replace: true, state: { ...location.state, addToCart: undefined } });
    }
  }, [location.state, location.pathname, navigate]);

  // Get matching tyres from search parameters
  const filteredTyres = tyres.filter(tyre => {
    // Width filter
    if (filters.width && tyre.width !== parseInt(filters.width)) return false;
    // Profile filter
    if (filters.profile && tyre.profile !== parseInt(filters.profile)) return false;
    // Rim filter
    if (filters.rim && tyre.rim !== parseInt(filters.rim)) return false;
    // Speed Rating
    if (filters.speedRating && tyre.speedRating !== filters.speedRating) return false;
    // Category filter
    if (filters.category !== 'All' && tyre.category !== filters.category) return false;
    
    return true;
  });

  // Sort filtered results
  const sortedTyres = [...filteredTyres].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'size') return (b.width * b.profile * b.rim) - (a.width * a.profile * a.rim);
    return 0;
  });

  // Highlighted features / featured products for first visual entry
  const totalCartTyres = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-black text-bright-snow/90 font-sans antialiased pb-16">

      {/* Top Banner Message */}
      <div className="bg-racing-red text-bright-snow text-xs py-2 px-4 text-center font-semibold border-b border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
          <span>📍 48 Harrow Road, London, HA1 2YF</span>
          <span className="hidden sm:inline text-bright-snow/40">|</span>
          <span>📞 020 8427 1234</span>
          <span className="hidden md:inline text-bright-snow/40">|</span>
          <span className="text-yellow-300 font-black hidden md:inline">★ Next-day fitting slots available</span>
        </div>
      </div>

      {/* Main Brand Header */}
      <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/'); setActiveTab('shop'); setLastConfirmedBooking(null); }}>
            <div className="bg-racing-red text-bright-snow p-2 rounded-xl flex items-center justify-center shadow-md overflow-hidden racing-glow-sm">
              <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-20 h-20 object-contain" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-racing-red block leading-none">ARSH AUTOS</span>
              <h1 className="font-display font-black text-xl text-bright-snow tracking-tight flex items-center gap-1.5 leading-none mt-1">
                Auto Tyre Shop
              </h1>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => { navigate('/'); setActiveTab('shop'); setLastConfirmedBooking(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                activeTab === 'shop' && location.pathname === '/'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-gray-400 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              Find & Buy Tyres
            </button>

            <button
              onClick={() => { navigate('/'); setActiveTab('bookings'); setLastConfirmedBooking(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'bookings' && location.pathname === '/'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-gray-400 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <Calendar className="w-4 h-4" />
              My Bookings
              {bookings.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {bookings.filter(b => b.status === 'Scheduled').length}
                </span>
              )}
            </button>

            <button
              onClick={() => { navigate('/'); setActiveTab('cart'); setLastConfirmedBooking(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'cart' && location.pathname === '/'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-gray-400 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              My Order
              {cartItems.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => { navigate('/'); setActiveTab('admin'); setLastConfirmedBooking(null); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'admin' && location.pathname === '/'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-gray-400 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          </nav>

          {/* Auth + Order */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-gray-400">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-xs font-bold text-bright-snow bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('signin'); setShowAuth(true); setAuthError(''); }}
                className="flex items-center gap-1.5 text-xs font-bold text-bright-snow bg-racing-red hover:bg-racing-red/90 px-3 py-2 rounded-lg transition"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
            {cartItems.length > 0 && (
              <a
                onClick={() => { navigate('/'); setActiveTab('cart'); }}
                className="bg-[#1e2121] hover:bg-[#252828] text-bright-snow border border-gray-500/20 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-racing-red" />
                <span className="hidden sm:inline">My Order:</span>
                <span className="bg-racing-red text-bright-snow text-xs font-black w-6 h-6 rounded-full flex items-center justify-center font-mono">
                  {totalCartTyres}
                </span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Supabase fallback notice */}
      {tyresError && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 text-xs text-center py-2 px-4">
          {tyresError}
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2121] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-bright-snow">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h3>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-bright-snow transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError('');
                setAuthLoading(true);
                const { error } = authMode === 'signin'
                  ? await signIn(authEmail, authPassword)
                  : await signUp(authEmail, authPassword);
                setAuthLoading(false);
                if (error) {
                  setAuthError(error.message);
                } else {
                  setShowAuth(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-bright-snow focus:outline-none focus:border-racing-red"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-bright-snow focus:outline-none focus:border-racing-red"
                />
              </div>

              {authError && (
                <div className="text-racing-red text-xs font-semibold">{authError}</div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-racing-red hover:bg-racing-red/90 disabled:opacity-50 text-bright-snow font-bold text-sm py-2.5 rounded-lg transition"
              >
                {authLoading ? 'Please wait…' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-400">
              {authMode === 'signin' ? (
                <>
                  No account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-racing-red font-bold hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-racing-red font-bold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Body Grid */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/" element={
            <>
              {/* SUCCESS CONFIRMATION RECEIPT SCREEN */}
              {lastConfirmedBooking && (
                <div className="bg-black border border-emerald-500/20 rounded-3xl p-6 md:p-8 shadow-xl w-full text-center mb-12 space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Appointment & Purchase Confirmed!
                    </span>
                    <h2 className="font-display font-black text-2xl md:text-3xl text-white">Your Booking is Scheduled</h2>
                    <p className="text-gray-400 text-sm w-full">
                      Thank you for choosing Arsh Autos! We have secured your selected tyres. A receipt and calendar invitation have been registered in your system files.
                    </p>
                    {/* Receipt Quick Info Card */}
                    <div className="bg-black border border-white/10 rounded-2xl p-5 text-left divide-y divide-white/10 w-full text-xs space-y-3.5">
                      <div className="flex justify-between items-center pb-2">
                        <span className="font-bold text-gray-500 uppercase">Booking Reference</span>
                        <span className="font-mono font-extrabold text-racing-red bg-racing-red/10 border border-racing-red/20 px-2 py-0.5 rounded text-[13px]">{lastConfirmedBooking.id.toUpperCase()}</span>
                      </div>

                      {lastConfirmedBooking.fittingType !== 'delivery' ? (
                        <div className="pt-3 space-y-2 text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-racing-red shrink-0" />
                            <span className="font-bold">
                              {new Date(lastConfirmedBooking.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-racing-red shrink-0" />
                            <span>Arrival Window: <strong className="font-mono">{lastConfirmedBooking.timeSlot}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-racing-red shrink-0" />
                            <span>
                              {lastConfirmedBooking.fittingType === 'shop'
                                ? 'Fitting Location: Arsh Autos, 48 Harrow Road, London, HA1 2YF'
                                : `Mobile Fitting: Sent to customer contact address for reg plate ${lastConfirmedBooking.vehicleRegistration}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 text-gray-300 font-semibold flex items-center gap-2">
                          <Truck className="w-4 h-4 text-racing-red shrink-0" />
                          <span>Doorstep shipping dispatch initiated - Delivery in 1-2 working days.</span>
                        </div>
                      )}

                      <div className="pt-3 space-y-2">
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-500">Vehicle:</span>
                          <span className="text-bright-snow font-bold font-mono bg-racing-red px-1.5 py-0.5 rounded">{lastConfirmedBooking.vehicleRegistration}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-500">Total Charged:</span>
                          <span className="text-racing-red font-bold text-sm">£{lastConfirmedBooking.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={() => setLastConfirmedBooking(null)}
                      className="bg-[#1e1e1e] hover:bg-white/10 border border-white/10 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
                    >
                      Go Back to Searcher
                    </button>
                    <button
                      onClick={() => { setActiveTab('bookings'); setLastConfirmedBooking(null); }}
                      className="bg-racing-red hover:bg-racing-red/95 text-bright-snow font-extrabold text-xs px-5 py-2.5 rounded-lg transition"
                    >
                      View in My Bookings Tab
                    </button>
                  </div>
                </div>
              )}

              {/* BOOKINGS TAB */}
              {activeTab === 'bookings' && (
                <BookingsList bookings={bookings} onCancelBooking={handleCancelBooking} />
              )}

              {/* ADMIN TAB */}
              {activeTab === 'admin' && (
                <AdminPanel bookings={bookings} onUpdateBooking={handleUpdateBookingStatus} />
              )}

              {/* FIND & SHOP TAB */}
              {activeTab === 'shop' && !lastConfirmedBooking && (
                <div className="space-y-8">
                {/* HERO */}
                <section
                  className="relative overflow-hidden min-h-[700px] flex items-center justify-center"
                  style={{ backgroundImage: 'url(/assets/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {/* Layered overlays for depth */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80" />
                  {/* Red glow accents */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-racing-red/10 blur-[140px] rounded-full" />
                  <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-racing-red/5 blur-[100px] rounded-full" />

                  <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-8">
                    {/* Logo with glow ring */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-racing-red/20 blur-2xl rounded-full scale-110" />
                      <div className="relative bg-black/70 backdrop-blur-md rounded-3xl p-3 border border-white/10 shadow-2xl">
                        <img src="/assets/logo.jpg" alt="Arsh Autos" className="w-48 h-48 rounded-2xl object-contain" />
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="h-px w-8 bg-racing-red/50" />
                        <span className="text-racing-red text-xs font-bold uppercase tracking-[0.3em]">Premium Tyre Fitting</span>
                        <span className="h-px w-8 bg-racing-red/50" />
                      </div>
                      <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05] drop-shadow-2xl">
                        New tyres,
                        <br />
                        <span className="text-racing-red">fitted at our shop.</span>
                      </h2>
                      <p className="text-base sm:text-lg text-white/80 max-w-lg leading-relaxed">
                        Search our range, pick a time that works for you, pay online or in shop.
                      </p>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">500+</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Tyres in stock</div>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">30min</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Avg fitting</div>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">All</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Premium brands</div>
                      </div>
                    </div>

                    {/* Search — glassmorphism container */}
                    <div className="w-full pt-2">
                      <TyreSearcher
                        filters={filters}
                        onFilterChange={setFilters}
                        onSearch={handleExecuteSearch}
                        onClear={handleClearFilters}
                      />
                    </div>

                    {/* Trust signals — pill style */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Fitting included
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> Pick your own slot
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/90">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Online or in-shop payment
                      </span>
                    </div>
                  </div>

                  {/* Bottom location strip */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md border-t border-white/5 py-2.5">
                    <div className="flex items-center justify-center gap-4 text-[11px] text-white/70">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-racing-red" /> 48 Harrow Road, HA1 2YF</span>
                      <span className="hidden sm:inline text-gray-600">·</span>
                      <span className="hidden sm:flex items-center gap-1.5"><Phone className="w-3 h-3 text-racing-red" /> 020 8427 1234</span>
                      <span className="hidden sm:inline text-gray-600">·</span>
                      <span className="hidden sm:flex items-center gap-1.5"><Clock className="w-3 h-3 text-racing-red" /> Mon–Sat 8:30–6</span>
                    </div>
                  </div>
                </section>

                {/* CATEGORY CARDS — like Just Eat cuisine cards */}
                <section>
                  <h3 className="font-display font-extrabold text-bright-snow text-lg mb-4 px-1">Browse by type</h3>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { label: 'Standard', desc: 'Everyday car tyres', icon: '🚗', color: 'racing-red' },
                      { label: 'Runflat', desc: 'Puncture-safe tyres', icon: '🛡️', color: 'blue-500' },
                      { label: 'Commercial', desc: 'Van & heavy-duty', icon: '🚐', color: 'amber-500' },
                    ].map(cat => (
                      <button
                        key={cat.label}
                        onClick={() => { setFilters({ ...filters, category: cat.label }); setSearchTriggered(true); setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                        className="bg-[#1e2121] hover:bg-[#252828] border border-white/5 hover:border-white/15 rounded-2xl p-4 sm:p-5 text-left transition group"
                      >
                        <span className="text-2xl sm:text-3xl block mb-2">{cat.icon}</span>
                        <p className="font-display font-bold text-bright-snow text-sm sm:text-base">{cat.label}</p>
                        <p className="text-[11px] text-gray-400 hidden sm:block">{cat.desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* SERVICES STRIP — compact */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#1e2121] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-racing-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-racing-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-bright-snow text-sm">TPMS Sensors</p>
                      <p className="text-xs text-gray-400 truncate">Autel sensors — fitting & programming. Call for quote.</p>
                    </div>
                    <a href="tel:02084271234" className="text-xs font-bold text-racing-red hover:text-racing-red/80 whitespace-nowrap shrink-0">
                      Call →
                    </a>
                  </div>
                  <div className="bg-[#1e2121] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-racing-red/20 rounded-xl flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-racing-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-bright-snow text-sm">Locking Nut Removal</p>
                      <p className="text-xs text-gray-400 truncate">Lost your key? £20 per nut. Add at checkout.</p>
                    </div>
                  </div>
                </section>

                {/* RESULTS SECTION - only show after search */}
                {searchTriggered && (
              <section id="results-section" className="space-y-6 scroll-mt-24">
                <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="font-display font-extrabold text-bright-snow text-xl">
                        {filteredTyres.length} tyres found
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {filters.width || filters.profile || filters.rim
                          ? `${filters.width || '?'}/${filters.profile || '?'} R${filters.rim || '?'}`
                          : 'Showing all tyres'}
                      </p>
                    </div>

                    {/* Sort dropdown */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'price-low' | 'price-high' | 'size')}
                      className="bg-[#1e2121] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-racing-red transition"
                    >
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="size">Size: Largest first</option>
                    </select>
                  </div>

                  {/* Filter chips */}
                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Standard', 'Runflat', 'Commercial'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilters({ ...filters, category: cat })}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          filters.category === cat
                            ? 'bg-racing-red text-bright-snow'
                            : 'bg-[#1e2121] text-gray-400 border border-white/10 hover:text-bright-snow hover:border-white/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If license plate lookup detected details, show banner */}
                {selectedReg && (
                  <div className="bg-racing-red/10 border border-racing-red/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <h4 className="font-bold text-bright-snow text-sm">Vehicle Matched: <span className="font-mono bg-racing-red text-bright-snow px-1.5 py-0.5 rounded">{selectedReg}</span> - {selectedMakeModel}</h4>
                        <p className="text-xs text-gray-400">Filters have been auto-tuned to dimensions: {filters.width}/{filters.profile} R{filters.rim}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-racing-red hover:text-racing-red/80 underline uppercase"
                    >
                      Clear Vehicle Matches
                    </button>
                  </div>
                )}

                {/* Grid representation - only show after search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedTyres.map((tyre) => (
                    <TyreCard
                      key={tyre.id}
                      tyre={tyre}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Empty state */}
                {filteredTyres.length === 0 && (
                  <div className="bg-[#1e2121] border border-white/10 rounded-2xl p-8 text-center w-full">
                    <div className="text-4xl mb-3">🔍</div>
                    <h4 className="font-display font-bold text-bright-snow text-lg mb-1">No tyres found</h4>
                    <p className="text-sm text-gray-400 mb-5">
                      We couldn't find tyres matching {filters.width || '?'}/{filters.profile || '?'} R{filters.rim || '?'}.<br />
                      We can still source them — give us a call.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href="tel:02084271234"
                        className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-bold text-sm px-5 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Call 020 8427 1234
                      </a>
                      <button
                        onClick={handleClearFilters}
                        className="bg-black/40 hover:bg-white/5 border border-white/10 text-bright-snow font-bold text-sm px-5 py-2.5 rounded-lg transition"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>
        )}

              {/* CART TAB */}
              {activeTab === 'cart' && (
                <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                  <CartSection
                    cartItems={cartItems}
                    onUpdateQuantity={handleUpdateCartQuantity}
                    onRemoveItem={handleRemoveCartItem}
                    onCompleteBooking={handleCompleteBooking}
                    selectedReg={selectedReg}
                    selectedMakeModel={selectedMakeModel}
                  />
                </div>
              )}
            </>
          } />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black text-gray-400 text-xs mt-16">
        {/* Top section — info columns */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-racing-red p-1.5 rounded-lg overflow-hidden">
                <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="font-display font-black text-bright-snow tracking-tight text-sm block leading-none">Arsh Autos</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Auto Tyre Shop</span>
              </div>
            </div>
            <p className="leading-relaxed text-gray-400/80">
              Premier tyre fitting and wheel alignment specialist in Harrow, London. Premium brands, expert fitting, and competitive prices.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2 pt-1">
              <a href="tel:02084271234" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-gray-400 hover:text-racing-red hover:border-racing-red/30 transition">
                <Phone className="w-4 h-4" />
              </a>
              <a href="https://maps.google.com/?q=48+Harrow+Road+London+HA1+2YF" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-gray-400 hover:text-racing-red hover:border-racing-red/30 transition">
                <MapPin className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-gray-400 hover:text-racing-red hover:border-racing-red/30 transition">
                <span className="text-xs font-bold">f</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-gray-400 hover:text-racing-red hover:border-racing-red/30 transition">
                <span className="text-xs font-bold">IG</span>
              </a>
            </div>
          </div>

          {/* Opening hours with live status */}
          <div>
            <h4 className="font-display font-bold text-racing-red uppercase tracking-wider mb-4 text-sm">Opening Hours</h4>
            <ul className="space-y-2">
              <li className="flex justify-between items-center text-bright-snow/80">
                <span>Mon – Fri</span>
                <span className="font-mono font-bold">8:30 – 6:00</span>
              </li>
              <li className="flex justify-between items-center text-bright-snow/80">
                <span>Saturday</span>
                <span className="font-mono font-bold">8:30 – 6:00</span>
              </li>
              <li className="flex justify-between items-center text-gray-500">
                <span>Sunday</span>
                <span className="font-mono">Closed</span>
              </li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-bold text-[11px]">Open now — bookings from tomorrow</span>
            </div>
          </div>

          {/* Address + contact */}
          <div>
            <h4 className="font-display font-bold text-racing-red uppercase tracking-wider mb-4 text-sm">Visit Us</h4>
            <div className="space-y-2 text-bright-snow/80">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                <span>48 Harrow Road<br />London, HA1 2YF</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-racing-red shrink-0" />
                <a href="tel:02084271234" className="hover:text-racing-red transition font-bold">020 8427 1234</a>
              </p>
            </div>
            {/* Map embed */}
            <div className="mt-4 rounded-xl overflow-hidden border border-white/5 h-32">
              <iframe
                src="https://maps.google.com/maps?q=48%20Harrow%20Road%20London%20HA1%202YF&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full grayscale opacity-60"
                loading="lazy"
                title="Arsh Autos Location"
              />
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mr-2">Brands we fit:</span>
            {['Michelin', 'Continental', 'Pirelli', 'Goodyear', 'Bridgestone', 'Dunlop', 'Yokohama', 'Hankook'].map(b => (
              <span key={b} className="bg-white/5 text-bright-snow/85 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-500/25">{b}</span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-gray-500">
            © 2026 Arsh Autos Auto Tyre Shop. All rights reserved.
          </p>
          <button onClick={() => setActiveTab('admin')} className="text-[10px] text-gray-600 hover:text-gray-400 transition underline">
            Admin
          </button>
        </div>
      </footer>

      {/* Sticky mobile order bar */}
      {cartItems.length > 0 && activeTab !== 'cart' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
          <button
            onClick={() => { navigate('/'); setActiveTab('cart'); }}
            className="w-full bg-racing-red text-bright-snow font-bold px-4 py-3.5 flex items-center justify-between shadow-2xl shadow-racing-red/30 active:bg-racing-red/90 transition"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingBag className="w-5 h-5" />
              {totalCartTyres} {totalCartTyres === 1 ? 'tyre' : 'tyres'} in your order
            </span>
            <span className="flex items-center gap-1.5 text-sm font-extrabold">
              £{cartItems.reduce((acc, item) => acc + getUnitPrice(item.tyre, item.quantity) * item.quantity, 0).toFixed(2)}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

    </div>
  );
}
