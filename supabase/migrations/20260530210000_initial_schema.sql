-- Diet Sprint AI MVP schema.
-- Safe to apply to an empty database or reapply to the current MVP database.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sex text not null check (sex in ('male', 'female')),
  age integer not null check (age >= 18 and age <= 100),
  height_cm integer not null check (height_cm >= 120 and height_cm <= 230),
  weight_kg numeric(5,2) not null check (weight_kg >= 35 and weight_kg <= 250),
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  goal text not null check (goal in ('mild', 'standard', 'aggressive', 'maintain')),
  diet_type text not null check (diet_type in ('ketogenic', 'mediterranean', 'lowCarb', 'balanced', 'vegetarian')),
  target_calories integer,
  meals_per_day integer not null check (meals_per_day between 2 and 5),
  excluded_foods text[] not null default '{}',
  simplicity_level text not null check (simplicity_level in ('zeroSbatti', 'standard', 'mealPrep')),
  budget_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.user_profiles(id) on delete set null,
  daily_calories integer not null,
  plan jsonb not null,
  grocery_list jsonb not null default '[]'::jsonb,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document text not null check (document in ('privacy', 'terms', 'disclaimer', 'marketing')),
  version text not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  request_type text not null check (request_type in ('access', 'rectification', 'export', 'erasure', 'objection')),
  status text not null default 'open' check (status in ('open', 'in_review', 'completed', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

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

create table if not exists public.data_subject_request_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.data_subject_requests(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  previous_status text,
  next_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_meal_templates (
  id text primary key,
  name text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  diet_types text[] not null default '{}',
  ingredients jsonb not null default '[]'::jsonb,
  calories integer not null check (calories > 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fats integer not null default 0 check (fats >= 0),
  tags text[] not null default '{}',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.data_subject_requests enable row level security;
alter table public.stripe_purchases enable row level security;
alter table public.data_subject_request_audit_events enable row level security;
alter table public.admin_meal_templates enable row level security;

drop policy if exists "Users can read own profiles" on public.user_profiles;
create policy "Users can read own profiles"
  on public.user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profiles" on public.user_profiles;
create policy "Users can insert own profiles"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profiles" on public.user_profiles;
create policy "Users can update own profiles"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own meal plans" on public.meal_plans;
create policy "Users can read own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal plans" on public.meal_plans;
create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meal plans" on public.meal_plans;
create policy "Users can delete own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own consents" on public.privacy_consents;
create policy "Users can read own consents"
  on public.privacy_consents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own consents" on public.privacy_consents;
create policy "Users can insert own consents"
  on public.privacy_consents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own privacy requests" on public.data_subject_requests;
create policy "Users can read own privacy requests"
  on public.data_subject_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own privacy requests" on public.data_subject_requests;
create policy "Users can insert own privacy requests"
  on public.data_subject_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own Stripe purchases" on public.stripe_purchases;
create policy "Users can read own Stripe purchases"
  on public.stripe_purchases for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read privacy audit events" on public.data_subject_request_audit_events;
create policy "Admins can read privacy audit events"
  on public.data_subject_request_audit_events for select
  using (
    exists (
      select 1
      from auth.users users
      where users.id = auth.uid()
        and (
          users.raw_app_meta_data->>'role' = 'admin'
          or users.raw_app_meta_data->>'username' = 'rdladmin'
        )
    )
  );

drop policy if exists "Admins can read meal templates" on public.admin_meal_templates;
create policy "Admins can read meal templates"
  on public.admin_meal_templates for select
  using (
    exists (
      select 1
      from auth.users users
      where users.id = auth.uid()
        and (
          users.raw_app_meta_data->>'role' = 'admin'
          or users.raw_app_meta_data->>'username' = 'rdladmin'
        )
    )
  );

create index if not exists user_profiles_user_id_created_at_idx
  on public.user_profiles(user_id, created_at desc);

create index if not exists meal_plans_user_id_created_at_idx
  on public.meal_plans(user_id, created_at desc);

create index if not exists privacy_consents_user_id_accepted_at_idx
  on public.privacy_consents(user_id, accepted_at desc);

create index if not exists data_subject_requests_user_id_created_at_idx
  on public.data_subject_requests(user_id, created_at desc);

create index if not exists stripe_purchases_user_id_created_at_idx
  on public.stripe_purchases(user_id, created_at desc);

create index if not exists stripe_purchases_customer_id_idx
  on public.stripe_purchases(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists data_subject_request_audit_events_request_id_created_at_idx
  on public.data_subject_request_audit_events(request_id, created_at desc);

create index if not exists admin_meal_templates_active_meal_type_idx
  on public.admin_meal_templates(active, meal_type);
