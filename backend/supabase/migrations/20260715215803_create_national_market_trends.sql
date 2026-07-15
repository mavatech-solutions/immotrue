-- National house-price growth rates (Destatis Häuserpreisindex, quarterly).
-- Single row, refreshed daily by sync-house-price-index — Destatis only
-- publishes this at national level, no per-city breakdown exists, so
-- fetch-market applies the same growth rate to every city.
create table national_market_trends (
  id uuid primary key default gen_random_uuid(),
  house_price_index numeric not null,
  reference_quarter text not null,
  price_growth_last_year numeric,
  price_growth_5_years numeric,
  updated_at timestamptz not null default now()
);

alter table national_market_trends enable row level security;

create policy "Anyone can read national market trends"
  on national_market_trends for select
  using (true);
