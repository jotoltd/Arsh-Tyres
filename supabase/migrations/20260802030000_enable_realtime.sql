-- Enable real-time for bookings and tyres tables
-- So the client app gets live updates when rows change
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tyres;
