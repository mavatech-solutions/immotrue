-- market_prices is populated from ImmoTrue's own analyzed listings instead of
-- a paid/official feed (no free official source exists at city granularity
-- for finished-property sale prices — see project notes). This means it
-- starts empty and fills in as users analyze properties; cities need at
-- least 5 recent analyses before a value is trusted.

create unique index market_prices_city_zip_state_idx
  on market_prices (city, zip_prefix, state);

create or replace function refresh_market_prices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into market_prices (city, zip_prefix, state, avg_price_per_sqm, updated_at)
  select
    city,
    left(zip_code, 3) as zip_prefix,
    state,
    round(avg(price_per_sqm))::integer,
    now()
  from analyses
  where price_per_sqm is not null
    and city is not null
    and analyzed_at > now() - interval '2 years'
  group by city, left(zip_code, 3), state
  having count(*) >= 5
  on conflict (city, zip_prefix, state) do update
    set avg_price_per_sqm = excluded.avg_price_per_sqm,
        updated_at = excluded.updated_at;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'refresh-market-prices',
  '0 4 * * *',
  'select refresh_market_prices();'
);
