-- Migration: add entra_oid to user_master
-- Purpose: key the account on the immutable Entra ID object id instead of the
-- email-like claims (email / preferred_username / upn). Editing a user's mail
-- attribute or UPN in Entra changes all of those claims, which previously made
-- /auth/callback fail to find the existing row and create a duplicate account
-- (losing role and allowed_departments).
-- Apply on Supabase via SQL editor or `supabase db push`.
--
-- Backfill: none needed. The server falls back to matching any email-like claim
-- and writes entra_oid on the next successful login for each user.

alter table public.user_master
  add column if not exists entra_oid text;

-- Partial unique index: one row per Entra object id, while rows that predate
-- this column (entra_oid is null) are still allowed to coexist.
create unique index if not exists user_master_entra_oid_key
  on public.user_master (entra_oid)
  where entra_oid is not null;

comment on column public.user_master.entra_oid is
  'Entra ID object id (oid claim; sub when oid is absent). Immutable per user per tenant — the primary account-matching key. NULL until the user logs in once after this migration.';
