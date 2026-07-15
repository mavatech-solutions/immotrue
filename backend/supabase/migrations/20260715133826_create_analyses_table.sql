-- analyses: the core table. Stores only our own analysis + public facts,
-- never portal photos/listing text (copyright).
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,

  -- Portal info
  original_url text not null,
  portal text,

  -- Public facts (no copyright)
  price integer,
  price_per_sqm integer,
  size_sqm integer,
  rooms numeric,
  address text,
  district text,
  city text,
  state text,
  zip_code text,
  year_built integer,
  energy_class text,
  floor integer,
  days_on_market integer,
  is_private_seller boolean,

  -- Price tracking
  original_price integer,
  current_price integer,
  price_change_percent numeric,
  last_price_check timestamptz,

  -- Our AI analysis (our own content)
  price_verdict text check (price_verdict in ('cheap', 'fair', 'expensive', 'overpriced')),
  price_deviation numeric,
  suggested_offer_price integer,
  ai_summary text,
  ai_full_report text,
  ai_recommendation text,
  ai_negotiation_tip text,
  ai_risks jsonb,
  ai_pros jsonb,
  ai_cons jsonb,
  ai_forecast_10y text,
  ai_forecast_value_10y integer,

  -- Derived metrics
  gross_yield numeric,
  location_score numeric,
  location_details jsonb,
  purchase_costs_total integer,
  purchase_costs_breakdown jsonb,
  estimated_rent integer,
  negotiation_potential text,

  -- Portfolio status
  status text not null default 'interesting'
    check (status in ('interesting', 'favorite', 'viewed', 'rejected')),
  user_notes text,
  viewed_date date,
  viewing_rating integer,
  viewing_pros jsonb,
  viewing_cons jsonb,

  -- Timestamps
  analyzed_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now()
);

create index analyses_user_id_idx on analyses(user_id);
create index analyses_user_id_status_idx on analyses(user_id, status);
create index analyses_user_id_analyzed_at_idx on analyses(user_id, analyzed_at desc);

alter table analyses enable row level security;

create policy "Users can view own analyses"
  on analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on analyses for update
  using (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on analyses for delete
  using (auth.uid() = user_id);
