-- Migration tracker table + helper function.
-- Run once before registering migrations.

begin;

create table if not exists public.schema_migrations (
  id text primary key,
  description text not null default '',
  checksum text,
  applied_at timestamptz not null default now(),
  applied_by text not null default current_user
);

create or replace function public.mark_schema_migration(
  p_id text,
  p_description text default '',
  p_checksum text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null or length(trim(p_id)) = 0 then
    raise exception 'migration id is required';
  end if;

  insert into public.schema_migrations (id, description, checksum)
  values (trim(p_id), coalesce(p_description, ''), p_checksum)
  on conflict (id) do nothing;
end;
$$;

commit;
