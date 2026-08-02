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
  speed_rating TEXT,
  load_index INT,
  price NUMERIC(10,2) NOT NULL,
  price_x4 NUMERIC(10,2),
  category TEXT NOT NULL CHECK (category IN ('Standard', 'Runflat', 'Commercial')),
  is_runflat BOOLEAN NOT NULL DEFAULT FALSE,
  is_reinforced BOOLEAN NOT NULL DEFAULT FALSE,
  fuel_efficiency TEXT CHECK (fuel_efficiency IN ('A', 'B', 'C', 'D', 'E')),
  wet_grip TEXT CHECK (wet_grip IN ('A', 'B', 'C', 'D', 'E')),
  noise_level INT,
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
  fitting_type TEXT NOT NULL CHECK (fitting_type IN ('fitting', 'mobile', 'delivery', 'collection')),
  vehicle_registration TEXT NOT NULL,
  vehicle_make_model TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  fitting_fee NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  admin_note TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- Settings table (key-value store for app configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL DEFAULT 'General Enquiry',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  discount INT NOT NULL,
  expiry TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-user cart persisted on the server
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tyres: public read, public CRUD (admin manages inventory client-side)
ALTER TABLE public.tyres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on tyres" ON public.tyres;
CREATE POLICY "Allow public read on tyres" ON public.tyres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update on tyres" ON public.tyres;
CREATE POLICY "Allow public update on tyres" ON public.tyres FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert on tyres" ON public.tyres;
CREATE POLICY "Allow public insert on tyres" ON public.tyres FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on tyres" ON public.tyres;
CREATE POLICY "Allow public delete on tyres" ON public.tyres FOR DELETE USING (true);

-- Bookings: public read/insert/update/delete (checkout creates bookings without auth, admin manages)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read all bookings" ON public.bookings;
CREATE POLICY "Public can read all bookings" ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
CREATE POLICY "Anyone can update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete bookings" ON public.bookings;
CREATE POLICY "Anyone can delete bookings" ON public.bookings FOR DELETE USING (true);

-- Cart: private to owning user (explicit per-operation policies)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can read own cart" ON public.cart_items;
CREATE POLICY "Users can read own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own cart" ON public.cart_items;
CREATE POLICY "Users can insert own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own cart" ON public.cart_items;
CREATE POLICY "Users can update own cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own cart" ON public.cart_items;
CREATE POLICY "Users can delete own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Settings: public read and write (admin config is client-side gated)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read settings" ON public.settings;
CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can write settings" ON public.settings;
CREATE POLICY "Public can write settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Contact messages: public can insert, admin can read/update/delete
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
CREATE POLICY "Public can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can read contact messages" ON public.contact_messages;
CREATE POLICY "Public can read contact messages" ON public.contact_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can update contact messages" ON public.contact_messages;
CREATE POLICY "Public can update contact messages" ON public.contact_messages FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete contact messages" ON public.contact_messages;
CREATE POLICY "Public can delete contact messages" ON public.contact_messages FOR DELETE USING (true);

-- Promo codes: public read (checkout validates), public CRUD (admin manages)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read promo codes" ON public.promo_codes;
CREATE POLICY "Public can read promo codes" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage promo codes" ON public.promo_codes;
CREATE POLICY "Anyone can manage promo codes" ON public.promo_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Staff: public read, public CRUD (admin manages)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read staff" ON public.staff;
CREATE POLICY "Public can read staff" ON public.staff FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage staff" ON public.staff;
CREATE POLICY "Anyone can manage staff" ON public.staff
  FOR ALL USING (true) WITH CHECK (true);
