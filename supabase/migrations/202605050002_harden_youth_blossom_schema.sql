create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on table public.profiles from anon;
revoke all on table public.youths from anon;
revoke all on table public.programs from anon;
revoke all on table public.attendance_records from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.youths to authenticated;
grant select, insert, update, delete on table public.programs to authenticated;
grant select, insert, update, delete on table public.attendance_records to authenticated;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can maintain own profile" on public.profiles;
create policy "Users can maintain own profile"
on public.profiles for all
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Authenticated users can maintain programs" on public.programs;
drop policy if exists "Authenticated users can insert programs" on public.programs;
create policy "Authenticated users can insert programs"
on public.programs for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update programs" on public.programs;
create policy "Authenticated users can update programs"
on public.programs for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete programs" on public.programs;
create policy "Authenticated users can delete programs"
on public.programs for delete
to authenticated
using (true);

create index if not exists attendance_records_recorded_by_idx on public.attendance_records(recorded_by);

revoke execute on function public.rls_auto_enable() from anon, authenticated;
