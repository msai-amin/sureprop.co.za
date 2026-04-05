-- SureProp baseline RLS policies
-- Apply in Supabase SQL Editor after running Prisma migrations.

begin;

-- Helper: app role from JWT metadata
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'app_role', '')
$$;

-- USER
alter table public."User" enable row level security;

drop policy if exists user_select_self_or_admin on public."User";
create policy user_select_self_or_admin
on public."User" for select
using (
  auth.uid() = "id"
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists user_update_self_or_admin on public."User";
create policy user_update_self_or_admin
on public."User" for update
using (
  auth.uid() = "id"
  or public.current_app_role() = 'ADMIN'
)
with check (
  auth.uid() = "id"
  or public.current_app_role() = 'ADMIN'
);

-- PROPERTY
alter table public."Property" enable row level security;

drop policy if exists property_select_active_or_owned_or_admin on public."Property";
create policy property_select_active_or_owned_or_admin
on public."Property" for select
using (
  "status" = 'ACTIVE'
  or "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists property_insert_agent_or_admin on public."Property";
create policy property_insert_agent_or_admin
on public."Property" for insert
with check (
  (public.current_app_role() in ('AGENT', 'ADMIN'))
  and (
    "agentId" = auth.uid()
    or public.current_app_role() = 'ADMIN'
  )
);

drop policy if exists property_update_owned_or_admin on public."Property";
create policy property_update_owned_or_admin
on public."Property" for update
using (
  "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
)
with check (
  "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

-- LEAD
alter table public."Lead" enable row level security;

drop policy if exists lead_select_participant_or_admin on public."Lead";
create policy lead_select_participant_or_admin
on public."Lead" for select
using (
  "buyerId" = auth.uid()
  or "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists lead_insert_buyer_or_admin on public."Lead";
create policy lead_insert_buyer_or_admin
on public."Lead" for insert
with check (
  (
    public.current_app_role() = 'BUYER'
    and "buyerId" = auth.uid()
  )
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists lead_update_agent_or_admin on public."Lead";
create policy lead_update_agent_or_admin
on public."Lead" for update
using (
  "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
)
with check (
  "agentId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

-- DOCUMENT
alter table public."Document" enable row level security;

drop policy if exists document_select_owner_or_admin on public."Document";
create policy document_select_owner_or_admin
on public."Document" for select
using (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists document_insert_owner_or_admin on public."Document";
create policy document_insert_owner_or_admin
on public."Document" for insert
with check (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists document_update_owner_or_admin on public."Document";
create policy document_update_owner_or_admin
on public."Document" for update
using (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
)
with check (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

-- SUBSCRIPTION
alter table public."Subscription" enable row level security;

drop policy if exists subscription_select_owner_or_admin on public."Subscription";
create policy subscription_select_owner_or_admin
on public."Subscription" for select
using (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists subscription_insert_owner_or_admin on public."Subscription";
create policy subscription_insert_owner_or_admin
on public."Subscription" for insert
with check (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists subscription_update_owner_or_admin on public."Subscription";
create policy subscription_update_owner_or_admin
on public."Subscription" for update
using (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
)
with check (
  "userId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

-- AUDIT LOG
alter table public."AuditLog" enable row level security;

drop policy if exists audit_select_actor_or_admin on public."AuditLog";
create policy audit_select_actor_or_admin
on public."AuditLog" for select
using (
  "actorUserId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

drop policy if exists audit_insert_actor on public."AuditLog";
create policy audit_insert_actor
on public."AuditLog" for insert
with check (
  "actorUserId" = auth.uid()
  or public.current_app_role() = 'ADMIN'
);

-- STORAGE OBJECTS (bucket defaults to `vault`)
-- Adjust bucket_id if SUPABASE_VAULT_BUCKET differs.
drop policy if exists storage_vault_select_own_or_admin on storage.objects;
create policy storage_vault_select_own_or_admin
on storage.objects for select
using (
  bucket_id = 'vault'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.current_app_role() = 'ADMIN'
  )
);

drop policy if exists storage_vault_insert_own_or_admin on storage.objects;
create policy storage_vault_insert_own_or_admin
on storage.objects for insert
with check (
  bucket_id = 'vault'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.current_app_role() = 'ADMIN'
  )
);

drop policy if exists storage_vault_update_own_or_admin on storage.objects;
create policy storage_vault_update_own_or_admin
on storage.objects for update
using (
  bucket_id = 'vault'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.current_app_role() = 'ADMIN'
  )
)
with check (
  bucket_id = 'vault'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.current_app_role() = 'ADMIN'
  )
);

drop policy if exists storage_vault_delete_own_or_admin on storage.objects;
create policy storage_vault_delete_own_or_admin
on storage.objects for delete
using (
  bucket_id = 'vault'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.current_app_role() = 'ADMIN'
  )
);

commit;
