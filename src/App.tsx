import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Tyre, CartItem, Booking, SearchFilters } from './types';
import { getUnitPrice } from './data';
import { useSupabase } from './contexts/SupabaseContext';
import TyreSearcher from './components/TyreSearcher';
import TyreCard from './components/TyreCard';
import CartSection from './components/CartSection';
import BookingsList from './components/BookingsList';
import AdminPanel from './components/AdminPanel';
import CustomerAccount from './components/CustomerAccount';
import SearchResults from './pages/SearchResults';
import NotFound from './pages/NotFound';
import ContactPage from './pages/ContactPage';
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
  LogOut,
  Menu,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Deep linking: derive activeTab from route path
  const validTabs = ['shop', 'bookings', 'cart', 'admin', 'account'] as const;
  type Tab = typeof validTabs[number];
  const pathSegment = location.pathname.replace('/', '') as Tab | '';
  const activeTab: Tab = validTabs.includes(pathSegment as Tab) ? (pathSegment as Tab) : 'shop';
  const setActiveTab = useCallback((tab: Tab) => {
    navigate(`/${tab}`);
  }, [navigate]);

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
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'size'>('price-low');
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, location.pathname]);

  // Refresh tyres from Supabase when switching to shop tab
  useEffect(() => {
    if (activeTab === 'shop') {
      refreshTyres();
    }
  }, [activeTab]);

  // Handle password reset redirect — Supabase sends user back with ?reset_password=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_password') === '1') {
      setActiveTab('account');
    }
  }, [setActiveTab, location.pathname]);

  const {
    tyres,
    cartItems,
    setCartItems,
    bookings,
    addBooking,
    cancelBooking,
    updateBookingStatus,
    deleteBooking,
    updateBookingDetails,
    user,
    signIn,
    signOut,
    tyresError,
    maintenanceMode,
    maintenanceEndTime,
    setMaintenanceMode,
    refreshTyres
  } = useSupabase();

  // Maintenance mode countdown + auto-disable
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    if (!maintenanceMode || !maintenanceEndTime) {
      setCountdown(null);
      return;
    }
    const target = new Date(maintenanceEndTime).getTime();
    if (isNaN(target)) { setCountdown(null); return; }

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        setMaintenanceMode(false);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [maintenanceMode, maintenanceEndTime, setMaintenanceMode]);

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
    fittingType: 'fitting' | 'collection';
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

    // Send confirmation email (fire-and-forget, don't block the UI)
    fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        vehicleRegistration: bookingData.vehicleRegistration,
        vehicleMakeModel: bookingData.vehicleMakeModel,
        fittingType: bookingData.fittingType,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        totalPrice: bookingData.totalPrice,
        cartItems: bookingData.cartItems.map(item => ({
          tyre: {
            model: item.tyre.model,
            width: item.tyre.width,
            profile: item.tyre.profile,
            rim: item.tyre.rim,
          },
          quantity: item.quantity,
          unitPrice: getUnitPrice(item.tyre, item.quantity),
        })),
      }),
    }).catch(err => console.error('Failed to send confirmation email:', err));

    // Clear cart
    setCartItems([]);

    // Auto-create a customer account via our API (bypasses Supabase's email, sends our own)
    if (bookingData.customerEmail) {
      fetch('/api/create-customer-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bookingData.customerEmail }),
      }).then(res => {
        if (!res.ok) {
          console.error('Account creation failed:', res.status, res.statusText);
        } else {
          console.log('Customer account created/sent welcome email for:', bookingData.customerEmail);
        }
      }).catch(err => console.error('Auto account creation failed:', err));
    }

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

  const handleReorder = (items: CartItem[]) => {
    const updated = [...cartItems];
    items.forEach(item => {
      const existingIndex = updated.findIndex(i => i.tyre.id === item.tyre.id);
      if (existingIndex >= 0) {
        updated[existingIndex].quantity += item.quantity;
      } else {
        updated.push({ ...item });
      }
    });
    setCartItems(updated);
    setActiveTab('cart');
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await updateBookingStatus(bookingId, status);

    if (status === 'Completed' || status === 'Cancelled') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking?.customerEmail) {
        fetch('/api/send-booking-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            vehicleRegistration: booking.vehicleRegistration,
            vehicleMakeModel: booking.vehicleMakeModel,
            date: booking.date,
            timeSlot: booking.timeSlot,
            status,
          }),
        }).catch(err => console.error('Failed to send booking update email:', err));
      }
    }
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
      const updated = [...cartItems];
      const existingIndex = updated.findIndex(item => item.tyre.id === payload.tyre.id);
      if (existingIndex >= 0) {
        updated[existingIndex].quantity += payload.quantity;
      } else {
        updated.push({ tyre: payload.tyre, quantity: payload.quantity });
      }
      setCartItems(updated);
      navigate('/cart', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

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
    <div className="min-h-screen bg-black text-bright-snow/90 font-sans antialiased pb-16 sm:pb-0">

      {/* Top Banner Message */}
      <div className="bg-racing-red text-bright-snow text-xs py-2 px-4 text-center font-semibold border-b border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
          <span>📍 5 Rowan Rd, London, SW16 5JF</span>
          <span className="hidden sm:inline text-bright-snow/40">|</span>
          <span>📞 020 8427 1234</span>
          <span className="hidden md:inline text-bright-snow/40">|</span>
          <span className="text-yellow-300 font-black hidden md:inline">★ Next-day fitting slots available</span>
        </div>
      </div>

      {/* Main Brand Header */}
      <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setActiveTab('shop'); setLastConfirmedBooking(null); }}>
            <img src="/assets/logo.jpg" alt="Arsh Autos Logo" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
          </div>

          {/* Nav Tabs — desktop only (hidden in maintenance mode) */}
          {(!maintenanceMode || activeTab === 'admin') && (
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-2">
            <button
              onClick={() => { setActiveTab('shop'); setLastConfirmedBooking(null); }}
              className={`px-3 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'shop' && location.pathname === '/shop'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-bright-snow/60 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              Find & Buy
            </button>

            <button
              onClick={() => { setActiveTab('bookings'); setLastConfirmedBooking(null); }}
              className={`px-3 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'bookings' && location.pathname === '/bookings'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-bright-snow/60 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">My Bookings</span>
              <span className="lg:hidden">Bookings</span>
              {bookings.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {bookings.filter(b => b.status === 'Scheduled').length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('cart'); setLastConfirmedBooking(null); }}
              className={`px-3 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'cart' && location.pathname === '/cart'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-bright-snow/60 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">My Order</span>
              <span className="lg:hidden">Order</span>
              {cartItems.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('account'); setLastConfirmedBooking(null); }}
              className={`px-3 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'account' && location.pathname === '/account'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-bright-snow/60 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <User className="w-4 h-4 lg:w-5 lg:h-5" />
              Account
            </button>
            <button
              onClick={() => { navigate('/contact'); setLastConfirmedBooking(null); }}
              className={`px-3 lg:px-5 py-2 text-sm lg:text-base font-bold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                location.pathname === '/contact'
                  ? 'bg-racing-red text-bright-snow shadow-md font-extrabold'
                  : 'text-bright-snow/60 hover:bg-bright-snow/5 hover:text-bright-snow'
              }`}
            >
              <Phone className="w-4 h-4 lg:w-5 lg:h-5" />
              Contact
            </button>
          </nav>
          )}

          {/* Mobile hamburger button */}
          {(!maintenanceMode || activeTab === 'admin') && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 text-bright-snow transition shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          )}

          {/* Auth + Order — desktop only, mobile uses hamburger */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs text-bright-snow/60 max-w-[150px] truncate">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-xs font-bold text-bright-snow bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setActiveTab('account'); setLastConfirmedBooking(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-bright-snow bg-racing-red hover:bg-racing-red/90 px-3 py-2 rounded-lg transition whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
            {cartItems.length > 0 && (
              <a
                onClick={() => { setActiveTab('cart'); }}
                className="bg-[#1e2121] hover:bg-[#252828] text-bright-snow border border-gray-500/20 rounded-xl px-3 lg:px-4 py-2 text-sm font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 text-racing-red" />
                <span className="hidden lg:inline">My Order:</span>
                <span className="bg-racing-red text-bright-snow text-xs font-black w-6 h-6 rounded-full flex items-center justify-center font-mono">
                  {totalCartTyres}
                </span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (!maintenanceMode || activeTab === 'admin') && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-[45] bg-black/98 backdrop-blur-lg border-b border-white/10 shadow-2xl min-h-screen pt-2 overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {/* Quick CTA buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href="tel:02084271234"
                className="flex flex-col items-center justify-center gap-1.5 bg-racing-red/10 border border-racing-red/30 rounded-2xl py-4 transition hover:bg-racing-red/20"
              >
                <div className="w-10 h-10 bg-racing-red/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-racing-red" />
                </div>
                <span className="text-xs font-bold text-bright-snow">Call Us</span>
                <span className="text-[10px] text-bright-snow/50">020 8427 1234</span>
              </a>
              <button
                onClick={() => { navigate('/contact'); setLastConfirmedBooking(null); setMobileMenuOpen(false); }}
                className="flex flex-col items-center justify-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl py-4 transition hover:bg-white/10"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-bright-snow" />
                </div>
                <span className="text-xs font-bold text-bright-snow">Enquire</span>
                <span className="text-[10px] text-bright-snow/50">Send a message</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mb-1" />

            {/* Nav links */}
            <button
              onClick={() => { setActiveTab('shop'); setLastConfirmedBooking(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'shop' && location.pathname === '/shop'
                  ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/20'
                  : 'text-bright-snow/70 hover:bg-white/5 hover:text-bright-snow'
              }`}
            >
              <Search className="w-5 h-5" />
              Find & Buy Tyres
              <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
            </button>
            <button
              onClick={() => { setActiveTab('bookings'); setLastConfirmedBooking(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'bookings' && location.pathname === '/bookings'
                  ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/20'
                  : 'text-bright-snow/70 hover:bg-white/5 hover:text-bright-snow'
              }`}
            >
              <Calendar className="w-5 h-5" />
              My Bookings
              {bookings.filter(b => b.status === 'Scheduled').length > 0 ? (
                <span className="bg-racing-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  {bookings.filter(b => b.status === 'Scheduled').length}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
              )}
            </button>
            <button
              onClick={() => { setActiveTab('cart'); setLastConfirmedBooking(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'cart' && location.pathname === '/cart'
                  ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/20'
                  : 'text-bright-snow/70 hover:bg-white/5 hover:text-bright-snow'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              My Order
              {cartItems.length > 0 ? (
                <span className="bg-racing-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                  {totalCartTyres}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
              )}
            </button>
            <button
              onClick={() => { setActiveTab('account'); setLastConfirmedBooking(null); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${
                activeTab === 'account' && location.pathname === '/account'
                  ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/20'
                  : 'text-bright-snow/70 hover:bg-white/5 hover:text-bright-snow'
              }`}
            >
              <User className="w-5 h-5" />
              {user ? 'My Account' : 'Sign In'}
              <ChevronRight className="w-4 h-4 ml-auto opacity-30" />
            </button>

            {/* Divider */}
            <div className="h-px bg-white/5 my-1" />

            {/* Contact info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-9 h-9 bg-racing-red/10 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-racing-red" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-bright-snow">5 Rowan Rd, London</p>
                <p className="text-[10px] text-bright-snow/50">SW16 5JF</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-9 h-9 bg-racing-red/10 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-racing-red" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-bright-snow">Mon–Sat: 8:30am – 6:00pm</p>
                <p className="text-[10px] text-bright-snow/50">Sun: Closed</p>
              </div>
            </div>

            {/* Sign out */}
            {user && (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-bright-snow/50 hover:bg-white/5 hover:text-bright-snow transition mt-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Supabase fallback notice */}
      {tyresError && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 text-xs text-center py-2 px-4">
          {tyresError}
        </div>
      )}

      {/* Main Body Grid */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {maintenanceMode && activeTab !== 'admin' ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-lg w-full text-center space-y-8 animate-fade-in-up">
              {/* Logo */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-racing-red/20 blur-2xl rounded-full scale-110" />
                <div className="relative bg-black/80 backdrop-blur-md rounded-3xl p-3 border border-white/10 shadow-2xl">
                  <img src="/assets/logo.jpg" alt="Arsh Autos" className="w-24 h-24 rounded-2xl object-contain" />
                </div>
              </div>

              {/* Status badge */}
              <div className="inline-flex items-center gap-2 bg-racing-red/10 border border-racing-red/20 rounded-full px-4 py-2">
                <span className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                <span className="text-racing-red text-xs font-bold uppercase tracking-wider">Under Maintenance</span>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h1 className="font-display font-black text-3xl sm:text-4xl text-bright-snow">We'll be right back</h1>
                <p className="text-bright-snow/60 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  Arsh Autos is undergoing scheduled maintenance to serve you better. We'll be back online shortly — thank you for your patience!
                </p>
              </div>

              {/* Countdown timer */}
              {countdown && (
                <div className="space-y-3">
                  <p className="text-xs text-bright-snow/40 uppercase tracking-wider font-bold">Back online in</p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {countdown.days > 0 && (
                      <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 min-w-[70px]">
                        <div className="font-display font-black text-2xl sm:text-3xl text-racing-red tabular-nums">{countdown.days}</div>
                        <div className="text-[10px] uppercase tracking-wider text-bright-snow/40 font-bold mt-0.5">Days</div>
                      </div>
                    )}
                    <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 min-w-[70px]">
                      <div className="font-display font-black text-2xl sm:text-3xl text-racing-red tabular-nums">{String(countdown.hours).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-wider text-bright-snow/40 font-bold mt-0.5">Hours</div>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 min-w-[70px]">
                      <div className="font-display font-black text-2xl sm:text-3xl text-racing-red tabular-nums">{String(countdown.minutes).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-wider text-bright-snow/40 font-bold mt-0.5">Mins</div>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 min-w-[70px]">
                      <div className="font-display font-black text-2xl sm:text-3xl text-racing-red tabular-nums">{String(countdown.seconds).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-wider text-bright-snow/40 font-bold mt-0.5">Secs</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div className="bg-black/50 border border-white/5 rounded-2xl p-6 space-y-3 text-left">
                <p className="text-[10px] uppercase text-bright-snow/40 font-bold tracking-wider text-center mb-3">Need to reach us?</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 bg-racing-red/10 rounded-lg flex items-center justify-center border border-racing-red/20 shrink-0">
                    <Phone className="w-4 h-4 text-racing-red" />
                  </div>
                  <a href="tel:02084271234" className="text-bright-snow font-bold hover:text-racing-red transition">020 8427 1234</a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 bg-racing-red/10 rounded-lg flex items-center justify-center border border-racing-red/20 shrink-0">
                    <MapPin className="w-4 h-4 text-racing-red" />
                  </div>
                  <span className="text-bright-snow/60">5 Rowan Rd, London, SW16 5JF</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 bg-racing-red/10 rounded-lg flex items-center justify-center border border-racing-red/20 shrink-0">
                    <Clock className="w-4 h-4 text-racing-red" />
                  </div>
                  <span className="text-bright-snow/60">Mon–Sat: 8:30am – 6:00pm</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
        <Routes>
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/manage" element={<Navigate to="/admin" replace />} />

          {/* SHOP */}
          <Route path="/shop" element={
            <>
              {/* SUCCESS CONFIRMATION RECEIPT SCREEN */}
              {lastConfirmedBooking && (
                <div className="bg-gradient-to-b from-black to-[#0a0a0a] border border-emerald-500/20 rounded-3xl p-6 md:p-10 shadow-2xl w-full text-center mb-12 space-y-6 animate-fade-in-up">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />
                    <div className="relative w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 animate-check-pop">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Appointment & Purchase Confirmed!
                    </span>
                    <h2 className="font-display font-black text-2xl md:text-3xl text-white">Your Booking is Scheduled</h2>
                    <p className="text-bright-snow/60 text-sm w-full">
                      Thank you for choosing Arsh Autos! We have secured your selected tyres. A receipt and calendar invitation have been registered in your system files.
                    </p>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300 font-semibold inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      We've created an account for you. Check your email for your login details to view your order history.
                    </div>
                    {/* Receipt Quick Info Card */}
                    <div className="bg-black border border-white/10 rounded-2xl p-5 text-left divide-y divide-white/10 w-full text-xs space-y-3.5">
                      <div className="flex justify-between items-center pb-2">
                        <span className="font-bold text-bright-snow/40 uppercase">Booking Reference</span>
                        <span className="font-mono font-extrabold text-racing-red bg-racing-red/10 border border-racing-red/20 px-2 py-0.5 rounded text-[13px]">{lastConfirmedBooking.id.toUpperCase()}</span>
                      </div>

                      {lastConfirmedBooking.fittingType !== 'delivery' ? (
                        <div className="pt-3 space-y-2 text-bright-snow/80">
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
                              {lastConfirmedBooking.fittingType === 'fitting'
                                ? 'Fitting Location: Arsh Autos, 5 Rowan Rd, London, SW16 5JF'
                                : <>Mobile Fitting: Sent to customer contact address for reg plate <span className="font-mono bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded tracking-wider text-xs">{lastConfirmedBooking.vehicleRegistration}</span></>}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 text-bright-snow/80 font-semibold flex items-center gap-2">
                          <Truck className="w-4 h-4 text-racing-red shrink-0" />
                          <span>Doorstep shipping dispatch initiated - Delivery in 1-2 working days.</span>
                        </div>
                      )}

                      <div className="pt-3 space-y-2">
                        <div className="flex justify-between font-medium">
                          <span className="text-bright-snow/40">Vehicle:</span>
                          <span className="font-bold font-mono bg-yellow-400 text-black px-1.5 py-0.5 rounded tracking-wider">{lastConfirmedBooking.vehicleRegistration}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-bright-snow/40">Total Charged:</span>
                          <span className="text-racing-red font-bold text-sm">£{lastConfirmedBooking.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Account created notice */}
                      <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30 shrink-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-emerald-400 text-xs font-bold">Account Created</p>
                          <p className="text-bright-snow/60 text-xs mt-0.5">We've created an account for {lastConfirmedBooking.customerEmail} and sent your login details by email. You can use it to track and manage your bookings.</p>
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

              {/* SHOP CONTENT (hidden when receipt is showing) */}
              {!lastConfirmedBooking && (
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
                        <span className="text-racing-red">fitted in London.</span>
                      </h2>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 sm:gap-10">
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">500+</div>
                        <div className="text-[10px] uppercase tracking-wider text-bright-snow/60 font-bold">Tyres in stock</div>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">30min</div>
                        <div className="text-[10px] uppercase tracking-wider text-bright-snow/60 font-bold">Avg fitting</div>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <div className="font-display font-black text-2xl sm:text-3xl text-bright-snow">All</div>
                        <div className="text-[10px] uppercase tracking-wider text-bright-snow/60 font-bold">Premium brands</div>
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

                    {/* Three steps */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full max-w-2xl mx-auto">
                      <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex-1">
                        <div className="w-9 h-9 bg-racing-red/20 rounded-xl flex items-center justify-center shrink-0">
                          <Search className="w-4.5 h-4.5 text-racing-red" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Search our range</p>
                          <p className="text-[10px] text-white/50">Find your tyres by size</p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-white/20 text-lg font-bold">→</div>
                      <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex-1">
                        <div className="w-9 h-9 bg-racing-red/20 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-4.5 h-4.5 text-racing-red" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Pick a time</p>
                          <p className="text-[10px] text-white/50">Choose a fitting slot</p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-white/20 text-lg font-bold">→</div>
                      <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex-1">
                        <div className="w-9 h-9 bg-racing-red/20 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4.5 h-4.5 text-racing-red" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Pay online</p>
                          <p className="text-[10px] text-white/50">Or pay in-shop</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom location strip */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md border-t border-white/5 py-2.5">
                    <div className="flex items-center justify-center gap-4 text-[11px] text-white/70">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-racing-red" /> 5 Rowan Rd, SW16 5JF</span>
                      <span className="hidden sm:inline text-bright-snow/30">·</span>
                      <span className="hidden sm:flex items-center gap-1.5"><Phone className="w-3 h-3 text-racing-red" /> 020 8427 1234</span>
                      <span className="hidden sm:inline text-bright-snow/30">·</span>
                      <span className="hidden sm:flex items-center gap-1.5"><Clock className="w-3 h-3 text-racing-red" /> Mon–Sat 8:30–6</span>
                    </div>
                  </div>
                </section>

                {/* CATEGORY CARDS — premium tyre type selector */}
                <section>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-display font-extrabold text-bright-snow text-lg">Browse by type</h3>
                    <span className="text-[11px] text-bright-snow/40 font-bold uppercase tracking-wider">Pick a category</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[
                      {
                        label: 'Standard',
                        desc: 'Everyday car tyres',
                        longDesc: 'Reliable all-rounders for daily driving',
                        icon: Car,
                        accent: 'racing-red',
                        glow: 'bg-racing-red/15',
                        border: 'hover:border-racing-red/40',
                        text: 'text-racing-red',
                        bg: 'from-racing-red/10 to-transparent',
                      },
                      {
                        label: 'Runflat',
                        desc: 'Puncture-safe tyres',
                        longDesc: 'Keep driving after a puncture — up to 50mph',
                        icon: ShieldCheck,
                        accent: 'blue-500',
                        glow: 'bg-blue-500/15',
                        border: 'hover:border-blue-500/40',
                        text: 'text-blue-400',
                        bg: 'from-blue-500/10 to-transparent',
                      },
                      {
                        label: 'Commercial',
                        desc: 'Van & heavy-duty',
                        longDesc: 'Reinforced for vans and heavy loads',
                        icon: Truck,
                        accent: 'amber-500',
                        glow: 'bg-amber-500/15',
                        border: 'hover:border-amber-500/40',
                        text: 'text-amber-400',
                        bg: 'from-amber-500/10 to-transparent',
                      },
                    ].map(cat => {
                      const Icon = cat.icon;
                      const borderColor = cat.accent === 'racing-red' ? 'border-racing-red/30' : cat.accent === 'blue-500' ? 'border-blue-500/30' : 'border-amber-500/30';
                      return (
                        <button
                          key={cat.label}
                          onClick={() => { setFilters({ ...filters, category: cat.label }); setSearchTriggered(true); setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                          className={`group relative overflow-hidden bg-[#252828] hover:bg-[#2a2e2e] border ${borderColor} rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                        >
                          {/* Gradient wash — always visible */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} transition-opacity duration-300`} />

                          {/* Icon */}
                          <div className="relative mb-3">
                            <div className={`absolute inset-0 ${cat.glow} blur-lg rounded-xl scale-90 transition-opacity duration-300`} />
                            <div className={`relative w-11 h-11 sm:w-12 sm:h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/20 transition`}>
                              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${cat.text} transition-transform duration-300 group-hover:scale-110`} />
                            </div>
                          </div>

                          {/* Text */}
                          <div className="relative">
                            <p className="font-display font-bold text-bright-snow text-sm sm:text-base leading-tight">{cat.label}</p>
                            <p className="text-[11px] text-bright-snow/60 sm:text-xs sm:mt-0.5">{cat.desc}</p>
                            <p className="text-[10px] text-bright-snow/40 mt-1 hidden sm:block leading-snug">{cat.longDesc}</p>
                          </div>

                          {/* Arrow indicator — always visible */}
                          <div className="relative mt-3 flex items-center gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.text}`}>Browse</span>
                            <ArrowRight className={`w-3 h-3 ${cat.text} transition-transform duration-300 group-hover:translate-x-0.5`} />
                          </div>
                        </button>
                      );
                    })}
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
                      <p className="text-xs text-bright-snow/60 truncate">Autel sensors — fitting & programming. Call for quote.</p>
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
                      <p className="text-xs text-bright-snow/60 truncate">Lost your key? £20 per nut. Add at checkout.</p>
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
                      <p className="text-xs text-bright-snow/60 mt-0.5">
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
                            : 'bg-[#1e2121] text-bright-snow/60 border border-white/10 hover:text-bright-snow hover:border-white/20'
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
                        <h4 className="font-bold text-bright-snow text-sm">Vehicle Matched: <span className="font-mono bg-yellow-400 text-black font-black px-2 py-0.5 rounded tracking-wider">{selectedReg}</span> - {selectedMakeModel}</h4>
                        <p className="text-xs text-bright-snow/60">Filters have been auto-tuned to dimensions: {filters.width}/{filters.profile} R{filters.rim}</p>
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
                  <div className="bg-gradient-to-b from-[#1e2121] to-black border border-white/10 rounded-2xl p-10 text-center w-full">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-racing-red/10 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 bg-racing-red/10 rounded-2xl flex items-center justify-center mx-auto border border-racing-red/20">
                        <Search className="w-8 h-8 text-racing-red" />
                      </div>
                    </div>
                    <h4 className="font-display font-bold text-bright-snow text-lg mb-1">No tyres found</h4>
                    <p className="text-sm text-bright-snow/60 mb-5 max-w-sm mx-auto">
                      We couldn't find tyres matching {filters.width || '?'}/{filters.profile || '?'} R{filters.rim || '?'}. We can still source them — give us a call.
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
                      <button
                        onClick={() => setActiveTab('shop')}
                        className="text-bright-snow/60 hover:text-bright-snow font-semibold text-xs transition"
                      >
                        Browse tyres & place an order →
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
                </div>
              )}
            </>
          } />

          {/* ADMIN */}
          <Route path="/admin" element={
            <AdminPanel
              bookings={bookings}
              onUpdateBooking={handleUpdateBookingStatus}
              onDeleteBooking={async (id) => { await deleteBooking(id); }}
              onUpdateBookingDetails={async (id, updates) => { await updateBookingDetails(id, updates); }}
            />
          } />

          {/* ACCOUNT */}
          <Route path="/account" element={
            <CustomerAccount onReorder={handleReorder} />
          } />

          {/* CART */}
          <Route path="/cart" element={
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
          } />

          {/* ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        )}
      </main>

      {/* FOOTER — hidden in maintenance mode */}
      {(!maintenanceMode || activeTab === 'admin') && (
      <footer className="border-t border-white/5 bg-black text-bright-snow/60 text-xs mt-16">
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
                <span className="text-[10px] text-bright-snow/40 uppercase tracking-wider">Auto Tyre Shop</span>
              </div>
            </div>
            <p className="leading-relaxed text-bright-snow/60/80">
              Premier tyre fitting and wheel alignment specialist in Streatham, London. Premium brands, expert fitting, and competitive prices.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2 pt-1">
              <a href="tel:02084271234" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-bright-snow/60 hover:text-racing-red hover:border-racing-red/30 transition">
                <Phone className="w-4 h-4" />
              </a>
              <a href="https://maps.google.com/?q=5+Rowan+Rd+London+SW16+5JF" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-bright-snow/60 hover:text-racing-red hover:border-racing-red/30 transition">
                <MapPin className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-bright-snow/60 hover:text-racing-red hover:border-racing-red/30 transition">
                <span className="text-xs font-bold">f</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg bg-[#1e2121] border border-white/5 flex items-center justify-center text-bright-snow/60 hover:text-racing-red hover:border-racing-red/30 transition">
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
              <li className="flex justify-between items-center text-bright-snow/40">
                <span>Sunday</span>
                <span className="font-mono">Closed</span>
              </li>
            </ul>
            {(() => {
              const now = new Date();
              const day = now.getDay();
              const hours = now.getHours() + now.getMinutes() / 60;
              const isWeekday = day >= 1 && day <= 6;
              const isOpen = isWeekday && hours >= 8.5 && hours < 18;
              const statusText = isOpen
                ? 'Open now — bookings available'
                : day === 0
                  ? 'Closed Sundays — back Mon 8:30am'
                  : hours < 8.5
                    ? 'Closed — opens at 8:30am today'
                    : 'Closed — back tomorrow at 8:30am';
              return (
                <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${
                  isOpen ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-racing-red/10 border-racing-red/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isOpen ? 'bg-emerald-400' : 'bg-racing-red'}`} />
                  <span className={`font-bold text-[11px] ${isOpen ? 'text-emerald-400' : 'text-racing-red'}`}>
                    {statusText}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Address + contact */}
          <div>
            <h4 className="font-display font-bold text-racing-red uppercase tracking-wider mb-4 text-sm">Visit Us</h4>
            <div className="space-y-2 text-bright-snow/80">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-racing-red shrink-0 mt-0.5" />
                <span>5 Rowan Rd<br />London, SW16 5JF</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-racing-red shrink-0" />
                <a href="tel:02084271234" className="hover:text-racing-red transition font-bold">020 8427 1234</a>
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="flex items-center gap-2 text-racing-red hover:text-racing-red/80 transition font-bold pt-1"
              >
                <MessageSquare className="w-4 h-4" />
                Send us a message
              </button>
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-bright-snow/40 font-bold mr-2">Brands we fit:</span>
            {['Sunfull', 'Fronway', 'Farroad', 'Banoz', 'Kuston'].map(b => (
              <span key={b} className="bg-white/5 text-bright-snow/85 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-500/25">{b}</span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-bright-snow/40">
            © 2026 Arsh Autos Auto Tyre Shop. All rights reserved.
          </p>
          <p className="text-[10px] text-bright-snow/40">
            Website Created by{' '}
            <a
              href="https://sitesthatslap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bright-snow/60 hover:text-racing-red transition font-bold"
            >
              Sites That Slap
            </a>
          </p>
        </div>
      </footer>
      )}

      {/* Mobile bottom tab bar — hidden in maintenance mode */}
      {(!maintenanceMode || activeTab === 'admin') && (
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-lg border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => { setActiveTab('shop'); setLastConfirmedBooking(null); }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
              activeTab === 'shop' && location.pathname === '/shop' ? 'text-racing-red' : 'text-bright-snow/40'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[9px] font-bold">Tyres</span>
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); setLastConfirmedBooking(null); }}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
              activeTab === 'bookings' && location.pathname === '/bookings' ? 'text-racing-red' : 'text-bright-snow/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[9px] font-bold">Bookings</span>
            {bookings.filter(b => b.status === 'Scheduled').length > 0 && (
              <span className="absolute top-1 right-[calc(50%-22px)] bg-racing-red text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {bookings.filter(b => b.status === 'Scheduled').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('cart'); setLastConfirmedBooking(null); }}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
              activeTab === 'cart' && location.pathname === '/cart' ? 'text-racing-red' : 'text-bright-snow/40'
            }`}
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
            onClick={() => { navigate('/contact'); setLastConfirmedBooking(null); }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
              location.pathname === '/contact' ? 'text-racing-red' : 'text-bright-snow/40'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-[9px] font-bold">Contact</span>
          </button>

          <button
            onClick={() => { setActiveTab('account'); setLastConfirmedBooking(null); }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
              activeTab === 'account' && location.pathname === '/account' ? 'text-racing-red' : 'text-bright-snow/40'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[9px] font-bold">Account</span>
          </button>
        </div>
      </nav>
      )}

    </div>
  );
}
