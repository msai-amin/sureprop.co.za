-- Registers existing baseline scripts in schema_migrations.
-- Requires 002_migration_tracker.sql to be applied first.

begin;

select public.mark_schema_migration(
  '000_schema',
  'Initial SureProp schema objects'
);

do $$
begin
  if exists (
    select 1
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'User'
      and p.polname = 'user_select_self_or_admin'
  ) then
    perform public.mark_schema_migration(
      '001_rls_policies',
      'Baseline row-level security policies'
    );
  else
    raise notice 'RLS baseline not detected; apply 001_rls_policies.sql first.';
  end if;
end
$$;

commit;
