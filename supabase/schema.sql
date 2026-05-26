-- DietaSprint AI production foundation
-- Run this in the Supabase SQL editor after creating the project.

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

alter table public.user_profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.data_subject_requests enable row level security;

create policy "Users can read own profiles"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profiles"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profiles"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

create policy "Users can read own consents"
  on public.privacy_consents for select
  using (auth.uid() = user_id);

create policy "Users can insert own consents"
  on public.privacy_consents for insert
  with check (auth.uid() = user_id);

create policy "Users can read own privacy requests"
  on public.data_subject_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own privacy requests"
  on public.data_subject_requests for insert
  with check (auth.uid() = user_id);

create index if not exists user_profiles_user_id_created_at_idx
  on public.user_profiles(user_id, created_at desc);

create index if not exists meal_plans_user_id_created_at_idx
  on public.meal_plans(user_id, created_at desc);

create index if not exists privacy_consents_user_id_accepted_at_idx
  on public.privacy_consents(user_id, accepted_at desc);

create index if not exists data_subject_requests_user_id_created_at_idx
  on public.data_subject_requests(user_id, created_at desc);
