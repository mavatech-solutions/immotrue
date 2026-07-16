-- Daily at 5:00 UTC (~6:00 Europe/Berlin winter time). pg_cron doesn't do
-- IANA timezones, so this drifts to ~7:00 Berlin during summer DST — a
-- 1-hour shift twice a year is fine for a nightly batch job, not worth the
-- complexity of a DST-aware schedule.
select cron.schedule(
  'check-price-changes-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url := 'https://hxunhpcdinymwhmkhxyt.supabase.co/functions/v1/check-price-changes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dW5ocGNkaW55bXdobWtoeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTY2MDUsImV4cCI6MjA5OTY5MjYwNX0.7UNSYcArFBxVMz4OUKr91NhjP8B9XGhUoIt2UdqoH1s"}'::jsonb
  );
  $$
);
