-- profiles: one row per auth user, holds subscription + rate-limit state
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  premium_until timestamptz,
  user_type text check (user_type in ('buyer', 'investor', 'both')),
  analyses_this_month integer not null default 0,
  last_month_reset timestamptz not null default now(),
  push_token text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- market_prices: static reference data (Destatis), public read-only
create table market_prices (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  zip_prefix text,
  state text,
  avg_price_per_sqm integer,
  rental_avg_per_sqm integer,
  updated_at timestamptz not null default now()
);

alter table market_prices enable row level security;

create policy "Anyone can read market prices"
  on market_prices for select
  using (true);

-- sync_logs: internal cron/job diagnostics, no public access (service role only)
create table sync_logs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null,
  rows_processed integer,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

alter table sync_logs enable row level security;
