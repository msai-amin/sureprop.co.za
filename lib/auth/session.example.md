# Authentication

## Production

1. Set user metadata key **`app_role`** to one of: `BUYER`, `AGENT`, `LAWYER`, `BOND`, `ADMIN` (Supabase Dashboard → Authentication → Users, or your signup hook).
2. Ensure `public.User` rows use the **same `id`** as `auth.users.id` for Prisma foreign keys.

## OAuth / magic link

Add redirect URL: `https://your-domain/auth/callback` in Supabase Authentication → URL Configuration.

## Local API testing (optional)

Set `AUTH_HEADER_FALLBACK=true` and send:

- `x-user-id`: UUID
- `x-user-role`: role enum
