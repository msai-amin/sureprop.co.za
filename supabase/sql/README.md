# Supabase SQL Migrations (No Prisma)

This project uses ordered SQL files under `supabase/sql/`.

## Current files

- `000_schema.sql` - Base tables/enums/indexes/foreign keys
- `001_rls_policies.sql` - Baseline RLS + storage policies
- `002_migration_tracker.sql` - `schema_migrations` table + `mark_schema_migration()` helper
- `003_register_baseline.sql` - Marks `000`/`001` as applied after you run them

## First-time setup

Run these in Supabase SQL Editor, in order:

1. `000_schema.sql`
2. `001_rls_policies.sql`
3. `002_migration_tracker.sql`
4. `003_register_baseline.sql`

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
