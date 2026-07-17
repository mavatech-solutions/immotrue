-- Auto-creates a profiles row whenever a new auth.users row appears —
-- covers email/password signup and any future OAuth provider the same
-- way, rather than relying on client code to remember to insert one.
-- user_type comes from the signup call's options.data (raw_user_meta_data);
-- falls back to null (allowed by the profiles.user_type check constraint).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, user_type)
  values (new.id, new.email, new.raw_user_meta_data ->> 'user_type');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
