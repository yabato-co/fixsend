create table if not exists public.fixpack_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  full_name text,
  target_role text not null,
  fixsend_score text,
  cv_text text not null,
  decision text not null,
  overall_score numeric not null,
  readiness_score integer not null,
  role_fit text not null,
  dashboard_data jsonb not null
);

create table if not exists public.fixpack_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending',
  email text,
  target_role text not null,
  cv_text text not null,
  free_result jsonb not null,
  gumroad_sale_id text,
  report_id uuid references public.fixpack_reports(id)
);

alter table public.fixpack_reports enable row level security;
alter table public.fixpack_sessions enable row level security;

drop policy if exists "Allow public read by id" on public.fixpack_reports;
create policy "Allow public read by id"
on public.fixpack_reports
for select
using (true);

drop policy if exists "Allow public report creation" on public.fixpack_reports;
create policy "Allow public report creation"
on public.fixpack_reports
for insert
with check (
  email is not null
  and cv_text is not null
  and target_role is not null
  and dashboard_data is not null
);

drop policy if exists "Allow public session creation" on public.fixpack_sessions;
create policy "Allow public session creation"
on public.fixpack_sessions
for insert
with check (
  cv_text is not null
  and target_role is not null
  and free_result is not null
);

drop policy if exists "Allow public session read" on public.fixpack_sessions;
create policy "Allow public session read"
on public.fixpack_sessions
for select
using (true);
