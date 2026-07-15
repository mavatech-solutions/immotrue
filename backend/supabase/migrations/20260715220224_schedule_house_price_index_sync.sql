create extension if not exists pg_net;

-- The anon key is public by design (shipped in every client app already),
-- safe to embed here — it's the standard way to trigger an Edge Function
-- from pg_cron without storing a real secret in a migration file.
select cron.schedule(
  'sync-house-price-index-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url := 'https://hxunhpcdinymwhmkhxyt.supabase.co/functions/v1/sync-house-price-index',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dW5ocGNkaW55bXdobWtoeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTY2MDUsImV4cCI6MjA5OTY5MjYwNX0.7UNSYcArFBxVMz4OUKr91NhjP8B9XGhUoIt2UdqoH1s"}'::jsonb
  );
  $$
);
