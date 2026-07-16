-- Opt-in flag for the (Premium-only) price alert cron job. Defaults to true
-- so existing analyses keep working as before; the create-analysis flow
-- (Schritt 23) will expose this as a pre-checked checkbox the user can
-- untick, matching the plan.
alter table analyses
  add column price_alert_enabled boolean not null default true;
