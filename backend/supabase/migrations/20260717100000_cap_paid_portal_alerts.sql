-- Cost guardrail: ImmoScout24 + Immowelt alert-matching runs through paid
-- Apify actors (check-alerts), unlike the other 3 portals which are free
-- custom scrapers. A Premium user at the 5-active-alert cap with all 5
-- using both paid portals would cost more per month in alert-matching
-- alone than the ~5-6€ subscription brings in. Capping active alerts with
-- a paid portal to 2 per user bounds that worst case regardless of usage.
--
-- Enforced as a trigger (not just frontend validation) since alerts are
-- inserted/updated directly from the browser via Supabase, bypassing any
-- app-layer check a determined user could route around via the REST API.
create or replace function enforce_paid_portal_alert_limit()
returns trigger as $$
declare
  paid_count integer;
begin
  if new.active and (new.portals && array['immoscout', 'immowelt']) then
    select count(*) into paid_count
    from alerts
    where user_id = new.user_id
      and active = true
      and portals && array['immoscout', 'immowelt']
      and id != new.id;

    if paid_count >= 2 then
      raise exception 'max_paid_portal_alerts_exceeded'
        using errcode = 'P0001',
              detail = 'A user can have at most 2 active alerts using ImmoScout24 or Immowelt.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_paid_portal_alert_limit
  before insert or update on alerts
  for each row execute function enforce_paid_portal_alert_limit();
