import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TYRE_DATABASE } from '../data';
import { Tyre, CartItem, Booking } from '../types';

export type TyreDisplayField =
  | 'speedLoad'
  | 'euLabel'
  | 'runflatBadge'
  | 'reinforcedBadge'
  | 'categoryBadge'
  | 'multiBuy'
  | 'recommendedFor';

export const DEFAULT_TYRE_DISPLAY_FIELDS: TyreDisplayField[] = [
  'speedLoad',
  'euLabel',
  'runflatBadge',
  'reinforcedBadge',
  'categoryBadge',
  'multiBuy',
];

export const ALL_TYRE_DISPLAY_FIELDS: { key: TyreDisplayField; label: string; description: string }[] = [
  { key: 'speedLoad', label: 'Speed & Load Index', description: 'Shows speed rating and load index (e.g. 91V)' },
  { key: 'euLabel', label: 'EU Tyre Label', description: 'Fuel efficiency, wet grip, and noise level ratings' },
  { key: 'runflatBadge', label: 'Runflat Badge', description: 'Shows a badge if the tyre is runflat' },
  { key: 'reinforcedBadge', label: 'Reinforced Badge', description: 'Shows a badge if the tyre is reinforced (XL)' },
  { key: 'categoryBadge', label: 'Category Badge', description: 'Shows the tyre category (Standard/Runflat/Commercial)' },
  { key: 'multiBuy', label: 'Multi-Buy Price', description: 'Shows discounted price when buying 4+ tyres' },
  { key: 'recommendedFor', label: 'Recommended For', description: 'Shows what vehicles/conditions the tyre is recommended for' },
];

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  authLoading: boolean;
  tyres: Tyre[];
  tyresLoading: boolean;
  tyresError: string | null;
  refreshTyres: () => void;
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  bookings: Booking[];
  addBooking: (draft: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updatePassword: (newPassword: string) => Promise<{ error?: Error }>;
  stockManagementEnabled: boolean;
  setStockManagementEnabled: (enabled: boolean) => Promise<void>;
  maintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => Promise<void>;
  tyreDisplayFields: TyreDisplayField[];
  setTyreDisplayFields: (fields: TyreDisplayField[]) => Promise<void>;
  settingsLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

function parseTyre(raw: any): Tyre {
  const camel = raw.speedRating !== undefined;
  return {
    id: raw.id,
    brand: raw.brand,
    model: raw.model,
    width: raw.width,
    profile: raw.profile,
    rim: raw.rim,
    speedRating: camel ? raw.speedRating : raw.speed_rating,
    loadIndex: camel ? raw.loadIndex : raw.load_index,
    price: Number(raw.price),
    price4: (raw.price4 ?? raw.price_x4) != null ? Number(raw.price4 ?? raw.price_x4) : undefined,
    category: raw.category,
    isRunflat: raw.isRunflat ?? raw.is_runflat,
    isReinforced: (raw.isReinforced ?? raw.is_reinforced) ?? undefined,
    fuelEfficiency: (camel ? raw.fuelEfficiency : raw.fuel_efficiency) ?? undefined,
    wetGrip: (camel ? raw.wetGrip : raw.wet_grip) ?? undefined,
    noiseLevel: (camel ? raw.noiseLevel : raw.noise_level) ?? undefined,
    stock: raw.stock,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    reviewsCount: (raw.reviewsCount ?? raw.reviews_count) ?? undefined,
    imageUrl: (raw.imageUrl ?? raw.image_url) || undefined,
    recommendedFor: (raw.recommendedFor ?? raw.recommended_for) || undefined,
  };
}

function dbBookingToBooking(row: any): Booking {
  const items = Array.isArray(row.items)
    ? row.items.map((entry: any) => ({
        tyre: parseTyre(entry.tyre),
        quantity: entry.quantity,
      }))
    : [];

  return {
    id: row.id,
    cartItems: items,
    subtotal: Number(row.subtotal),
    fittingFee: Number(row.fitting_fee),
    totalPrice: Number(row.total_price),
    fittingType: row.fitting_type,
    date: row.booking_date,
    timeSlot: row.booking_time,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    vehicleRegistration: row.vehicle_registration,
    vehicleMakeModel: row.vehicle_make_model,
    status: row.status,
    createdAt: row.created_at,
  };
}

const CART_KEY = 'arsh_autos_cart';
const CART_VERSION_KEY = 'arsh_autos_cart_version';
const CART_VERSION = '2'; // bump to force-clear stale carts

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tyres, setTyres] = useState<Tyre[]>(TYRE_DATABASE);
  const [tyresLoading, setTyresLoading] = useState(false);
  const [tyresError, setTyresError] = useState<string | null>(null);
  const [cartItems, setCartItemsState] = useState<CartItem[]>([]);
  const [bookings, setBookingsState] = useState<Booking[]>([]);
  const [stockManagementEnabled, setStockManagementEnabledState] = useState(false);
  const [maintenanceMode, setMaintenanceModeState] = useState(false);
  const [tyreDisplayFields, setTyreDisplayFieldsState] = useState<TyreDisplayField[]>(DEFAULT_TYRE_DISPLAY_FIELDS);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const configured = isSupabaseConfigured();
  const user = session?.user ?? null;

  // Auth session listener
  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session);
      if (mounted) setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  // Load tyres from Supabase, falling back to the static database
  useEffect(() => {
    if (!configured) return;

    let mounted = true;
    setTyresLoading(true);
    supabase
      .from('tyres')
      .select('*')
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Failed to load tyres from Supabase:', error.message);
          setTyresError('Using local tyre database.');
          setTyres(TYRE_DATABASE);
        } else if (data && data.length > 0) {
          setTyres(data.map(parseTyre));
          setTyresError(null);
        } else {
          setTyres(TYRE_DATABASE);
          setTyresError('No tyres found in Supabase; using local data.');
        }
        setTyresLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [configured]);

  // Load settings from Supabase
  useEffect(() => {
    if (!configured) return;

    let mounted = true;
    setSettingsLoading(true);
    supabase
      .from('settings')
      .select('key, value')
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) {
          const settingsMap: Record<string, string> = {};
          data.forEach((row: any) => {
            settingsMap[row.key] = row.value;
          });
          const stockEnabled = settingsMap['stock_management_enabled'] === 'true';
          setStockManagementEnabledState(stockEnabled);
          const maintMode = settingsMap['maintenance_mode'] === 'true';
          setMaintenanceModeState(maintMode);
          try {
            const fields = JSON.parse(settingsMap['tyre_display_fields'] || 'null');
            if (Array.isArray(fields)) setTyreDisplayFieldsState(fields);
          } catch { /* keep defaults */ }
        }
        setSettingsLoading(false);
      });

    return () => { mounted = false; };
  }, [configured]);

  const setStockManagementEnabled = useCallback(async (enabled: boolean) => {
    setStockManagementEnabledState(enabled);

    if (!configured) return;

    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'stock_management_enabled')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({ value: String(enabled), updated_at: new Date().toISOString() })
        .eq('key', 'stock_management_enabled');
    } else {
      await supabase
        .from('settings')
        .insert({ key: 'stock_management_enabled', value: String(enabled) });
    }
  }, [configured]);

  const setMaintenanceMode = useCallback(async (enabled: boolean) => {
    setMaintenanceModeState(enabled);

    if (!configured) return;

    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'maintenance_mode')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({ value: String(enabled), updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode');
    } else {
      await supabase
        .from('settings')
        .insert({ key: 'maintenance_mode', value: String(enabled) });
    }
  }, [configured]);

  const setTyreDisplayFields = useCallback(async (fields: TyreDisplayField[]) => {
    setTyreDisplayFieldsState(fields);

    if (!configured) return;

    const json = JSON.stringify(fields);
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'tyre_display_fields')
      .single();

    if (existing) {
      await supabase
        .from('settings')
        .update({ value: json, updated_at: new Date().toISOString() })
        .eq('key', 'tyre_display_fields');
    } else {
      await supabase
        .from('settings')
        .insert({ key: 'tyre_display_fields', value: json });
    }
  }, [configured]);

  const refreshTyres = useCallback(() => {
    if (!configured) return;
    setTyresLoading(true);
    supabase
      .from('tyres')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to refresh tyres:', error.message);
        } else if (data && data.length > 0) {
          setTyres(data.map(parseTyre));
        }
        setTyresLoading(false);
      });
  }, [configured]);

  // Load cart from localStorage on mount (clear if version mismatch)
  useEffect(() => {
    try {
      const version = localStorage.getItem(CART_VERSION_KEY);
      if (version !== CART_VERSION) {
        localStorage.removeItem(CART_KEY);
        localStorage.setItem(CART_VERSION_KEY, CART_VERSION);
      } else {
        const saved = localStorage.getItem(CART_KEY);
        if (saved) setCartItemsState(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load cart from Supabase when signed in
  useEffect(() => {
    if (!configured || !user) return;

    let mounted = true;
    supabase
      .from('cart_items')
      .select('items')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (data && Array.isArray(data.items)) {
          const parsed = data.items.map((entry: any) => ({
            tyre: parseTyre(entry.tyre),
            quantity: entry.quantity,
          }));
          setCartItemsState(parsed);
        }
        // If row doesn't exist, ignore.
      });

    return () => {
      mounted = false;
    };
  }, [configured, user]);

  // Persist cart to localStorage and Supabase
  const setCartItems = useCallback(async (items: CartItem[]) => {
    setCartItemsState(items);
    localStorage.setItem(CART_KEY, JSON.stringify(items));

    if (!configured || !user) return;

    const payload = items.map((item) => ({
      tyre: item.tyre,
      quantity: item.quantity,
    }));

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ items: payload as any, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({ user_id: user.id, items: payload as any });
    }
  }, [configured, user]);

  // Load bookings from Supabase (all bookings, not just user-scoped)
  useEffect(() => {
    if (!configured) return;

    let mounted = true;
    supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Failed to load bookings:', error.message);
          return;
        }
        if (data) setBookingsState(data.map(dbBookingToBooking));
      });

    return () => {
      mounted = false;
    };
  }, [configured]);

  const addBooking = useCallback(
    async (draft: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking | null> => {
      const id = 'ab' + Math.random().toString(36).substring(2, 8);
      const newBooking: Booking = {
        ...draft,
        id,
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
      };

      const updated = [newBooking, ...bookings];
      setBookingsState(updated);

      if (configured) {
        const { error } = await supabase.from('bookings').insert({
          id: newBooking.id,
          user_id: user?.id ?? null,
          booking_date: newBooking.date,
          booking_time: newBooking.timeSlot,
          fitting_type: newBooking.fittingType,
          vehicle_registration: newBooking.vehicleRegistration,
          vehicle_make_model: newBooking.vehicleMakeModel,
          customer_name: newBooking.customerName,
          customer_email: newBooking.customerEmail,
          customer_phone: newBooking.customerPhone,
          subtotal: newBooking.subtotal,
          fitting_fee: newBooking.fittingFee,
          total_price: newBooking.totalPrice,
          status: newBooking.status,
          items: newBooking.cartItems.map((item) => ({
            tyre: item.tyre,
            quantity: item.quantity,
          })) as any,
        });

        if (error) {
          console.error('Supabase booking insert failed:', error.message);
        }
      }

      return newBooking;
    },
    [bookings, configured]
  );

  const cancelBooking = useCallback(
    async (id: string) => {
      const updated = bookings.map((b) => (b.id === id ? { ...b, status: 'Cancelled' as const } : b));
      setBookingsState(updated);

      if (configured) {
        await supabase
          .from('bookings')
          .update({ status: 'Cancelled' })
          .eq('id', id);
      }
    },
    [bookings, configured]
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: Booking['status']) => {
      const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
      setBookingsState(updated);

      if (configured) {
        await supabase
          .from('bookings')
          .update({ status })
          .eq('id', id);
      }
    },
    [bookings, configured]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!configured) return { error: new Error('Supabase is not configured') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error || undefined };
  }, [configured]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!configured) return { error: new Error('Supabase is not configured') };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error || undefined };
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    await supabase.auth.signOut();
  }, [configured]);

  const resetPassword = useCallback(async (email: string) => {
    if (!configured) return { error: new Error('Supabase is not configured') };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?reset_password=1`,
    });
    return { error: error || undefined };
  }, [configured]);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!configured) return { error: new Error('Supabase is not configured') };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error || undefined };
  }, [configured]);

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        authLoading,
        tyres,
        tyresLoading,
        tyresError,
        refreshTyres,
        cartItems,
        setCartItems,
        bookings,
        addBooking,
        cancelBooking,
        updateBookingStatus,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        stockManagementEnabled,
        setStockManagementEnabled,
        maintenanceMode,
        setMaintenanceMode,
        tyreDisplayFields,
        setTyreDisplayFields,
        settingsLoading,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return ctx;
}
