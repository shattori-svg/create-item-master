-- One-off cleanup: merge the duplicate user_master rows created while account
-- matching was keyed on the email claim (see 002_add_entra_oid_to_user_master.sql).
--
-- Symptom: the same person has two rows — an old one holding the real role /
-- allowed_departments, and a new one created after Entra changed their mail or UPN.
--
-- Run the steps IN ORDER and review each result before moving on. Nothing here
-- is idempotent, so do not run step 3/4 twice.
-- operation_log stores the login id as plain text (no FK); historical rows are
-- intentionally left untouched so past exports keep the name they were made under.

-- ---------------------------------------------------------------------------
-- Step 1 (dry run): list every account, newest last. Identify the pair.
--   KEEP  = the row with the correct role / allowed_departments (usually the older one)
--   DROP  = the duplicate created on the most recent login
--   NEW_LOGIN_ID = the DROP row's username (the login id Entra now sends)
-- ---------------------------------------------------------------------------
select id,
       username,
       entra_oid,
       display_name,
       role,
       allowed_departments,
       preferred_store,
       preferred_department,
       created_at,
       updated_at
from public.user_master
order by created_at;

-- ---------------------------------------------------------------------------
-- Step 2 (dry run): confirm the two rows you picked, side by side.
-- ---------------------------------------------------------------------------
-- select * from public.user_master where id in (<KEEP_ID>, <DROP_ID>);

-- ---------------------------------------------------------------------------
-- Step 3: delete the duplicate FIRST, so the login id it occupies is free.
-- Verify it carries no settings worth keeping (role='user', empty departments)
-- before deleting.
-- ---------------------------------------------------------------------------
-- delete from public.user_master where id = <DROP_ID>;

-- ---------------------------------------------------------------------------
-- Step 4: move the current login id onto the row you keep, and clear entra_oid
-- so the next login re-links it from the ID token.
-- ---------------------------------------------------------------------------
-- update public.user_master
--    set username   = '<NEW_LOGIN_ID>',   -- lower case, e.g. 'shun.hattori@g-oic.com'
--        entra_oid  = null,
--        updated_at = now()
--  where id = <KEEP_ID>;

-- ---------------------------------------------------------------------------
-- Step 5: have the user log in again, then verify entra_oid is populated on the
-- kept row and no new row appeared.
-- ---------------------------------------------------------------------------
-- select id, username, entra_oid, role, allowed_departments from public.user_master order by created_at;
