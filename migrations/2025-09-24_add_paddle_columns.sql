alter table public.user_profiles
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists price_id text,
  add column if not exists status text;


