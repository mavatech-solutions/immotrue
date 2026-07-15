-- alerts: "Wunschalarm" — user-defined search criteria for new listings
create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  city text,
  radius_km integer,
  max_price integer,
  min_rooms numeric,
  property_type text,
  portals text[],
  notification_frequency text check (notification_frequency in ('immediate', 'daily')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table alerts enable row level security;

create policy "Users can view own alerts"
  on alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on alerts for delete
  using (auth.uid() = user_id);

-- alerted_listings: dedupe log so the same listing isn't reported twice per alert
create table alerted_listings (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references alerts(id) on delete cascade,
  listing_url text not null,
  alerted_at timestamptz not null default now()
);

alter table alerted_listings enable row level security;

create policy "Users can view own alerted listings"
  on alerted_listings for select
  using (
    exists (
      select 1 from alerts
      where alerts.id = alerted_listings.alert_id
      and alerts.user_id = auth.uid()
    )
  );

-- price_changes: history of every detected price change on a saved analysis
create table price_changes (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references analyses(id) on delete cascade,
  old_price integer,
  new_price integer,
  change_percent numeric,
  detected_at timestamptz not null default now()
);

alter table price_changes enable row level security;

create policy "Users can view own price changes"
  on price_changes for select
  using (
    exists (
      select 1 from analyses
      where analyses.id = price_changes.analysis_id
      and analyses.user_id = auth.uid()
    )
  );

-- comparisons: side-by-side comparison of two saved analyses
create table comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  analysis_1_id uuid references analyses(id) on delete cascade,
  analysis_2_id uuid references analyses(id) on delete cascade,
  ai_recommendation text,
  created_at timestamptz not null default now()
);

alter table comparisons enable row level security;

create policy "Users can view own comparisons"
  on comparisons for select
  using (auth.uid() = user_id);

create policy "Users can insert own comparisons"
  on comparisons for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comparisons"
  on comparisons for delete
  using (auth.uid() = user_id);

-- analytics_events: product analytics, including pre-signup/anonymous events
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null,
  properties jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create policy "Anyone can insert analytics events"
  on analytics_events for insert
  with check (true);
