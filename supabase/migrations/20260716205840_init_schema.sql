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
INSERT INTO public.tyres (id, brand, model, width, profile, rim, speed_rating, load_index, price, category, is_runflat, is_reinforced, fuel_efficiency, wet_grip, noise_level, stock, rating, reviews_count, image_url, recommended_for) VALUES
('michelin-ps5', 'Michelin', 'Pilot Sport 5', 225, 45, 17, 'Y', 94, 119.5, 'Summer', false, true, 'C', 'A', 72, 16, 4.8, 312, 'https://images.unsplash.com/photo-1728522298320-e4ef6a76bbcd?auto=format&fit=crop&w=600&q=80', 'Sporty sedans, BMW 3 Series, Audi A4, Volkswagen Golf GTI'),
('continental-sc7', 'Continental', 'SportContact 7', 235, 40, 19, 'Y', 96, 154, 'Summer', false, true, 'C', 'A', 72, 8, 4.9, 145, 'https://images.unsplash.com/photo-1699325490806-902b139a6682?auto=format&fit=crop&w=600&q=80', 'High-performance sports cars, Mercedes-AMG C43, Audi S5'),
('pirelli-pzero-pz4', 'Pirelli', 'P Zero (PZ4)', 245, 35, 20, 'Y', 95, 189.99, 'Summer', true, true, 'D', 'A', 73, 12, 4.7, 88, 'https://images.unsplash.com/photo-1760111537896-05ef8f0f347f?auto=format&fit=crop&w=600&q=80', 'Supercars and premium luxury vehicles, Porsche 911, Tesla Model S'),
('goodyear-f1-asym6', 'Goodyear', 'Eagle F1 Asymmetric 6', 225, 40, 18, 'Y', 92, 108.5, 'Summer', false, false, 'C', 'A', 70, 24, 4.8, 192, 'https://images.unsplash.com/photo-1756664825124-15a086629185?auto=format&fit=crop&w=600&q=80', 'Hot hatches, Ford Focus ST, Honda Civic Type R, BMW 1 Series'),
('michelin-cc2', 'Michelin', 'CrossClimate 2', 205, 55, 16, 'V', 91, 98.75, 'All-Season', false, false, 'B', 'B', 71, 32, 4.9, 540, 'https://images.unsplash.com/photo-1751601397743-fed8bbfd2965?auto=format&fit=crop&w=600&q=80', 'Family hatchbacks and saloons, Ford Focus, Toyota Corolla, Volkswagen Golf'),
('continental-ascon6', 'Continental', 'AllSeasonContact 2', 215, 55, 17, 'V', 98, 114.2, 'All-Season', false, true, 'B', 'B', 71, 18, 4.6, 74, 'https://images.unsplash.com/photo-1708216877383-b879d34de7e2?auto=format&fit=crop&w=600&q=80', 'SUVs and mid-size crossovers, Nissan Qashqai, Kia Sportage, Hyundai Tucson'),
('bridgestone-t005', 'Bridgestone', 'Turanza T005', 205, 55, 16, 'H', 91, 84.99, 'Summer', false, false, 'A', 'A', 71, 40, 4.5, 204, 'https://images.unsplash.com/photo-1753183700294-a2dbeb81e168?auto=format&fit=crop&w=600&q=80', 'Daily commuters, Skoda Octavia, Vauxhall Astra, Honda Civic'),
('pirelli-sottozero3', 'Pirelli', 'Winter Sottozero 3', 225, 45, 17, 'V', 94, 128, 'Winter', false, true, 'D', 'B', 72, 10, 4.7, 112, 'https://images.unsplash.com/photo-1752959807356-a4f7628f74a6?auto=format&fit=crop&w=600&q=80', 'Cold climates and alpine roads, Audi A4 Quattro, BMW xDrive models'),
('michelin-alpin6', 'Michelin', 'Alpin 6', 195, 65, 15, 'H', 91, 89.5, 'Winter', false, false, 'C', 'B', 69, 14, 4.8, 95, 'https://images.unsplash.com/photo-1761846788508-ed4beafeb64a?auto=format&fit=crop&w=600&q=80', 'Compact cars in winter regions, Volkswagen Polo, Ford Fiesta, Renault Clio'),
('hankook-ventus-s1', 'Hankook', 'Ventus S1 Evo 3', 225, 40, 18, 'Y', 92, 86.5, 'Summer', false, true, 'C', 'A', 71, 28, 4.4, 153, 'https://images.unsplash.com/photo-1668457248687-4cd393be920b?auto=format&fit=crop&w=600&q=80', 'Executive saloons and sporty hatchbacks, Mercedes C-Class, Tesla Model 3'),
('yokohama-bluearth', 'Yokohama', 'BluEarth-GT AE51', 195, 60, 15, 'V', 88, 69.95, 'Summer', false, false, 'B', 'A', 68, 20, 4.3, 64, 'https://images.unsplash.com/photo-1699325490806-902b139a6682?auto=format&fit=crop&w=600&q=80', 'Eco cars and fuel-conscious drivers, Toyota Yaris, Nissan Micra'),
('dunlop-sport-maxx', 'Dunlop', 'Sport Maxx RT2', 225, 45, 18, 'Y', 95, 97.2, 'Summer', false, true, 'C', 'A', 69, 16, 4.5, 122, 'https://images.unsplash.com/photo-1728522298320-e4ef6a76bbcd?auto=format&fit=crop&w=600&q=80', 'Enthusiast performance drivers, Subaru WRX, Volkswagen Golf R');

