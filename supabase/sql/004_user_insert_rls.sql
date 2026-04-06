-- If you already applied 001 before user_insert_self existed, run this in SQL Editor.

begin;

drop policy if exists user_insert_self on public."User";
create policy user_insert_self
on public."User" for insert
with check (auth.uid() = "id");

select public.mark_schema_migration(
  '004_user_insert_rls',
  'Allow authenticated users to insert their own User row (profile sync upsert)'
);

commit;
