-- Same daily cadence as sync-house-price-index — SNB publishes quarterly,
-- so daily polling just means we pick up a new quarter within a day of
-- publication, not that anything changes on most days.
select cron.schedule(
  'sync-swiss-price-index-daily',
  '10 5 * * *',
  $$
  select net.http_post(
    url := 'https://hxunhpcdinymwhmkhxyt.supabase.co/functions/v1/sync-swiss-price-index',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dW5ocGNkaW55bXdobWtoeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTY2MDUsImV4cCI6MjA5OTY5MjYwNX0.7UNSYcArFBxVMz4OUKr91NhjP8B9XGhUoIt2UdqoH1s"}'::jsonb
  );
  $$
);
