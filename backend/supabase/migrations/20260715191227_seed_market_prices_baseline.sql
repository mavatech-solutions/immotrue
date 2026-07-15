-- Track where a market_prices row came from, so the self-updating cron
-- (Schritt 8) only ever overwrites manually-researched seed rows once real
-- usage data exists for that city, never the other way around.
alter table market_prices
  add column source text not null default 'seed'
    check (source in ('seed', 'user_generated'));

create or replace function refresh_market_prices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into market_prices (city, zip_prefix, state, avg_price_per_sqm, source, updated_at)
  select
    city,
    left(zip_code, 3) as zip_prefix,
    state,
    round(avg(price_per_sqm))::integer,
    'user_generated',
    now()
  from analyses
  where price_per_sqm is not null
    and city is not null
    and analyzed_at > now() - interval '2 years'
  group by city, left(zip_code, 3), state
  having count(*) >= 5
  on conflict (city, zip_prefix, state) do update
    set avg_price_per_sqm = excluded.avg_price_per_sqm,
        source = 'user_generated',
        updated_at = excluded.updated_at;
end;
$$;

-- Manually researched baseline (no free official per-city API exists — see
-- Schritt 8 notes). Sources, one snapshot each, re-check periodically:
--   Deutschland, Berlin, Hamburg, München, Köln, Stuttgart, Leipzig:
--     ImmoScout24 WohnBarometer Q4 2025 (published ~Jan 2026),
--     https://www.immobilienscout24.de/unternehmen/news-medien/news/default-title/kaufpreise-steigen-so-stark-wie-seit-jahren-nicht-mehr/
--   Wien: metrox.io city price guide, 2026,
--     https://www.metrox.io/de/news/was-kostet-eine-wohnung-in-wien-2026
-- Schweiz (homegate.ch) deliberately excluded: prices there are quoted in
-- CHF and neither `analyses` nor `market_prices` has a currency column yet,
-- so a CHF figure here would silently be compared as if it were EUR.
-- Needs a currency column before Zürich/CH cities can be seeded safely.
insert into market_prices (city, state, avg_price_per_sqm, source, updated_at) values
  ('Deutschland', null, 2574, 'seed', now()),
  ('Berlin', 'Berlin', 4884, 'seed', now()),
  ('Hamburg', 'Hamburg', 5283, 'seed', now()),
  ('München', 'Bayern', 8266, 'seed', now()),
  ('Köln', 'Nordrhein-Westfalen', 4340, 'seed', now()),
  ('Stuttgart', 'Baden-Württemberg', 5008, 'seed', now()),
  ('Leipzig', 'Sachsen', 2992, 'seed', now()),
  ('Wien', 'Wien', 6597, 'seed', now())
on conflict (city, zip_prefix, state) do nothing;
