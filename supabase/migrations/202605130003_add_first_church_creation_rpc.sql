create or replace function public.create_church_for_current_user(requested_church_name text)
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
  created_church public.churches%rowtype;
  created_membership_id uuid;
  clean_church_name text;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  clean_church_name := nullif(trim(requested_church_name), '');

  insert into public.churches (name)
  values (coalesce(clean_church_name, 'My Church'))
  returning * into created_church;

  insert into public.church_memberships (church_id, user_id, role, status)
  values (created_church.id, current_user_id, 'owner', 'active')
  returning id into created_membership_id;

  membership_id := created_membership_id;
  church_id := created_church.id;
  church_name := created_church.name;
  church_slug := created_church.slug;
  role := 'owner';
  return next;
end;
$$;

revoke execute on function public.create_church_for_current_user(text) from anon;
grant execute on function public.create_church_for_current_user(text) to authenticated;
