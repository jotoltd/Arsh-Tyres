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

-- Add notes column to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_note TEXT DEFAULT '';

-- Drop the restrictive fitting_type constraint and allow 'collection'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_fitting_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_fitting_type_check
  CHECK (fitting_type IN ('shop', 'mobile', 'delivery', 'collection'));

-- Allow public read on promo codes (so checkout can validate them)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read promo codes" ON public.promo_codes;
CREATE POLICY "Public can read promo codes" ON public.promo_codes FOR SELECT USING (true);

-- Allow public read on staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read staff" ON public.staff;
CREATE POLICY "Public can read staff" ON public.staff FOR SELECT USING (true);

-- Allow public read on bookings (so admin can see all bookings without auth)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read all bookings" ON public.bookings;
CREATE POLICY "Public can read all bookings" ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;

-- Allow public to insert/update bookings (checkout creates bookings without auth)
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
CREATE POLICY "Anyone can update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

-- Allow public to update tyres (admin inventory management)
DROP POLICY IF EXISTS "Allow public read on tyres" ON public.tyres;
CREATE POLICY "Allow public read on tyres" ON public.tyres FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public update on tyres" ON public.tyres;
CREATE POLICY "Allow public update on tyres" ON public.tyres FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert on tyres" ON public.tyres;
CREATE POLICY "Allow public insert on tyres" ON public.tyres FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on tyres" ON public.tyres;
CREATE POLICY "Allow public delete on tyres" ON public.tyres FOR DELETE USING (true);

-- Allow public CRUD on promo codes (admin management)
DROP POLICY IF EXISTS "Anyone can manage promo codes" ON public.promo_codes;
CREATE POLICY "Anyone can manage promo codes" ON public.promo_codes
  FOR ALL USING (true) WITH CHECK (true);

-- Allow public CRUD on staff (admin management)
DROP POLICY IF EXISTS "Anyone can manage staff" ON public.staff;
CREATE POLICY "Anyone can manage staff" ON public.staff
  FOR ALL USING (true) WITH CHECK (true);

-- Seed default staff
INSERT INTO public.staff (id, name, role, email, phone) VALUES
  ('1', 'John Smith', 'Senior Fitter', 'john@arshautos.co.uk', '07700 900000'),
  ('2', 'Sarah Jones', 'Manager', 'sarah@arshautos.co.uk', '07700 900001')
ON CONFLICT (id) DO NOTHING;

-- Seed default promo codes
INSERT INTO public.promo_codes (code, discount, expiry, active) VALUES
  ('WELCOME10', 10, '2026-12-31', true),
  ('SUMMER20', 20, '2026-08-31', true)
ON CONFLICT (code) DO NOTHING;
