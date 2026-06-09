create table if not exists public.stripe_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_price_id text not null,
  amount_total integer,
  currency text,
  status text not null default 'paid' check (status in ('paid', 'open', 'expired', 'refunded', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_purchases enable row level security;

drop policy if exists "Users can read own Stripe purchases" on public.stripe_purchases;
create policy "Users can read own Stripe purchases"
  on public.stripe_purchases for select
  using (auth.uid() = user_id);

create index if not exists stripe_purchases_user_id_created_at_idx
  on public.stripe_purchases(user_id, created_at desc);

create index if not exists stripe_purchases_customer_id_idx
  on public.stripe_purchases(stripe_customer_id)
  where stripe_customer_id is not null;
