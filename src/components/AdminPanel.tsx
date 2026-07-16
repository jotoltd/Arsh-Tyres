import React, { useState, useMemo } from 'react';
import { Tyre, Booking } from '../types';
import { TYRE_DATABASE } from '../data';
import { Trash2, Edit, Plus, Package, Calendar, CheckCircle, XCircle, Clock, ShieldCheck, Users, Download, AlertTriangle, Tag, TrendingUp, BarChart3, FileText, CreditCard, MessageSquare } from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'inventory' | 'bookings' | 'customers' | 'promos' | 'schedule' | 'staff' | 'reports'>('dashboard');
  const [inventory, setInventory] = useState<Tyre[]>(TYRE_DATABASE);
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
    category: 'All-Season',
    isRunflat: false,
    isReinforced: false,
    fuelEfficiency: 'C',
    wetGrip: 'C',
    noiseLevel: 72,
    stock: 0,
    rating: 4.5,
    reviewsCount: 0
  });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    { code: 'WELCOME10', discount: 10, expiry: '2026-12-31', active: true },
    { code: 'SUMMER20', discount: 20, expiry: '2026-08-31', active: true }
  ]);
  const [staff, setStaff] = useState<Staff[]>([
    { id: '1', name: 'John Smith', role: 'Senior Fitter', email: 'john@arshautos.co.uk', phone: '07700 900000' },
    { id: '2', name: 'Sarah Jones', role: 'Manager', email: 'sarah@arshautos.co.uk', phone: '07700 900001' }
  ]);
  const [bookingNotes, setBookingNotes] = useState<Record<string, string>>({});
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10, expiry: '' });

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
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, stock: newStock } : t));
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setInventory(inventory.map(t => t.id === id ? { ...t, price: newPrice } : t));
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
      category: newTyre.category || 'All-Season',
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
      category: 'All-Season',
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
    setShowPromoForm(false);
    setNewPromo({ code: '', discount: 10, expiry: '' });
  };

  const handleTogglePromo = (code: string) => {
    setPromoCodes(promoCodes.map(p => p.code === code ? { ...p, active: !p.active } : p));
  };

  const handleDeletePromo = (code: string) => {
    setPromoCodes(promoCodes.filter(p => p.code !== code));
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
  };

  const handleUpdateStaff = (id: string, field: keyof Staff, value: string) => {
    setStaff(staff.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter(s => s.id !== id));
  };

  const handleUpdateBookingNote = (bookingId: string, note: string) => {
    setBookingNotes({ ...bookingNotes, [bookingId]: note });
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
    setInventory(inventory.map(t => ({ ...t, price: Math.round(t.price * (1 + percentage / 100)) })));
  };

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
        </div>
      </div>

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black rounded-2xl p-6 border border-white/5 shadow-lg hover:border-racing-red/30 transition-all shadow-[0_0_20px_rgba(239,18,25,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Total Revenue</p>
                  <p className="text-3xl font-extrabold text-racing-red mt-2">£{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-14 h-14 bg-racing-red/20 rounded-xl flex items-center justify-center border border-racing-red/30">
                  <TrendingUp className="w-7 h-7 text-racing-red" />
                </div>
              </div>
            </div>
            <div className="bg-black rounded-2xl p-6 border border-white/5 shadow-lg hover:border-racing-red/30 transition-all shadow-[0_0_20px_rgba(239,18,25,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Total Bookings</p>
                  <p className="text-3xl font-extrabold text-bright-snow mt-2">{stats.totalBookings}</p>
                </div>
                <div className="w-14 h-14 bg-racing-red/20 rounded-xl flex items-center justify-center border border-racing-red/30">
                  <Calendar className="w-7 h-7 text-racing-red" />
                </div>
              </div>
            </div>
            <div className="bg-black rounded-2xl p-6 border border-white/5 shadow-lg hover:border-racing-red/30 transition-all shadow-[0_0_20px_rgba(239,18,25,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Completed</p>
                  <p className="text-3xl font-extrabold text-bright-snow mt-2">{stats.completedBookings}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
            </div>
            <div className="bg-black rounded-2xl p-6 border border-white/5 shadow-lg hover:border-racing-red/30 transition-all shadow-[0_0_20px_rgba(239,18,25,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Scheduled</p>
                  <p className="text-3xl font-extrabold text-bright-snow mt-2">{stats.scheduledBookings}</p>
                </div>
                <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
                  <Clock className="w-7 h-7 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {stats.lowStockItems.length > 0 && (
            <div className="bg-black rounded-2xl border border-racing-red/30 shadow-xl overflow-hidden">
              <div className="p-4 bg-racing-red/10 border-b border-racing-red/20 flex items-center gap-3">
                <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                  <AlertTriangle className="w-5 h-5 text-racing-red" />
                </div>
                <h3 className="font-display font-bold text-racing-red text-lg">Low Stock Alerts</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.lowStockItems.map(tyre => (
                    <div key={tyre.id} className="bg-black/50 rounded-lg p-3 border border-white/5">
                      <p className="font-semibold text-bright-snow text-sm">{tyre.brand} {tyre.model}</p>
                      <p className="text-gray-400 text-xs">{tyre.width}/{tyre.profile} R{tyre.rim}</p>
                      <p className="text-racing-red font-bold text-sm mt-1">Stock: {tyre.stock}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Selling Brands */}
          <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30">
                <BarChart3 className="w-5 h-5 text-racing-red" />
              </div>
              <h3 className="font-display font-bold text-bright-snow text-lg">Top Selling Brands</h3>
            </div>
            <div className="p-4">
              {stats.topBrands.length > 0 ? (
                <div className="space-y-3">
                  {stats.topBrands.map(([brand, count], index) => (
                    <div key={brand} className="flex items-center justify-between bg-[#1e2121] rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-racing-red/20 rounded-lg flex items-center justify-center border border-racing-red/30 text-racing-red font-bold text-sm">
                          #{index + 1}
                        </div>
                        <span className="text-bright-snow font-semibold">{brand}</span>
                      </div>
                      <span className="text-racing-red font-extrabold">{count} tyres</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No sales data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Section */}
      {activeSection === 'inventory' && (
        <div className="bg-black rounded-2xl border border-white/5 shadow-xl overflow-hidden shadow-[0_0_40px_rgba(239,18,25,0.2)]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-racing-red/20 rounded-xl flex items-center justify-center border border-racing-red/30">
                <Package className="w-6 h-6 text-racing-red" />
              </div>
              <h3 className="font-display font-extrabold text-bright-snow text-xl">Inventory Management</h3>
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
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="All-Season">All-Season</option>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50">
                <tr>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Brand</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Model</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Size</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Stock</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Price</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventory.map((tyre) => (
                  <tr key={tyre.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-medium text-bright-snow">{tyre.brand}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{tyre.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{tyre.width}/{tyre.profile} R{tyre.rim}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={tyre.stock}
                        onChange={(e) => handleUpdateStock(tyre.id, parseInt(e.target.value) || 0)}
                        className="w-20 bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={tyre.price}
                        onChange={(e) => handleUpdatePrice(tyre.id, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-[#1e2121] border border-white/10 text-bright-snow rounded px-2 py-1 text-sm focus:outline-none focus:border-racing-red"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-racing-red hover:bg-racing-red/10 rounded-lg transition">
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
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
