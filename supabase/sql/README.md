# Supabase SQL Migrations (No Prisma)

This project uses ordered SQL files under `supabase/sql/`.

## Current files

- `000_schema.sql` - Base tables/enums/indexes/foreign keys
- `001_rls_policies.sql` - Baseline RLS + storage policies
- `002_migration_tracker.sql` - `schema_migrations` table + `mark_schema_migration()` helper
- `003_register_baseline.sql` - Marks `000`/`001` as applied after you run them
- `004_user_insert_rls.sql` - **Only if** you ran an older `001` without `user_insert_self` (lets profile sync insert new `User` rows under RLS)

## First-time setup

Run these in Supabase SQL Editor, in order:

1. `000_schema.sql`
2. `001_rls_policies.sql` (includes `user_insert_self`; skip `004` on a fresh DB)
3. `002_migration_tracker.sql`
4. `003_register_baseline.sql`

If profile sync fails with RLS/insert errors on an existing project, run `004_user_insert_rls.sql` after `002` (so `mark_schema_migration` exists).

## Ongoing migration pattern

For each new DB change, add the next numbered file, for example:

- `004_add_lead_notes.sql`

Structure:

```sql
begin;

-- your DDL / DML changes

select public.mark_schema_migration(
  '004_add_lead_notes',
  'Add lead notes column and index'
);

commit;
```

## Verify applied migrations

```sql
select id, description, applied_at, applied_by
from public.schema_migrations
order by applied_at asc;
```
