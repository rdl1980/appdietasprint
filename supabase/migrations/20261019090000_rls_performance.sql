-- Performance advisor fixes applied to the DietSprintAI project on 2026-10-19:
-- auth.uid() wrapped in a subselect (evaluated once per query) and covering
-- indexes for the foreign keys without one.

drop policy if exists "Users can read own profiles" on public.user_profiles;
create policy "Users can read own profiles" on public.user_profiles for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own profiles" on public.user_profiles;
create policy "Users can insert own profiles" on public.user_profiles for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own profiles" on public.user_profiles;
create policy "Users can update own profiles" on public.user_profiles for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own profiles" on public.user_profiles;
create policy "Users can delete own profiles" on public.user_profiles for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own meal plans" on public.meal_plans;
create policy "Users can read own meal plans" on public.meal_plans for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own meal plans" on public.meal_plans;
create policy "Users can insert own meal plans" on public.meal_plans for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own meal plans" on public.meal_plans;
create policy "Users can delete own meal plans" on public.meal_plans for delete using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own consents" on public.privacy_consents;
create policy "Users can read own consents" on public.privacy_consents for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own consents" on public.privacy_consents;
create policy "Users can insert own consents" on public.privacy_consents for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own privacy requests" on public.data_subject_requests;
create policy "Users can read own privacy requests" on public.data_subject_requests for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own privacy requests" on public.data_subject_requests;
create policy "Users can insert own privacy requests" on public.data_subject_requests for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own Stripe purchases" on public.stripe_purchases;
create policy "Users can read own Stripe purchases" on public.stripe_purchases for select using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read privacy audit events" on public.data_subject_request_audit_events;
create policy "Admins can read privacy audit events" on public.data_subject_request_audit_events for select
  using (exists (
    select 1 from auth.users users
    where users.id = (select auth.uid())
      and (users.raw_app_meta_data->>'role' = 'admin' or users.raw_app_meta_data->>'username' = 'rdladmin')
  ));

drop policy if exists "Admins can read meal templates" on public.admin_meal_templates;
create policy "Admins can read meal templates" on public.admin_meal_templates for select
  using (exists (
    select 1 from auth.users users
    where users.id = (select auth.uid())
      and (users.raw_app_meta_data->>'role' = 'admin' or users.raw_app_meta_data->>'username' = 'rdladmin')
  ));

create index if not exists meal_plans_profile_id_idx on public.meal_plans(profile_id);
create index if not exists data_subject_request_audit_events_admin_user_id_idx on public.data_subject_request_audit_events(admin_user_id);
create index if not exists admin_meal_templates_created_by_idx on public.admin_meal_templates(created_by);
create index if not exists admin_meal_templates_updated_by_idx on public.admin_meal_templates(updated_by);
