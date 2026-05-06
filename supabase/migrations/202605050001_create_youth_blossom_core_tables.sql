create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'leader' check (role in ('admin', 'leader', 'volunteer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.youths (
  id text primary key default gen_random_uuid()::text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female')),
  address text not null,
  education_status text not null check (education_status in ('high_school', 'college', 'working', 'unemployed')),
  occupation text,
  join_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  engagement_score integer not null default 50 check (engagement_score >= 0 and engagement_score <= 100),
  engagement_status text not null default 'engaged' check (engagement_status in ('engaged', 'at-risk', 'disengaged')),
  small_group text,
  mentor text,
  leadership_level text not null default 'none' check (leadership_level in ('none', 'emerging', 'developing', 'established')),
  discipleship_status text not null default 'growing' check (discipleship_status in ('new_believer', 'growing', 'mature', 'leader')),
  attendance_rate integer not null default 0 check (attendance_rate >= 0 and attendance_rate <= 100),
  last_attendance date,
  notes text,
  ministry_areas text[] not null default '{}',
  age_group text not null check (age_group in ('13-15', '16-18', '19-24', '25-30')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null,
  category text not null check (category in ('worship', 'discipleship', 'outreach', 'fellowship', 'leadership', 'sabbath_school')),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  participant_count integer not null default 0,
  max_capacity integer,
  leader text not null,
  schedule text not null,
  schedule_type text not null check (schedule_type in ('sabbath', 'weekday', 'special')),
  average_attendance integer not null default 0,
  engagement_score integer not null default 0,
  member_breakdown jsonb not null default '{"students":0,"employed":0,"unemployed":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key default gen_random_uuid()::text,
  youth_id text not null references public.youths(id) on delete cascade,
  youth_name text not null,
  program_id text not null,
  program_name text not null,
  date date not null,
  attendance_status text not null check (attendance_status in ('present', 'late', 'absent', 'excused')),
  engagement_level text not null default 'medium' check (engagement_level in ('very_high', 'high', 'medium', 'low', 'none')),
  participated_in_activity boolean not null default false,
  activity_notes text,
  follow_up_notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists youths_set_updated_at on public.youths;
create trigger youths_set_updated_at before update on public.youths for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at before update on public.programs for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.youths enable row level security;
alter table public.programs enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "Users can maintain own profile" on public.profiles;
create policy "Users can maintain own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Authenticated users can read youths" on public.youths;
create policy "Authenticated users can read youths" on public.youths for select to authenticated using (true);

drop policy if exists "Authenticated users can insert youths" on public.youths;
create policy "Authenticated users can insert youths" on public.youths for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update youths" on public.youths;
create policy "Authenticated users can update youths" on public.youths for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete youths" on public.youths;
create policy "Authenticated users can delete youths" on public.youths for delete to authenticated using (true);

drop policy if exists "Authenticated users can read programs" on public.programs;
create policy "Authenticated users can read programs" on public.programs for select to authenticated using (true);

drop policy if exists "Authenticated users can maintain programs" on public.programs;
create policy "Authenticated users can maintain programs" on public.programs for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can read attendance" on public.attendance_records;
create policy "Authenticated users can read attendance" on public.attendance_records for select to authenticated using (true);

drop policy if exists "Authenticated users can insert attendance" on public.attendance_records;
create policy "Authenticated users can insert attendance" on public.attendance_records for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update attendance" on public.attendance_records;
create policy "Authenticated users can update attendance" on public.attendance_records for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete attendance" on public.attendance_records;
create policy "Authenticated users can delete attendance" on public.attendance_records for delete to authenticated using (true);

create index if not exists youths_status_idx on public.youths(status);
create index if not exists youths_age_group_idx on public.youths(age_group);
create index if not exists youths_engagement_status_idx on public.youths(engagement_status);
create index if not exists attendance_records_youth_id_idx on public.attendance_records(youth_id);
create index if not exists attendance_records_program_id_idx on public.attendance_records(program_id);
create index if not exists attendance_records_date_idx on public.attendance_records(date);
