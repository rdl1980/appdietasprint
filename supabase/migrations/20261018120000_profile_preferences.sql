-- Persist planner preferences that previously lived only inside the plan JSON:
-- structured allergies, cooking time and medical screening flags.

alter table public.user_profiles
  add column if not exists medical_flags text[] not null default '{}',
  add column if not exists allergy_flags text[] not null default '{}',
  add column if not exists cooking_time text not null default 'standard';

alter table public.user_profiles
  drop constraint if exists user_profiles_cooking_time_check;

alter table public.user_profiles
  add constraint user_profiles_cooking_time_check
  check (cooking_time in ('ready', 'quick', 'standard', 'batch'));

-- Users may update their own meal plans (used by future "rename/notes" features)
-- and delete their own profiles (self-service cleanup).
drop policy if exists "Users can delete own profiles" on public.user_profiles;
create policy "Users can delete own profiles"
  on public.user_profiles for delete
  using (auth.uid() = user_id);
