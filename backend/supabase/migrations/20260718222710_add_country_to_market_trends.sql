-- national_market_trends was Germany-only (implicit) until now. Existing
-- rows default to 'DE', which is correct — they're all Destatis data.
alter table national_market_trends
  add column country text not null default 'DE' check (country in ('DE', 'AT', 'CH'));
