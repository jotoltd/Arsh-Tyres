import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tyre, Booking } from '../types';
import { TYRE_DATABASE } from '../data';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Trash2, Edit, Plus, Package, Calendar, CheckCircle, XCircle, Clock, ShieldCheck, Users, Download, AlertTriangle, Tag, TrendingUp, BarChart3, FileText, CreditCard, MessageSquare, Settings, FlaskConical, Zap, LogOut, Lock, Loader2, X, Check, Search } from 'lucide-react';
import { SkeletonRow, SkeletonStatCard } from './Skeleton';
import { getStripeMode, setStripeMode, type StripeMode } from '../paymentSettings';
import { isAdminAuthed, adminLogin, adminLogout } from '../adminAuth';
import { isStockManagementEnabled, setStockManagementEnabled } from '../stockSettings';

interface AdminPanelProps {
  bookings: Booking[];
  onUpdateBooking: (id: string, status: Booking['status']) => void;
}

interface PromoCode {
  code: string;
  discount: number;
  expiry: string;
  active: boolean;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export default function AdminPanel({ bookings, onUpdateBooking }: AdminPanelProps) {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeSection, setActiveSection] = useState<'dashboard' | 'inventory' | 'bookings' | 'customers' | 'promos' | 'schedule' | 'staff' | 'reports' | 'settings'>('dashboard');
  const [inventory, setInventory] = useState<Tyre[]>(TYRE_DATABASE);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [editingTyre, setEditingTyre] = useState<Tyre | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTyre, setNewTyre] = useState<Partial<Tyre>>({
    brand: '',
    model: '',
    width: 205,
    profile: 55,
    rim: 16,
    speedRating: 'V',
    loadIndex: 91,
    price: 0,
    category: 'Standard',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'C',
    wetGrip: 'C',
    noiseLevel: 72,
    stock: 0,
    rating: 4.5,
    reviewsCount: 0
  });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookingNotes, setBookingNotes] = useState<Record<string, string>>({});
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10, expiry: '' });
  const [dataLoading, setDataLoading] = useState(true);
  const [invSearch, setInvSearch] = useState('');
  const [invBrandFilter, setInvBrandFilter] = useState<string>('All');
  const [invSort, setInvSort] = useState<'brand' | 'stock-low' | 'price-high' | 'size'>('brand');

  const [stripeMode, setStripeModeState] = useState<StripeMode>(getStripeMode());
  const [stockManagementEnabled, setStockManagementEnabledState] = useState(isStockManagementEnabled());
  const configured = isSupabaseConfigured();

  const handleToggleStripeMode = () => {
    const newMode = stripeMode === 'test' ? 'live' : 'test';
    setStripeMode(newMode);
    setStripeModeState(newMode);
  };

  const handleToggleStockManagement = () => {
    const newVal = !stockManagementEnabled;
    setStockManagementEnabled(newVal);
    setStockManagementEnabledState(newVal);
  };

  const handleLogin = () => {
    if (adminLogin(loginUser, loginPass)) {
      setAuthed(true);
      setLoginError('');
      setLoginUser('');
      setLoginPass('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setAuthed(false);
  };

  // Load inventory from Supabase
  const loadInventory = useCallback(async () => {
    if (!configured) { setInventory(TYRE_DATABASE); setDataLoading(false); return; }
    setInventoryLoading(true);
    const { data, error } = await supabase.from('tyres').select('*');
    if (!error && data && data.length > 0) {
      setInventory(data.map((raw: any) => ({
        id: raw.id,
        brand: raw.brand,
        model: raw.model,
        width: raw.width,
        profile: raw.profile,
        rim: raw.rim,
        speedRating: raw.speed_rating ?? undefined,
        loadIndex: raw.load_index ?? undefined,
        price: Number(raw.price),
        price4: raw.price_x4 != null ? Number(raw.price_x4) : undefined,
        category: raw.category,
        isRunflat: raw.is_runflat ?? false,
        isReinforced: raw.is_reinforced ?? undefined,
        fuelEfficiency: raw.fuel_efficiency ?? undefined,
        wetGrip: raw.wet_grip ?? undefined,
        noiseLevel: raw.noise_level ?? undefined,
        stock: raw.stock,
        rating: raw.rating != null ? Number(raw.rating) : undefined,
        reviewsCount: raw.reviews_count ?? undefined,
        imageUrl: raw.image_url || undefined,
        recommendedFor: raw.recommended_for || undefined,
      })));
    } else {
      setInventory(TYRE_DATABASE);
    }
    setInventoryLoading(false);
    setDataLoading(false);
  }, [configured]);

  // Load promo codes from Supabase
  const loadPromos = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('promo_codes').select('*');
    if (!error && data) {
      setPromoCodes(data.map((p: any) => ({
        code: p.code,
        discount: p.discount,
        expiry: p.expiry,
        active: p.active,
      })));
    }
  }, [configured]);

  // Load staff from Supabase
  const loadStaff = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('staff').select('*');
    if (!error && data) {
      setStaff(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        email: s.email || '',
        phone: s.phone || '',
      })));
    }
  }, [configured]);

  // Load booking notes from Supabase
  const loadBookingNotes = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('bookings').select('id, admin_note');
    if (!error && data) {
      const notes: Record<string, string> = {};
      data.forEach((row: any) => {
        if (row.admin_note) notes[row.id] = row.admin_note;
      });
      setBookingNotes(notes);
    }
  }, [configured]);

  // Load all data on mount (when authed)
  useEffect(() => {
    if (!authed) return;
    loadInventory();
    loadPromos();
    loadStaff();
    loadBookingNotes();
  }, [authed, loadInventory, loadPromos, loadStaff, loadBookingNotes]);

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const scheduledBookings = bookings.filter(b => b.status === 'Scheduled').length;
    
    const lowStockItems = inventory.filter(t => t.stock < 5);
    
    // Top selling brands
    const brandSales: Record<string, number> = {};
    bookings.forEach(b => {
      b.cartItems.forEach(item => {
        brandSales[item.tyre.brand] = (brandSales[item.tyre.brand] || 0) + item.quantity;
      });
    });
    
    const topBrands = Object.entries(brandSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalRevenue,
      totalBookings,
      completedBookings,
      scheduledBookings,
      lowStockItems,
      topBrands
    };
  }, [bookings, inventory]);

  // Get unique customers
  const customers = useMemo(() => {
    const customerMap = new Map();
    bookings.forEach(booking => {
      if (!customerMap.has(booking.customerEmail)) {
        customerMap.set(booking.customerEmail, {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          totalSpent: bookings
            .filter(b => b.customerEmail === booking.customerEmail && b.status === 'Completed')
            .reduce((sum, b) => sum + b.totalPrice, 0),
          bookingCount: bookings.filter(b => b.customerEmail === booking.customerEmail).length
        });
      }
    });
    return Array.from(customerMap.values());
  }, [bookings]);

  const handleDeleteTyre = (id: string) => {
    setInventory(inventory.filter(t => t.id !== id));
    if (configured) supabase.from('tyres').delete().eq('id', id).then();
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, stock: newStock } : t));
    if (configured) supabase.from('tyres').update({ stock: newStock }).eq('id', id).then();
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, price: newPrice } : t));
    if (configured) supabase.from('tyres').update({ price: newPrice }).eq('id', id).then();
  };

  const handleAddTyre = () => {
    if (!newTyre.brand || !newTyre.model || !newTyre.price) {
      alert('Please fill in brand, model, and price');
      return;
    }

    const tyre: Tyre = {
      id: `${newTyre.brand}-${newTyre.model}-${Date.now()}`,
      brand: newTyre.brand,
      model: newTyre.model,
      width: newTyre.width || 205,
      profile: newTyre.profile || 55,
      rim: newTyre.rim || 16,
      speedRating: newTyre.speedRating || 'V',
      loadIndex: newTyre.loadIndex || 91,
      price: newTyre.price,
      category: newTyre.category || 'Standard',
      isRunflat: newTyre.isRunflat || false,
      isReinforced: newTyre.isReinforced || false,
      fuelEfficiency: newTyre.fuelEfficiency || 'C',
      wetGrip: newTyre.wetGrip || 'C',
      noiseLevel: newTyre.noiseLevel || 72,
      stock: newTyre.stock || 0,
      rating: newTyre.rating || 4.5,
      reviewsCount: newTyre.reviewsCount || 0
    };

    setInventory([...inventory, tyre]);
    if (configured) {
      supabase.from('tyres').insert({
        id: tyre.id, brand: tyre.brand, model: tyre.model,
        width: tyre.width, profile: tyre.profile, rim: tyre.rim,
        speed_rating: tyre.speedRating, load_index: tyre.loadIndex,
        price: tyre.price, price_x4: tyre.price4,
        category: tyre.category, is_runflat: tyre.isRunflat,
        is_reinforced: tyre.isReinforced, fuel_efficiency: tyre.fuelEfficiency,
        wet_grip: tyre.wetGrip, noise_level: tyre.noiseLevel,
        stock: tyre.stock, rating: tyre.rating, reviews_count: tyre.reviewsCount,
      }).then();
    }
    setShowAddForm(false);
    setNewTyre({
      brand: '',
      model: '',
      width: 205,
      profile: 55,
      rim: 16,
      speedRating: 'V',
      loadIndex: 91,
      price: 0,
      category: 'Standard',
      isRunflat: false,
      isReinforced: false,
      fuelEfficiency: 'C',
      wetGrip: 'C',
      noiseLevel: 72,
      stock: 0,
      rating: 4.5,
      reviewsCount: 0
    });
  };

  const handleAddPromo = () => {
    if (!newPromo.code || !newPromo.expiry) {
      alert('Please fill in code and expiry date');
      return;
    }
    setPromoCodes([...promoCodes, { ...newPromo, active: true }]);
    if (configured) {
      supabase.from('promo_codes').insert({
        code: newPromo.code.toUpperCase(),
        discount: newPromo.discount,
        expiry: newPromo.expiry,
        active: true,
      }).then();
    }
    setShowPromoForm(false);
    setNewPromo({ code: '', discount: 10, expiry: '' });
  };

  const handleTogglePromo = (code: string) => {
    const promo = promoCodes.find(p => p.code === code);
    const newActive = promo ? !promo.active : true;
    setPromoCodes(promoCodes.map(p => p.code === code ? { ...p, active: !p.active } : p));
    if (configured) supabase.from('promo_codes').update({ active: newActive }).eq('code', code).then();
  };

  const handleDeletePromo = (code: string) => {
    setPromoCodes(promoCodes.filter(p => p.code !== code));
    if (configured) supabase.from('promo_codes').delete().eq('code', code).then();
  };

  const handleAddStaff = () => {
    const newStaffMember: Staff = {
      id: Date.now().toString(),
      name: 'New Staff',
      role: 'Fitter',
      email: '',
      phone: ''
    };
    setStaff([...staff, newStaffMember]);
    if (configured) {
      supabase.from('staff').insert({
        id: newStaffMember.id, name: newStaffMember.name,
        role: newStaffMember.role, email: newStaffMember.email, phone: newStaffMember.phone,
      }).then();
    }
  };

  const handleUpdateStaff = (id: string, field: keyof Staff, value: string) => {
    setStaff(staff.map(s => s.id === id ? { ...s, [field]: value } : s));
    if (configured) supabase.from('staff').update({ [field]: value }).eq('id', id).then();
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter(s => s.id !== id));
    if (configured) supabase.from('staff').delete().eq('id', id).then();
  };

  const handleUpdateBookingNote = (bookingId: string, note: string) => {
    setBookingNotes({ ...bookingNotes, [bookingId]: note });
    if (configured) supabase.from('bookings').update({ admin_note: note }).eq('id', bookingId).then();
  };

  const handleExportCSV = (type: 'bookings' | 'inventory') => {
    let csv = '';
    let filename = '';
    
    if (type === 'bookings') {
      csv = 'Customer,Email,Phone,Vehicle,Date,Type,Status,Total\n';
      bookings.forEach(b => {
        csv += `${b.customerName},${b.customerEmail},${b.customerPhone},${b.vehicleRegistration},${b.date},${b.fittingType},${b.status},£${b.totalPrice}\n`;
      });
      filename = 'bookings-export.csv';
    } else {
      csv = 'Brand,Model,Width,Profile,Rim,Speed,Price,Stock\n';
      inventory.forEach(t => {
        csv += `${t.brand},${t.model},${t.width},${t.profile},${t.rim},${t.speedRating},£${t.price},${t.stock}\n`;
      });
      filename = 'inventory-export.csv';
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkPriceUpdate = (percentage: number) => {
    const updated = inventory.map(t => ({ ...t, price: Math.round(t.price * (1 + percentage / 100)) }));
    setInventory(updated);
    if (configured) {
      updated.forEach(t => {
        supabase.from('tyres').update({ price: t.price }).eq('id', t.id).then();
      });
    }
  };

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl shadow-[0_0_40px_rgba(239,18,25,0.2)] p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-racing-red/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-racing-red/30">
              <Lock className="w-8 h-8 text-racing-red" />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-bright-snow">Admin Login</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your credentials to access the dashboard</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Username"
                className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-semibold uppercase">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Password"
                className="w-full bg-[#1e2121] border border-white/5 text-bright-snow rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-racing-red/20 focus:border-racing-red transition"
              />
            </div>
            {loginError && (
              <div className="bg-racing-red/10 border border-racing-red/20 rounded-lg p-2.5 text-xs text-racing-red font-semibold text-center">
                {loginError}
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-extrabold uppercase tracking-wider text-sm px-5 py-3 rounded-xl transition shadow-lg shadow-racing-red/30"
            >
              <Lock className="w-4 h-4" />
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-black rounded-2xl p-6 border border-white/5 shadow-xl shadow-[0_0_40px_rgba(239,18,25,0.2)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h2 className="font-display font-extrabold text-3xl text-bright-snow flex items-center gap-3">
            <div className="w-12 h-12 bg-racing-red/20 rounded-xl flex items-center justify-center border border-racing-red/30">
              <ShieldCheck className="w-6 h-6 text-racing-red" />
            </div>
            Admin Dashboard
          </h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-[#1e2121] border border-white/5 text-gray-400 hover:text-racing-red hover:border-racing-red/30 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'dashboard'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('inventory')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'inventory'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory
          </button>
          <button
            onClick={() => setActiveSection('bookings')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'bookings'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Bookings
          </button>
          <button
            onClick={() => setActiveSection('customers')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'customers'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Customers
          </button>
          <button
            onClick={() => setActiveSection('promos')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'promos'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            Promos
          </button>
          <button
            onClick={() => setActiveSection('schedule')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'schedule'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={() => setActiveSection('staff')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'staff'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Staff
          </button>
          <button
            onClick={() => setActiveSection('reports')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'reports'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`px-4 py-3 text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              activeSection === 'settings'
                ? 'bg-racing-red text-bright-snow shadow-lg shadow-racing-red/30 border border-racing-red'
                : 'bg-[#1e2121] text-gray-400 hover:bg-racing-red/10 hover:text-bright-snow border border-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards or Skeletons */}
          {dataLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
            </div>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-racing-red/10 to-black rounded-2xl p-5 border border-racing-red/20 shadow-lg hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                  <TrendingUp className="w-5 h-5 text-racing-red" />
                </div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Revenue</p>
              </div>
              <p className="text-2xl font-extrabold text-racing-red">£{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-black rounded-2xl p-5 border border-white/5 shadow-lg hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Bookings</p>
              </div>
              <p className="text-2xl font-extrabold text-bright-snow">{stats.totalBookings}</p>
            </div>
            <div className="bg-black rounded-2xl p-5 border border-white/5 shadow-lg hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Completed</p>
              </div>
              <p className="text-2xl font-extrabold text-bright-snow">{stats.completedBookings}</p>
            </div>
            <div className="bg-black rounded-2xl p-5 border border-white/5 shadow-lg hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center border border-yellow-500/30">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Scheduled</p>
              </div>
              <p className="text-2xl font-extrabold text-bright-snow">{stats.scheduledBookings}</p>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Brands — visual bar chart */}
            <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                  <BarChart3 className="w-5 h-5 text-racing-red" />
                </div>
                <h3 className="font-display font-bold text-bright-snow text-lg">Top Selling Brands</h3>
              </div>
              <div className="p-5">
                {stats.topBrands.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topBrands.map(([brand, count], index) => {
                      const maxCount = stats.topBrands[0][1];
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={brand}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-racing-red font-bold text-xs">#{index + 1}</span>
                              <span className="text-bright-snow font-semibold text-sm">{brand}</span>
                            </div>
                            <span className="text-gray-400 text-xs font-bold">{count} tyres</span>
                          </div>
                          <div className="h-2.5 bg-[#1e2121] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-racing-red to-racing-red/60 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No sales data yet</p>
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                  <Calendar className="w-5 h-5 text-racing-red" />
                </div>
                <h3 className="font-display font-bold text-bright-snow text-lg">Recent Bookings</h3>
              </div>
              <div className="p-4">
                {bookings.length > 0 ? (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between bg-[#1e2121] rounded-lg p-3 border border-white/5">
                        <div className="min-w-0 flex-1">
                          <p className="text-bright-snow text-sm font-semibold truncate">{booking.customerName}</p>
                          <p className="text-gray-400 text-xs truncate">{booking.vehicleRegistration} · {booking.date || 'Collection'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-bright-snow font-bold text-sm">£{booking.totalPrice.toFixed(0)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            booking.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            booking.status === 'Cancelled' ? 'bg-racing-red/20 text-racing-red' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>{booking.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No bookings yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {stockManagementEnabled && stats.lowStockItems.length > 0 && (
            <div className="bg-black rounded-2xl border border-racing-red/30 shadow-xl overflow-hidden">
              <div className="p-4 bg-racing-red/10 border-b border-racing-red/20 flex items-center gap-3">
                <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                  <AlertTriangle className="w-5 h-5 text-racing-red" />
                </div>
                <h3 className="font-display font-bold text-racing-red text-lg">Low Stock Alerts</h3>
                <span className="ml-auto text-racing-red text-xs font-bold bg-racing-red/10 px-2 py-1 rounded-full">{stats.lowStockItems.length} items</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.lowStockItems.map(tyre => (
                    <div key={tyre.id} className="bg-black/50 rounded-lg p-3 border border-white/5 hover:border-racing-red/20 transition">
                      <p className="font-semibold text-bright-snow text-sm">{tyre.brand} {tyre.model}</p>
                      <p className="text-gray-400 text-xs">{tyre.width}/{tyre.profile} R{tyre.rim}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-[#1e2121] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${tyre.stock > 4 ? 'bg-yellow-500' : 'bg-racing-red'}`} style={{ width: `${Math.min(tyre.stock * 10, 100)}%` }} />
                        </div>
                        <p className="text-racing-red font-bold text-xs">{tyre.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Section */}
      {activeSection === 'inventory' && (
        <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden shadow-[0_0_40px_rgba(239,18,25,0.2)]">
          <div className="p-6 border-b border-white/5">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-racing-red/20 rounded-xl flex items-center justify-center border border-racing-red/30">
                  <Package className="w-6 h-6 text-racing-red" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-bright-snow text-xl">Inventory Management</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inventory.length} tyres across {new Set(inventory.map(t => t.brand)).size} brands
                    {!stockManagementEnabled && <span className="text-emerald-400 font-bold"> — Unlimited stock</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-racing-red/30 border border-racing-red"
                >
                  <Plus className="w-4 h-4" />
                  Add Tyre
                </button>
                <button
                  onClick={() => handleBulkPriceUpdate(5)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/30"
                >
                  <TrendingUp className="w-4 h-4" />
                  +5% Prices
                </button>
                <button
                  onClick={() => handleBulkPriceUpdate(-5)}
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-orange-600/30"
                >
                  <TrendingUp className="w-4 h-4 rotate-180" />
                  -5% Prices
                </button>
                <button
                  onClick={() => handleExportCSV('inventory')}
                  className="inline-flex items-center gap-2 bg-[#1e2121] hover:bg-[#252828] text-bright-snow font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-lg border border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#1e2121] rounded-lg px-4 py-2.5 border border-white/5">
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Total Units</p>
                <p className="text-lg font-extrabold text-bright-snow">{stockManagementEnabled ? inventory.reduce((s, t) => s + t.stock, 0) : '∞'}</p>
              </div>
              <div className={`rounded-lg px-4 py-2.5 border ${stockManagementEnabled ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-[#1e2121] border-white/5'}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${stockManagementEnabled ? 'text-yellow-400' : 'text-gray-400'}`}>Low Stock</p>
                <p className={`text-lg font-extrabold ${stockManagementEnabled ? 'text-yellow-400' : 'text-gray-500'}`}>{stockManagementEnabled ? inventory.filter(t => t.stock > 0 && t.stock <= 4).length : '—'}</p>
              </div>
              <div className={`rounded-lg px-4 py-2.5 border ${stockManagementEnabled ? 'bg-racing-red/10 border-racing-red/20' : 'bg-[#1e2121] border-white/5'}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${stockManagementEnabled ? 'text-racing-red' : 'text-gray-400'}`}>Out of Stock</p>
                <p className={`text-lg font-extrabold ${stockManagementEnabled ? 'text-racing-red' : 'text-gray-500'}`}>{stockManagementEnabled ? inventory.filter(t => t.stock === 0).length : '—'}</p>
              </div>
            </div>

            {/* Search + filter + sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={invSearch}
                  onChange={e => setInvSearch(e.target.value)}
                  placeholder="Search brand, model, or size (e.g. 225/45 R17)..."
                  className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-racing-red"
                />
              </div>
              <select
                value={invSort}
                onChange={e => setInvSort(e.target.value as any)}
                className="bg-[#1e2121] border border-white/10 text-bright-snow rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-racing-red"
              >
                <option value="brand">Sort: Brand A-Z</option>
                {stockManagementEnabled && <option value="stock-low">Sort: Low Stock First</option>}
                <option value="price-high">Sort: Price High-Low</option>
                <option value="size">Sort: By Size</option>
              </select>
            </div>

            {/* Brand filter chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button
                onClick={() => setInvBrandFilter('All')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${invBrandFilter === 'All' ? 'bg-racing-red text-bright-snow' : 'bg-white/5 text-gray-400 hover:text-bright-snow'}`}
              >
                All ({inventory.length})
              </button>
              {[...new Set(inventory.map(t => t.brand))].sort().map(brand => {
                const count = inventory.filter(t => t.brand === brand).length;
                return (
                  <button
                    key={brand}
                    onClick={() => setInvBrandFilter(brand)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${invBrandFilter === brand ? 'bg-racing-red text-bright-snow' : 'bg-white/5 text-gray-400 hover:text-bright-snow'}`}
                  >
                    {brand} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Tyre Form */}
          {showAddForm && (
            <div className="p-6 border-b border-white/5 bg-black/30">
              <h4 className="font-display font-bold text-bright-snow text-sm mb-4">Add New Tyre</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Brand</label>
                  <input
                    type="text"
                    value={newTyre.brand}
                    onChange={(e) => setNewTyre({ ...newTyre, brand: e.target.value })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                    placeholder="e.g., Michelin"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Model</label>
                  <input
                    type="text"
                    value={newTyre.model}
                    onChange={(e) => setNewTyre({ ...newTyre, model: e.target.value })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                    placeholder="e.g., Pilot Sport 4"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Width</label>
                  <input
                    type="number"
                    value={newTyre.width}
                    onChange={(e) => setNewTyre({ ...newTyre, width: parseInt(e.target.value) || 205 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Profile</label>
                  <input
                    type="number"
                    value={newTyre.profile}
                    onChange={(e) => setNewTyre({ ...newTyre, profile: parseInt(e.target.value) || 55 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Rim</label>
                  <input
                    type="number"
                    value={newTyre.rim}
                    onChange={(e) => setNewTyre({ ...newTyre, rim: parseInt(e.target.value) || 16 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Speed Rating</label>
                  <select
                    value={newTyre.speedRating}
                    onChange={(e) => setNewTyre({ ...newTyre, speedRating: e.target.value })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  >
                    <option value="H">H (130 mph)</option>
                    <option value="V">V (149 mph)</option>
                    <option value="W">W (168 mph)</option>
                    <option value="Y">Y (186 mph)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Price (£)</label>
                  <input
                    type="number"
                    value={newTyre.price}
                    onChange={(e) => setNewTyre({ ...newTyre, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Stock</label>
                  <input
                    type="number"
                    value={newTyre.stock}
                    onChange={(e) => setNewTyre({ ...newTyre, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Category</label>
                  <select
                    value={newTyre.category}
                    onChange={(e) => setNewTyre({ ...newTyre, category: e.target.value as Tyre['category'] })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Runflat">Runflat</option>
                    <option value="Commercial">Commercial (Van)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddTyre}
                  className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Tyre
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-bright-snow hover:bg-white/5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {inventoryLoading && (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Brand</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Model</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Size</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Category</th>
                  {stockManagementEnabled && <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Stock</th>}
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(() => {
                  let filtered = inventory;
                  if (invBrandFilter !== 'All') filtered = filtered.filter(t => t.brand === invBrandFilter);
                  if (invSearch.trim()) {
                    const q = invSearch.toLowerCase();
                    filtered = filtered.filter(t =>
                      t.brand.toLowerCase().includes(q) ||
                      t.model.toLowerCase().includes(q) ||
                      `${t.width}/${t.profile} R${t.rim}`.toLowerCase().includes(q) ||
                      `${t.width}${t.profile}${t.rim}`.includes(q.replace(/[^\d]/g, ''))
                    );
                  }
                  if (invSort === 'brand') filtered = [...filtered].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
                  else if (invSort === 'stock-low') filtered = [...filtered].sort((a, b) => a.stock - b.stock);
                  else if (invSort === 'price-high') filtered = [...filtered].sort((a, b) => b.price - a.price);
                  else if (invSort === 'size') filtered = [...filtered].sort((a, b) => (a.width * a.profile * a.rim) - (b.width * b.profile * b.rim));

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={stockManagementEnabled ? 7 : 6} className="px-6 py-12 text-center text-gray-500 text-sm">
                          No tyres match your search.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((tyre) => {
                    const stockStatus = tyre.stock === 0 ? 'out' : tyre.stock <= 4 ? 'low' : 'ok';
                    return (
                      <tr key={tyre.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-sm font-bold text-bright-snow">{tyre.brand}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{tyre.model}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{tyre.width}/{tyre.profile} R{tyre.rim}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tyre.category === 'Runflat' ? 'bg-blue-500/15 text-blue-400' :
                            tyre.category === 'Commercial' ? 'bg-orange-500/15 text-orange-400' :
                            'bg-white/5 text-gray-400'
                          }`}>{tyre.category}</span>
                        </td>
                        {stockManagementEnabled && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={tyre.stock}
                                onChange={(e) => handleUpdateStock(tyre.id, parseInt(e.target.value) || 0)}
                                className={`w-16 bg-[#1e2121] border rounded px-2 py-1 text-sm focus:outline-none ${
                                  stockStatus === 'out' ? 'border-racing-red/50 text-racing-red' :
                                  stockStatus === 'low' ? 'border-yellow-500/50 text-yellow-400' :
                                  'border-white/10 text-bright-snow'
                                } focus:border-racing-red`}
                              />
                              {stockStatus === 'out' && <span className="text-[10px] font-bold text-racing-red">OUT</span>}
                              {stockStatus === 'low' && <span className="text-[10px] font-bold text-yellow-400">LOW</span>}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-sm">£</span>
                            <input
                              type="number"
                              value={tyre.price}
                              onChange={(e) => handleUpdatePrice(tyre.id, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTyre(tyre)}
                              className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTyre(tyre.id)}
                              className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Tyre Modal */}
      {editingTyre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setEditingTyre(null)}>
          <div className="bg-[#1e2121] rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-display font-bold text-bright-snow text-lg">Edit Tyre</h4>
              <button onClick={() => setEditingTyre(null)} className="text-gray-400 hover:text-racing-red transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Brand</label>
                <input type="text" value={editingTyre.brand} onChange={e => setEditingTyre({ ...editingTyre, brand: e.target.value })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Model</label>
                <input type="text" value={editingTyre.model} onChange={e => setEditingTyre({ ...editingTyre, model: e.target.value })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Category</label>
                <select value={editingTyre.category} onChange={e => setEditingTyre({ ...editingTyre, category: e.target.value as any })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none">
                  <option value="Standard">Standard</option>
                  <option value="Runflat">Runflat</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Width</label>
                <input type="number" value={editingTyre.width} onChange={e => setEditingTyre({ ...editingTyre, width: parseInt(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Profile</label>
                <input type="number" value={editingTyre.profile} onChange={e => setEditingTyre({ ...editingTyre, profile: parseInt(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Rim</label>
                <input type="number" value={editingTyre.rim} onChange={e => setEditingTyre({ ...editingTyre, rim: parseInt(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Speed Rating</label>
                <input type="text" value={editingTyre.speedRating || ''} onChange={e => setEditingTyre({ ...editingTyre, speedRating: e.target.value })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Load Index</label>
                <input type="number" value={editingTyre.loadIndex || 0} onChange={e => setEditingTyre({ ...editingTyre, loadIndex: parseInt(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Price (£)</label>
                <input type="number" step="0.01" value={editingTyre.price} onChange={e => setEditingTyre({ ...editingTyre, price: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Price x4 (£)</label>
                <input type="number" step="0.01" value={editingTyre.price4 ?? ''} onChange={e => setEditingTyre({ ...editingTyre, price4: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Stock</label>
                <input type="number" value={editingTyre.stock} onChange={e => setEditingTyre({ ...editingTyre, stock: parseInt(e.target.value) || 0 })} className="w-full bg-[#0d0e0e] border border-white/10 text-bright-snow rounded-lg px-3 py-2 text-sm focus:border-racing-red focus:outline-none" />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={editingTyre.isRunflat} onChange={e => setEditingTyre({ ...editingTyre, isRunflat: e.target.checked })} className="accent-racing-red" />
                  Runflat
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={editingTyre.isReinforced || false} onChange={e => setEditingTyre({ ...editingTyre, isReinforced: e.target.checked })} className="accent-racing-red" />
                  Reinforced
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const updated = inventory.map(t => t.id === editingTyre.id ? editingTyre : t);
                  setInventory(updated);
                  if (configured) {
                    supabase.from('tyres').update({
                      brand: editingTyre.brand,
                      model: editingTyre.model,
                      width: editingTyre.width,
                      profile: editingTyre.profile,
                      rim: editingTyre.rim,
                      speed_rating: editingTyre.speedRating,
                      load_index: editingTyre.loadIndex,
                      price: editingTyre.price,
                      price_x4: editingTyre.price4,
                      category: editingTyre.category,
                      is_runflat: editingTyre.isRunflat,
                      is_reinforced: editingTyre.isReinforced,
                      stock: editingTyre.stock,
                    }).eq('id', editingTyre.id).then();
                  }
                  setEditingTyre(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-bold text-sm px-4 py-2.5 rounded-lg transition"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setEditingTyre(null)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-bright-snow hover:bg-white/5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Section */}
      {activeSection === 'bookings' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-bold text-bright-snow text-lg">Bookings Management</h3>
            <button 
              onClick={() => handleExportCSV('bookings')}
              className="inline-flex items-center gap-2 bg-[#1e2121] hover:bg-[#252828] text-bright-snow font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md border border-white/10"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Vehicle</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Notes</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm font-medium text-bright-snow">{booking.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{booking.vehicleRegistration}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{booking.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{booking.fittingType}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          booking.status === 'Cancelled' ? 'bg-racing-red/10 text-racing-red border border-racing-red/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {booking.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                          {booking.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                          {booking.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={bookingNotes[booking.id] || ''}
                          onChange={(e) => handleUpdateBookingNote(booking.id, e.target.value)}
                          placeholder="Add note..."
                          className="w-32 bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-xs focus:outline-none focus:border-racing-red"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {booking.status === 'Scheduled' && (
                            <>
                              <button
                                onClick={() => onUpdateBooking(booking.id, 'Completed')}
                                className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Mark as Complete"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onUpdateBooking(booking.id, 'Cancelled')}
                                className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition"
                                title="Cancel Booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers Section */}
      {activeSection === 'customers' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-display font-bold text-bright-snow text-lg">Customer Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Email</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Phone</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Total Spent</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No customers yet
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr key={index} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm font-medium text-bright-snow">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{customer.phone}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-400">£{customer.totalSpent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{customer.bookingCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promos Section */}
      {activeSection === 'promos' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-bold text-bright-snow text-lg">Promo Codes</h3>
            <button 
              onClick={() => setShowPromoForm(!showPromoForm)}
              className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Promo
            </button>
          </div>

          {showPromoForm && (
            <div className="p-6 border-b border-white/5 bg-black/30">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Code</label>
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                    placeholder="CODE10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={newPromo.discount}
                    onChange={(e) => setNewPromo({ ...newPromo, discount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newPromo.expiry}
                    onChange={(e) => setNewPromo({ ...newPromo, expiry: e.target.value })}
                    className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-3 py-2 text-sm focus:outline-none focus:border-racing-red"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddPromo}
                  className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md"
                >
                  Add Promo
                </button>
                <button
                  onClick={() => setShowPromoForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-bright-snow hover:bg-white/5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Code</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Discount</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Expiry</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {promoCodes.map((promo) => (
                  <tr key={promo.code} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-bold text-bright-snow">{promo.code}</td>
                    <td className="px-6 py-4 text-sm text-emerald-400 font-bold">{promo.discount}%</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{promo.expiry}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        promo.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-racing-red/10 text-racing-red border border-racing-red/20'
                      }`}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePromo(promo.code)}
                          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                          title="Toggle Status"
                        >
                          {promo.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.code)}
                          className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Section */}
      {activeSection === 'schedule' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-display font-bold text-bright-snow text-lg">Service Schedule</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bookings.filter(b => b.status === 'Scheduled').length === 0 ? (
                <p className="text-gray-400 text-center py-8">No scheduled bookings</p>
              ) : (
                bookings
                  .filter(b => b.status === 'Scheduled')
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((booking) => (
                    <div key={booking.id} className="bg-black/50 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-bright-snow">{booking.date} - {booking.timeSlot}</p>
                          <p className="text-sm text-gray-400">{booking.customerName} - {booking.vehicleRegistration}</p>
                          <p className="text-xs text-gray-500 mt-1">{booking.fittingType} fitting</p>
                        </div>
                        <div className="text-right">
                          <p className="text-racing-red font-bold">£{booking.totalPrice}</p>
                          <p className="text-xs text-gray-400">{booking.cartItems.length} tyres</p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Section */}
      {activeSection === 'staff' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-bold text-bright-snow text-lg">Staff Management</h3>
            <button 
              onClick={handleAddStaff}
              className="inline-flex items-center gap-2 bg-racing-red hover:bg-racing-red/90 text-bright-snow font-semibold text-sm px-4 py-2 rounded-lg transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Role</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Email</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Phone</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateStaff(member.id, 'name', e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => handleUpdateStaff(member.id, 'role', e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleUpdateStaff(member.id, 'email', e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={member.phone}
                        onChange={(e) => handleUpdateStaff(member.id, 'phone', e.target.value)}
                        className="w-full bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-display font-bold text-bright-snow text-lg">Reports</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                <h4 className="font-semibold text-bright-snow mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-racing-red" />
                  Sales by Brand
                </h4>
                <div className="space-y-2">
                  {stats.topBrands.map(([brand, count]) => (
                    <div key={brand} className="flex justify-between text-sm">
                      <span className="text-gray-400">{brand}</span>
                      <span className="text-bright-snow font-bold">{count} tyres</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                <h4 className="font-semibold text-bright-snow mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-racing-red" />
                  Revenue Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Revenue</span>
                    <span className="text-emerald-400 font-bold">£{stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg per Booking</span>
                    <span className="text-bright-snow font-bold">
                      £{stats.completedBookings > 0 ? Math.round(stats.totalRevenue / stats.completedBookings).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-black/50 rounded-lg p-4 border border-white/5">
              <h4 className="font-semibold text-bright-snow mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-racing-red" />
                Booking Status Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{stats.completedBookings}</p>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.scheduledBookings}</p>
                  <p className="text-xs text-gray-400">Scheduled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-racing-red">{stats.totalBookings - stats.completedBookings - stats.scheduledBookings}</p>
                  <p className="text-xs text-gray-400">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="carbon-fiber rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-display font-bold text-bright-snow text-lg">Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Stock Management Toggle */}
            <div className="bg-black/50 rounded-lg p-5 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stockManagementEnabled ? 'bg-racing-red/20 border-racing-red/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                    <Package className={`w-5 h-5 ${stockManagementEnabled ? 'text-racing-red' : 'text-emerald-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-bright-snow">Stock Management</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stockManagementEnabled
                        ? 'Stock levels are tracked. Low/out of stock alerts are active.'
                        : 'All stock is unlimited. No stock tracking or limits applied.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleStockManagement}
                  className={`relative w-14 h-7 rounded-full transition shrink-0 ${
                    stockManagementEnabled ? 'bg-racing-red' : 'bg-emerald-500'
                  }`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all ${stockManagementEnabled ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>
              {!stockManagementEnabled && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  Unlimited stock mode — customers can order any quantity without restrictions.
                </div>
              )}
            </div>

            {/* Stripe Mode Toggle */}
            <div className="bg-black/50 rounded-lg p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                    <CreditCard className="w-5 h-5 text-racing-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-bright-snow">Stripe Payment Mode</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle between sandbox (test) and live payments</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className={`flex-1 rounded-xl p-4 border transition-all ${
                  stripeMode === 'test'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#1e2121] border-white/5 opacity-60'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-bright-snow text-sm">Sandbox (Test)</span>
                  </div>
                  <p className="text-xs text-gray-400">No real charges. Use test card 4242 4242 4242 4242.</p>
                </div>

                <div className={`flex-1 rounded-xl p-4 border transition-all ${
                  stripeMode === 'live'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-[#1e2121] border-white/5 opacity-60'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-bright-snow text-sm">Live</span>
                  </div>
                  <p className="text-xs text-gray-400">Real charges to customer cards.</p>
                </div>
              </div>

              <button
                onClick={handleToggleStripeMode}
                className={`w-full mt-4 flex items-center justify-center gap-2 font-extrabold uppercase tracking-wider text-sm px-5 py-3 rounded-xl transition ${
                  stripeMode === 'test'
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {stripeMode === 'test' ? (
                  <>Switch to Live Mode</>
                ) : (
                  <>Switch to Sandbox Mode</>
                )}
              </button>

              {stripeMode === 'live' && (
                <div className="mt-4 bg-racing-red/10 border border-racing-red/20 rounded-lg p-3 text-xs text-racing-red font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Live mode is active. Real payments will be processed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
