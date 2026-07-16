-- Run this SQL in the Supabase SQL Editor before using the app.
-- It creates the tables and policies the React app expects.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tyre inventory
CREATE TABLE IF NOT EXISTS public.tyres (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  width INT NOT NULL,
  profile INT NOT NULL,
  rim INT NOT NULL,
  speed_rating TEXT NOT NULL,
  load_index INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Summer', 'Winter', 'All-Season')),
  is_runflat BOOLEAN NOT NULL DEFAULT FALSE,
  is_reinforced BOOLEAN NOT NULL DEFAULT FALSE,
  fuel_efficiency TEXT NOT NULL CHECK (fuel_efficiency IN ('A', 'B', 'C', 'D', 'E')),
  wet_grip TEXT NOT NULL CHECK (wet_grip IN ('A', 'B', 'C', 'D', 'E')),
  noise_level INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  image_url TEXT,
  recommended_for TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings made by authenticated users
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  fitting_type TEXT NOT NULL CHECK (fitting_type IN ('shop', 'mobile', 'delivery')),
  vehicle_registration TEXT NOT NULL,
  vehicle_make_model TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  fitting_fee NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- Per-user cart persisted on the server
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read access for tyre catalog (anonymous shoppers can browse)
ALTER TABLE public.tyres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on tyres" ON public.tyres;
CREATE POLICY "Allow public read on tyres" ON public.tyres FOR SELECT USING (true);

-- Bookings are private to the owning user
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
CREATE POLICY "Users can manage own bookings" ON public.bookings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cart is private to the owning user
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
