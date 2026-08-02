-- Make cart RLS policies explicit per-operation
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop the catch-all policy
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;

-- Explicit per-operation policies
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
