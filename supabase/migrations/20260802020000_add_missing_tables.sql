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

-- RLS for settings (public read, public write — admin config is client-side gated)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read settings" ON public.settings;
CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can write settings" ON public.settings;
CREATE POLICY "Public can write settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- RLS for contact_messages (public can insert, public can read/update for admin)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
CREATE POLICY "Public can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can read contact messages" ON public.contact_messages;
CREATE POLICY "Public can read contact messages" ON public.contact_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can update contact messages" ON public.contact_messages;
CREATE POLICY "Public can update contact messages" ON public.contact_messages FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete contact messages" ON public.contact_messages;
CREATE POLICY "Public can delete contact messages" ON public.contact_messages FOR DELETE USING (true);

-- Add DELETE policy for bookings (admin can delete bookings)
DROP POLICY IF EXISTS "Anyone can delete bookings" ON public.bookings;
CREATE POLICY "Anyone can delete bookings" ON public.bookings FOR DELETE USING (true);
