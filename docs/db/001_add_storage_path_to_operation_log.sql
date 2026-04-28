-- Migration: add storage_path to operation_log
-- Purpose: track GCS object path for exported xlsx files (90-day retention).
-- Apply on Supabase via SQL editor or `supabase db push`.
-- Backfill is unnecessary: existing rows remain NULL and are treated as
-- "download unavailable" by the admin UI (per 2026-04-28 decision).

alter table public.operation_log
  add column if not exists storage_path text;

comment on column public.operation_log.storage_path is
  'GCS object path under GCS_EXPORTS_BUCKET. NULL means the file was not retained (legacy rows or upload failure).';
