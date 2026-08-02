-- Rename 'shop' fitting_type to 'fitting' in existing bookings
UPDATE public.bookings SET fitting_type = 'fitting' WHERE fitting_type = 'shop';

-- Update constraint to use 'fitting' instead of 'shop'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_fitting_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_fitting_type_check
  CHECK (fitting_type IN ('fitting', 'mobile', 'delivery', 'collection'));
