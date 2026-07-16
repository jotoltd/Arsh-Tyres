import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tyre, CartItem, Booking, SearchFilters } from './types';
import { TYRE_DATABASE } from './data';
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
  Search
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

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedReg, setSelectedReg] = useState('');
  const [selectedMakeModel, setSelectedMakeModel] = useState('');
  const [activeTab, setActiveTab] = useState<'shop' | 'bookings' | 'cart' | 'admin'>('shop');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(null);

  // Initialize data from localStorage on load
  useEffect(() => {
    const savedCart = localStorage.getItem('arsh_autos_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    const savedBookings = localStorage.getItem('arsh_autos_bookings');
    if (savedBookings) {
      try {
        setBookings(JSON.parse(savedBookings));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save changes to localStorage
  const saveCartToStorage = (items: CartItem[]) => {
    localStorage.setItem('arsh_autos_cart', JSON.stringify(items));
  };

  const saveBookingsToStorage = (list: Booking[]) => {
    localStorage.setItem('arsh_autos_bookings', JSON.stringify(list));
  };

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
    saveCartToStorage(updated);

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
    saveCartToStorage(updated);
  };

  const handleRemoveCartItem = (tyreId: string) => {
    const updated = cartItems.filter(item => item.tyre.id !== tyreId);
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  // Booking operations
  const handleCompleteBooking = (bookingData: {
    cartItems: CartItem[];
    subtotal: number;
    fittingFee: number;
    totalPrice: number;
    fittingType: 'shop' | 'mobile' | 'delivery';
    date: string;
    timeSlot: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleRegistration: string;
    vehicleMakeModel: string;
  }) => {
    const newBooking: Booking = {
      ...bookingData,
      id: 'ab' + Math.random().toString(36).substring(2, 8),
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    saveBookingsToStorage(updatedBookings);

    // Clear cart
    setCartItems([]);
    saveCartToStorage([]);

    // Open receipt modal / show confirmed state
    setLastConfirmedBooking(newBooking);
    
    // Clear registration details
    setSelectedReg('');
    setSelectedMakeModel('');

    // Scroll to top to show confirmation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: 'Cancelled' as const };
      }
      return b;
    });
    setBookings(updated);
    saveBookingsToStorage(updated);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status };
      }
      return b;
    });
    setBookings(updated);
    saveBookingsToStorage(updated);
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

  // Get matching tyres from search parameters
  const filteredTyres = TYRE_DATABASE.filter(tyre => {
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
              <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-10 h-10 object-contain" />
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
              Cart
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

          {/* Mini Basket indicator */}
          <div className="flex items-center gap-4">
            {cartItems.length > 0 && (
              <a
                onClick={() => { navigate('/'); setActiveTab('cart'); }}
                className="bg-[#1e2121] hover:bg-[#252828] text-bright-snow border border-gray-500/20 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-racing-red" />
                <span className="hidden sm:inline">Basket:</span>
                <span className="bg-racing-red text-bright-snow text-xs font-black w-6 h-6 rounded-full flex items-center justify-center font-mono">
                  {totalCartTyres}
                </span>
              </a>
            )}
          </div>
        </div>
      </header>

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
                <div className="space-y-12">
                {/* Hero Brand Board */}
            <div
              className="relative overflow-hidden rounded-3xl border border-white/5 shadow-2xl"
              style={{ backgroundImage: 'url(/assets/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '480px' }}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 flex flex-col items-center justify-end h-full min-h-[480px] p-8 pb-10 text-center space-y-6">
                <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-bright-snow tracking-tight leading-tight drop-shadow-lg">
                  Drive Confidently.<br />
                  <span className="text-racing-red">Premium Tyres Fitted Instantly.</span>
                </h2>

                <button
                  onClick={() => {
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-sm tracking-widest uppercase px-8 py-3.5 rounded-xl transition shadow-lg shadow-racing-red/30 hover:shadow-racing-red/50"
                >
                  <Search className="w-5 h-5" />
                  Find Your Tyres Now
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <span className="text-gray-300 text-sm">Can't find what you're looking for?</span>
                  <a
                    href="https://wa.me/447123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>

            {/* 3 Steps + Logo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full items-center">
              <div className="bg-black rounded-2xl p-6 border border-white/5 text-center shadow-lg animate-fade-in-up" style={{ animationDelay: '0s' }}>
                <div className="w-12 h-12 bg-racing-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-racing-red font-extrabold text-xl">1</div>
                <h4 className="font-display font-bold text-bright-snow text-xl mb-2">Search Tyres</h4>
                <p className="text-gray-400 text-base">Select your tyre dimensions</p>
              </div>
              <div className="bg-black rounded-2xl p-6 border border-white/5 text-center shadow-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-12 h-12 bg-racing-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-racing-red font-extrabold text-xl">2</div>
                <h4 className="font-display font-bold text-bright-snow text-xl mb-2">Add to Cart</h4>
                <p className="text-gray-400 text-base">Choose quantity and add tyres</p>
              </div>
              <div className="bg-black rounded-2xl p-6 border border-white/5 text-center shadow-lg animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="w-12 h-12 bg-racing-red/20 rounded-full flex items-center justify-center mx-auto mb-4 text-racing-red font-extrabold text-xl">3</div>
                <h4 className="font-display font-bold text-bright-snow text-xl mb-2">Checkout</h4>
                <p className="text-gray-400 text-base">Complete your order</p>
              </div>
              {/* Logo Display */}
              <div className="relative z-10 bg-black rounded-2xl p-6 shrink-0 text-center shadow-xl">
                <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-full h-auto object-contain max-h-48" />
              </div>
            </div>

            {/* Smart Searcher Component */}
            <section className="space-y-6">
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/5">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Search className="w-8 h-8 text-racing-red" />
                  <h3 className="font-display font-extrabold text-bright-snow text-3xl md:text-4xl">Find Your Perfect Tyres</h3>
                </div>
                <p className="text-base text-gray-400">Select dimensions from the selector to find matching tyres.</p>
              </div>

              <TyreSearcher
                filters={filters}
                onFilterChange={setFilters}
                onSearch={handleExecuteSearch}
                onClear={handleClearFilters}
              />
            </section>

            {/* RESULTS SECTION - only show after search */}
            {searchTriggered && (
              <section id="results-section" className="space-y-6 scroll-mt-24">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-bright-snow text-xl flex items-center gap-2">
                      <Disc className="w-5 h-5 text-racing-red animate-spin-slow" />
                      Search Results Matching Sizes
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Found {filteredTyres.length} premium tyres matching your specification dimensions.
                    </p>
                  </div>

                  {/* Categories tab filters */}
                  <div className="flex gap-1 bg-black p-1 rounded-xl border border-white/5">
                    {['All', 'Summer', 'Winter', 'All-Season'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilters({ ...filters, category: cat })}
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

                {/* If license plate lookup detected details, show banner */}
                {selectedReg && (
                  <div className="bg-racing-red/10 border border-racing-red/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <h4 className="font-bold text-bright-snow text-sm">Vehicle Matched: <span className="font-mono bg-racing-red text-bright-snow px-1.5 py-0.5 rounded">{selectedReg}</span> - {selectedMakeModel}</h4>
                        <p className="text-xs text-gray-400">Filters have been auto-tuned to dimensions: {filters.width}/{filters.profile} R{filters.rim} {filters.speedRating}</p>
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
                  {filteredTyres.map((tyre) => (
                    <TyreCard
                      key={tyre.id}
                      tyre={tyre}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Empty state search block */}
                {filteredTyres.length === 0 && (
                  <div className="bg-black border border-white/5 rounded-2xl p-8 text-center shadow-md w-full">
                    <Info className="w-10 h-10 text-racing-red mx-auto mb-2" />
                    <h4 className="font-display font-bold text-bright-snow mb-1">No Matches Found in Current Dimensions</h4>
                    <p className="text-xs text-gray-400 mb-4">
                      The requested combination ({filters.width || '?'}/{filters.profile || '?'} R{filters.rim || '?'}) doesn't have local warehouse stock right now. Let us source it.
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Reset & View All Tyres
                    </button>
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
      <footer className="border-t border-white/5 bg-black text-gray-400 text-xs py-12 mt-16 tyre-tread-pattern">
        <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-racing-red text-bright-snow p-1 rounded-lg overflow-hidden">
                <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-display font-black text-bright-snow tracking-tight text-sm">Arsh Autos Auto Tyre Shop</span>
            </div>
            <p className="leading-relaxed">
              Arsh Autos is a premier automotive wheel and tyre fitter based in Harrow, London. Offering premium brands, state of the art computerized alignments, and mobile fleet van fittings.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-racing-red uppercase tracking-wider mb-3">Service Hours</h4>
            <ul className="space-y-1.5 font-medium text-bright-snow/80">
              <li>Monday - Friday: 08:00 - 18:00</li>
              <li>Saturday: 08:00 - 17:00</li>
              <li>Sunday: Emergency Service Callouts Only</li>
              <li className="text-emerald-400 font-bold">Harrow Workshop Is Fully Open</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-racing-red uppercase tracking-wider mb-3">Workshop Address</h4>
            <ul className="space-y-1.5 font-medium text-bright-snow/80">
              <li>Arsh Autos Tyre, MOT & Wheel Alignment Centre</li>
              <li>48 Harrow Road</li>
              <li>London, HA1 2YF</li>
              <li className="flex items-center gap-1.5 text-racing-red font-bold">
                <Star className="w-3 h-3 fill-racing-red text-racing-red" />
                4.8 · 774 Reviews
              </li>
              <li className="text-racing-red font-bold">Tel: 020 8427 1234</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-racing-red uppercase tracking-wider mb-3">Premium Brands We Fit</h4>
            <div className="flex flex-wrap gap-1.5">
              {['Michelin', 'Continental', 'Pirelli', 'Goodyear', 'Bridgestone', 'Dunlop', 'Yokohama', 'Hankook'].map(b => (
                <span key={b} className="bg-white/5 text-bright-snow/85 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-500/25">{b}</span>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-400/80">
              © 2026 Arsh Autos Auto Tyre Shop. All rights reserved. Professional fitting & alignment guaranteed.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
