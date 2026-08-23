# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Vite dev server on :5173, API requests proxied to :8080 (see vite.config.js)
npm run build      # outputs to dist/
npm run start      # node server.js — serves dist/ + API on :8080
```

There is no test suite, linter, or formatter configured. `package.json` only defines `dev`, `build`, `preview`, `start`.

### Rebuild + restart after frontend changes

`server.js` serves the built bundle from `dist/`, **not** the source. Any change under `src/`, `index.html`, or `src/locales/*` requires a rebuild before the running server reflects it.

```bash
npx vite build
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess -Force -ErrorAction SilentlyContinue"
node server.js &
```

Confirmation log: `Server started on :8080 (externalAuth=true)`.

Backend-only changes (`server.js`, `entra-auth.js`, `users-store.js`) need only the restart, not the rebuild.

## Architecture

Two-process app: a **Vite-bundled vanilla-JS SPA** that talks to an **Express server** which fronts **Cloud SQL for PostgreSQL** and **Microsoft Entra ID** (OIDC). Output is an .xlsx file that goes into a separate basis system.

### Server (`server.js`)

- Express + `express-session` (cookie `item_import_sid`). All non-public paths gated by `requireAuth`; admin paths by `requireAdmin`.
- Entra ID OIDC flow lives in `entra-auth.js` (`/login` → `/auth/callback`). On callback success, the user is upserted via `users-store.js` and the session is populated with `role`, `allowedDepartments`, `preferredStore`, `preferredDepartment`.
- **`db.js`** owns the `pg.Pool` (created lazily) and exposes `query` / `queryRows` / `queryOne` / `withTransaction` / `bulkUpsert` / `arrayParam`. No ORM — endpoints write plain parameterized SQL. It is **injected into `users-store.js` via `initUsersStore(db)`**; `users-store.js` falls back to `data/users.json` when the DB env vars are missing (dev only).
- Connection mode is picked from env in this order: `DATABASE_URL` → `INSTANCE_UNIX_SOCKET` (Cloud Run + `--add-cloudsql-instances`) → `DB_HOST` (TCP). See `docs/cloudsql-migration.md`.
- **Pool sizing is a hard constraint**: Cloud Run scales horizontally, so `--max-instances × DB_POOL_MAX` must stay under the instance's `max_connections`.
- `bulkUpsert` reproduces the old `.upsert(rows, { onConflict })` semantics. Callers **must** de-duplicate on the conflict key first — Postgres rejects a statement that hits the same key twice.
- `user_master.allowed_departments` is `text[]` and `operation_log.details` is `jsonb` (see `docs/db/000_baseline.sql`). Arrays are written as `$n::text[]` with a JS array; `details` is written as a `JSON.stringify`'d **untyped** parameter so Postgres coerces it from the column type.
- `users-store.js` degrades to username matching when `user_master.entra_oid` is absent. That detection must key on **SQLSTATE 42703 only** — an earlier message-substring check also matched the unique violation on `user_master_entra_oid_key` and permanently disabled oid matching. Unique violations are disambiguated by `err.constraint`, not by message text.
- Serves `dist/` statically. Assets get a 1y immutable cache header; SPA fallback sends `dist/index.html` for unknown routes.
- Generates `/config.js` at request time as `window.__APP_CONFIG__ = {}` — API keys are intentionally *not* exposed to the client. Gemini calls go through the `/api/ai-suggest` proxy so `VITE_GEMINI_API_KEY` stays server-side. The model is `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, AI Studio endpoint — **not** Vertex AI); Gemini 3.x can return `thought:true` parts, so the proxy filters them before returning text.

### Department permission model

Three master tables are partitioned by department, and the dept digit is **encoded inside the primary key**:

- `group_master.product_group_code` — first char is the dept digit (`"1"` → dept `"01"`).
- `supplier_master.supplier_no` — the **second** char is the dept digit.
- `store_master` is shared across departments.

Server-side filtering uses `LIKE` on those positions (see `deptDigitGroup`, `getGroupDeptFromCode`, `getSupplierDeptFromNo` in `server.js`). Master imports do per-row dept checks against `req.session.allowedDepartments` unless the user is `admin`. **When adding new master endpoints, replicate the dept check** — there is no row-level DB policy backing this up.

### Frontend (`src/main.js` + `src/lib/*`, `src/data/*`)

- Single-page vanilla JS, no framework. State lives in module-level `let items`, `selectedDepartment`, etc. in `main.js`. Undo/redo is a JSON-snapshot stack (`MAX_HISTORY = 30`).
- `src/data/masters.js` holds the in-memory group/supplier master and selection helpers; `src/lib/mastersApi.js` fetches from the server endpoints and caches.
- `src/lib/excel.js` — SheetJS-based reader/writer for the import/export `.xlsx` (sheets: `Item`, `Additional Barcode`). Export filename pattern: `<dept>_YYYYMMDD_HHMMSS.xlsx`.
- `src/lib/genaiSuggest.js` — calls `/api/ai-suggest` (Gemini proxy). Falls back to keyword matching when AI is unconfigured.
- `src/lib/i18n.js` + `src/locales/{ja,th}.json` — runtime language switch (Japanese / Thai). Keep both locale files in sync when adding strings.
- Product types: manufacturer / scale / raw-material / consumables. Raw-material and consumables share UI/validation paths via `isRawMaterialLike()` in `main.js`. Delivery destination row (store vs DC) is shown only for departments listed in `DELIVERY_DEST_DEPARTMENTS = ['03', '05']`.

### Postgres tables touched by this app

`user_master`, `group_master`, `supplier_master`, `store_master`, `operation_log`.

**`docs/db/000_baseline.sql` is the schema of record** (captured 2026-08-23 from Supabase with `pg_dump --schema=public --schema-only`). `docs/db/001..003` are the incremental migrations applied on top of the original schema and are already folded into the baseline. Read the baseline before changing any query — notable points:

- `group_master` / `supplier_master` use `character varying` (unbounded) and carry `created_at` / `updated_at`; `store_master` and `operation_log` do not have `updated_at`.
- `group_master.description` and `store_master.store_name` are `NOT NULL`.
- `id` columns are `bigint` + `nextval` sequences (serial-style, not `identity`) — a restore needs `setval` if rows are loaded with explicit ids.
- `user_master` has `UNIQUE (username)` plus a **partial** unique index `user_master_entra_oid_key ON (entra_oid) WHERE entra_oid IS NOT NULL`, and `CHECK (role IN ('admin','user'))`.
- No RLS policies — access is service-role/`app`-user only, so the dept checks in `server.js` are the only enforcement.
- The master upserts deliberately do **not** touch `updated_at`, matching the old Supabase `.upsert()` behavior. Those columns therefore stay at the row's insert time; fix only if the audit value is actually wanted.

### Auth env vars

Server boots in “externalAuth=false” mode without these — `/login` returns 503. To run with real auth set `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID`, `ENTRA_REDIRECT_URI`, `SESSION_SECRET`, plus the DB vars (`DATABASE_URL`, or `INSTANCE_UNIX_SOCKET` + `DB_USER` / `DB_PASS` / `DB_NAME`) for DB access. See `README.md` for the full list and Cloud Run deployment notes.

## Conventions

- Code comments, commit messages, and API specs in English. UI strings and user-facing docs in Japanese / Thai.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Design docs of record: `要件定義書.md`, `基本設計書.md`, `次のフェーズ_基本設計.md`, `ヒアリング項目・要確認事項.md`. Consult these before changing data model or import-file layout.
