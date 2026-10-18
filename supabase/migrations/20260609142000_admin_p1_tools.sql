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

alter table public.data_subject_request_audit_events enable row level security;
alter table public.admin_meal_templates enable row level security;

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

create index if not exists data_subject_request_audit_events_request_id_created_at_idx
  on public.data_subject_request_audit_events(request_id, created_at desc);

create index if not exists admin_meal_templates_active_meal_type_idx
  on public.admin_meal_templates(active, meal_type);
