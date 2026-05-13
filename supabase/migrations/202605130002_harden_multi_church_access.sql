drop policy if exists "Authenticated users can create churches" on public.churches;
create policy "Authenticated users can create churches"
on public.churches for insert
to authenticated
with check ((select auth.uid()) is not null);

revoke all on table public.churches from anon;
revoke all on table public.church_memberships from anon;

revoke execute on function public.is_church_member(uuid) from anon;
revoke execute on function public.current_church_role(uuid) from anon;
revoke execute on function public.can_manage_church(uuid) from anon;
revoke execute on function public.can_edit_church_records(uuid) from anon;
revoke execute on function public.can_record_church_attendance(uuid) from anon;
revoke execute on function public.church_has_members(uuid) from anon;

create index if not exists profiles_default_church_id_idx on public.profiles(default_church_id);
