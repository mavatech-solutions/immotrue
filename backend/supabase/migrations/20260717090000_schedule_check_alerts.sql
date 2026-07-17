-- Twice daily at 7:00 + 17:00 UTC (~8:00 + 18:00 Europe/Berlin winter time,
-- drifting to ~9:00/19:00 in summer DST — same acceptable drift as the
-- check-price-changes job, see that migration's comment).
--
-- Running 2x/day instead of 1x costs effectively nothing extra: the paid
-- portals (ImmoScout24, Immowelt) both run in monitor/incremental mode, so
-- a repeat run only returns (and is billed for) listings that are new since
-- the *previous* run — splitting a day's new listings across two runs
-- rather than one doesn't roughly double the bill, it just delivers
-- "Sofort" alerts faster.
select cron.schedule(
  'check-alerts-twice-daily',
  '0 7,17 * * *',
  $$
  select net.http_post(
    url := 'https://hxunhpcdinymwhmkhxyt.supabase.co/functions/v1/check-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dW5ocGNkaW55bXdobWtoeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTY2MDUsImV4cCI6MjA5OTY5MjYwNX0.7UNSYcArFBxVMz4OUKr91NhjP8B9XGhUoIt2UdqoH1s"}'::jsonb
  );
  $$
);
