alter table profiles add column stripe_customer_id text;
alter table profiles add column stripe_subscription_id text;

create unique index profiles_stripe_customer_id_idx on profiles (stripe_customer_id) where stripe_customer_id is not null;
