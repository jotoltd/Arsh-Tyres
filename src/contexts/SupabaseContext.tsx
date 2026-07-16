import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TYRE_DATABASE } from '../data';
import { Tyre, CartItem, Booking } from '../types';

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  authLoading: boolean;
  tyres: Tyre[];
  tyresLoading: boolean;
  tyresError: string | null;
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  bookings: Booking[];
  addBooking: (draft: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
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
    category: raw.category,
    isRunflat: raw.isRunflat ?? raw.is_runflat,
    isReinforced: raw.isReinforced ?? raw.is_reinforced,
    fuelEfficiency: camel ? raw.fuelEfficiency : raw.fuel_efficiency,
    wetGrip: camel ? raw.wetGrip : raw.wet_grip,
    noiseLevel: camel ? raw.noiseLevel : raw.noise_level,
    stock: raw.stock,
    rating: Number(raw.rating),
    reviewsCount: raw.reviewsCount ?? raw.reviews_count,
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
const BOOKINGS_KEY = 'arsh_autos_bookings';

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tyres, setTyres] = useState<Tyre[]>(TYRE_DATABASE);
  const [tyresLoading, setTyresLoading] = useState(false);
  const [tyresError, setTyresError] = useState<string | null>(null);
  const [cartItems, setCartItemsState] = useState<CartItem[]>([]);
  const [bookings, setBookingsState] = useState<Booking[]>([]);

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

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCartItemsState(JSON.parse(saved));
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

  // Load bookings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKINGS_KEY);
      if (saved) setBookingsState(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load bookings from Supabase when signed in
  useEffect(() => {
    if (!configured || !user) return;

    let mounted = true;
    supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
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
  }, [configured, user]);

  const persistBookings = useCallback((list: Booking[]) => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }, []);

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
      persistBookings(updated);

      if (configured && user) {
        const { error } = await supabase.from('bookings').insert({
          id: newBooking.id,
          user_id: user.id,
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
    [bookings, configured, user, persistBookings]
  );

  const cancelBooking = useCallback(
    async (id: string) => {
      const updated = bookings.map((b) => (b.id === id ? { ...b, status: 'Cancelled' as const } : b));
      setBookingsState(updated);
      persistBookings(updated);

      if (configured && user) {
        await supabase
          .from('bookings')
          .update({ status: 'Cancelled' })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [bookings, configured, user, persistBookings]
  );

  const updateBookingStatus = useCallback(
    async (id: string, status: Booking['status']) => {
      const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
      setBookingsState(updated);
      persistBookings(updated);

      if (configured && user) {
        await supabase
          .from('bookings')
          .update({ status })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    },
    [bookings, configured, user, persistBookings]
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

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        authLoading,
        tyres,
        tyresLoading,
        tyresError,
        cartItems,
        setCartItems,
        bookings,
        addBooking,
        cancelBooking,
        updateBookingStatus,
        signIn,
        signUp,
        signOut,
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
