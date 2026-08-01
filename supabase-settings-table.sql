-- Settings table for app-wide configuration
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.settings enable row level security;

-- Allow anyone to read settings (needed for stock management flag on frontend)
create policy "Settings are readable by everyone"
  on public.settings for select
  using (true);

-- Allow anyone to insert/update settings (admin panel uses anon key)
create policy "Settings are writable by everyone"
  on public.settings for insert
  with check (true);

create policy "Settings are updatable by everyone"
  on public.settings for update
  using (true);

-- Insert default setting: stock management disabled (unlimited stock)
insert into public.settings (key, value)
values ('stock_management_enabled', 'false')
on conflict (key) do nothing;
