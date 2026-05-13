create or replace function public.generate_church_join_code()
returns text
language sql
volatile
set search_path = public
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

alter table public.churches add column if not exists join_code text;

update public.churches
set join_code = public.generate_church_join_code()
where join_code is null;

alter table public.churches alter column join_code set not null;
alter table public.churches alter column join_code set default public.generate_church_join_code();

create unique index if not exists churches_join_code_idx on public.churches(join_code);

create or replace function public.join_church_for_current_user(requested_join_code text, requested_role text)
returns table (
  membership_id uuid,
  church_id uuid,
  church_name text,
  church_slug text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_church public.churches%rowtype;
  selected_role text;
  target_membership public.church_memberships%rowtype;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select *
  into target_church
  from public.churches
  where upper(join_code) = upper(trim(requested_join_code))
  limit 1;

  if target_church.id is null then
    raise exception 'Church code not found' using errcode = 'P0002';
  end if;

  selected_role := case
    when requested_role in ('leader', 'volunteer', 'viewer') then requested_role
    else 'viewer'
  end;

  insert into public.church_memberships (church_id, user_id, role, status)
  values (target_church.id, current_user_id, selected_role, 'active')
  on conflict (church_id, user_id) do update
    set role = excluded.role,
        status = 'active',
        updated_at = now()
  returning * into target_membership;

  membership_id := target_membership.id;
  church_id := target_church.id;
  church_name := target_church.name;
  church_slug := target_church.slug;
  role := target_membership.role;
  return next;
end;
$$;

revoke execute on function public.generate_church_join_code() from anon;
revoke execute on function public.join_church_for_current_user(text, text) from anon;
grant execute on function public.join_church_for_current_user(text, text) to authenticated;
