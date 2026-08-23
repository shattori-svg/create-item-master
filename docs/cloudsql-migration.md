# Supabase → Cloud SQL for PostgreSQL 移行手順

調査レポート: [docs/tech-research/20260823-supabase-to-cloudsql.md](tech-research/20260823-supabase-to-cloudsql.md)

移行の背景: Supabase の egress クォータ超過 + spend cap により、プロジェクトが停止し
ログイン不可になった（2026-08-23）。恒久対策として Cloud Run と同一リージョンの Cloud SQL に移す。

> ⚠️ **egress 超過の原因はこのアプリではない。** Supabase Usage の実測（2026-08-23、
> プロジェクト "thailand item master" でフィルタ）は日次ピーク 341KB / 通常 100〜200KB、
> 30日で約 4.5MB — 5GB クォータの 0.09%。Supabase の課金・クォータは**組織単位**で、
> 同一組織にある別プロジェクト（`vxufzjquwthdedmacyhu`、75テーブルの物流系システム）の
> 消費と合算されて超過したと判断される。
>
> したがってこの移行の効果は「原因ではないこのアプリを、他プロジェクトの消費による
> 停止から切り離す」ことであり、**根本原因は別プロジェクト側に残る**。移行完了後に
> そちらの egress を別途調査する必要がある。

## 対象環境（2026-08-23 実測）

| 項目 | 値 |
|---|---|
| GCP プロジェクト | **`item-master-creater`**（番号 894174291476） |
| Cloud Run サービス | `item-master-create-dev` / `asia-northeast1` |
| Cloud Run サービスアカウント | `894174291476-compute@developer.gserviceaccount.com`（デフォルト Compute SA） |
| Supabase プロジェクト参照 | `owmczshcuhbkyvwwwqhr` |

⚠️ `gcloud config` の既定プロジェクトは別プロジェクト（`nanbu-sys02-dev`）を指していた。
**コマンドには必ず `--project=item-master-creater` を明示する。**

## データ規模（2026-08-23 実測、ローカルでのリストア空検証による）

| テーブル | 行数 |
|---|---|
| group_master | 977 |
| supplier_master | 209 |
| store_master | 1 |
| user_master | 26 |
| operation_log | 2,779 |

実データは 1MB 未満（DB サイズ 10MB の大半は Postgres のオーバーヘッド）。
シーケンスは `pg_restore` が `SEQUENCE SET` を含むため `seq = max(id)` で正しく復元され、
`setval` 補正は不要だった。

## 決定事項

| 項目 | 決定 | 理由 |
|---|---|---|
| DB | Cloud SQL for PostgreSQL **18** | Cloud SQL の新規デフォルト。**ローカルの pg_dump / psql が 18.3** なので、ダンプ生成とリストア先のメジャーが一致する（pg_dump は「ターゲット以下の古いサーバ」向け出力を保証しないため、ターゲットに合わせるのが安全） |
| tier | **`db-f1-micro`**（`max_connections` = 25） | 実データ 1MB 未満・ユーザー 26 人なので余裕は不要。`db-g1-small`（50接続・$26/月）は共有コアで SLA 対象外なのに高く、中途半端。SLA が必要になった時点で `db-custom-1-3840` 以上へ上げる |
| リージョン | `asia-northeast1` | Cloud Run と同一 → 同一リージョン通信は egress 無課金 |
| 接続方式 | Unix ソケット（Cloud Run 組込み Cloud SQL 連携） | VPC 不要・追加コストなし。将来 Private IP + Direct VPC egress に切り替え可能 |
| クライアント | `pg` ^8.23.0（ORM なし） | 既存コードが素の JS。`pg@9` は破壊的変更（query queue 廃止）が予告済みなので 8 系に固定 |
| セッションストア | 今回のスコープ**外** | `express-session` は既定の MemoryStore のまま。Postgres 化は別対応（下記「残課題」参照） |

---

## Phase 0: Supabase からダンプを取得（**最優先・要 DB パスワード**）

⚠️ この作業は Supabase が restricted 解除された状態でしか実行できない。
⚠️ **このリポジトリにはベースライン DDL が存在しない**（`docs/db/001〜003` は差分のみ）。
スキーマの正本は Supabase 上にしかないため、まずスキーマを回収してコミットする。

接続情報は Supabase Dashboard → Project Settings → Database。
**接続方法によってユーザー名の形式が違う**ので注意する:

🚨 **プロジェクトを間違えないこと。** アカウント内に別システムの Supabase プロジェクトがあり、
2026-08-23 に一度そちらをダンプしてしまった（`public` に 75 テーブルの無関係なスキーマが入っており、
このアプリの 5 テーブルは 1 つも含まれていなかった）。
**このアプリのプロジェクト参照は `owmczshcuhbkyvwwwqhr`**（ローカル `.env` の `SUPABASE_URL` が正本）。
ダンプ後は必ず `grep -c 'public\.user_master' docs/db/000_baseline.sql` で中身を確認する。

このアプリの接続情報:

| 接続方法 | host | user | 可否 |
|---|---|---|---|
| Direct connection | `db.owmczshcuhbkyvwwwqhr.supabase.co` | `postgres` | ❌ **使えない** |
| **Session pooler (Supavisor)** | `aws-1-ap-southeast-1.pooler.supabase.com` | `postgres.owmczshcuhbkyvwwwqhr` | ✅ これを使う |

Direct connection の `db.<ref>.supabase.co` は **AAAA レコードのみ**（IPv4 アドオン未購入のため
IPv6 専用）で、IPv4 のみの回線からは名前解決の段階で
`could not translate host name ... Name or service not known` になる。
2026-08-23 時点の実測: `db.owmczshcuhbkyvwwwqhr.supabase.co → 2406:da18:243:...`（AWS ap-southeast-1）。

**ポートは 5432（Session mode）を使う。** 6543 は Transaction mode で、
pg_dump が必要とするセッションレベルの機能が使えない。

pooler のホスト名は `aws-0` / `aws-1` の2系統があり**プロジェクトごとに違う**（同一リージョンでも異なる）。
推測せず、誤ったパスワードで接続してエラーの種類で判別する:
`password authentication failed` = 正しいエンドポイント、
`(ENOTFOUND) tenant/user ... not found` = 別のエンドポイント。

> 課金は**組織単位**。停止しているプロジェクトが属する組織のプランを上げる必要がある。
> 別組織のプロジェクトを Pro にしても復旧しない。

パスワードの渡し方:

- **`-W`（プロンプト）は使えない。** Claude Code のターミナルは stdin が対話的でないため、
  プロンプトが即 EOF になり `fe_sendauth: no password supplied` で落ちる。
- **接続 URL に埋め込む方式も避ける。** パスワードの特殊文字をパーセントエンコードする必要がある。
- `PGPASSWORD` を先に設定するか、`%APPDATA%\postgresql\pgpass.conf` に
  `<host>:5432:postgres:<user>:<password>` の1行を置く（履歴に残らないので推奨）。

⚠️ **シェルによって構文が違う。** このリポジトリの作業ターミナルは既定で **PowerShell** なので、
`PGPASSWORD='x' pg_dump ...` という bash の前置き代入は
`用語 'PGPASSWORD=...' は認識されません` になる。

PowerShell:

```powershell
$env:PGPASSWORD = '<db-password>'
# 使い終わったら: Remove-Item Env:PGPASSWORD
```

bash (Git Bash):

```bash
export SUPA_HOST='aws-0-ap-southeast-1.pooler.supabase.com'
export SUPA_USER='postgres.vxufzjquwthdedmacyhu'
export PGPASSWORD='<db-password>'   # pgpass.conf を使う場合は不要
```

以降のコマンドは bash 形式（`$SUPA_HOST` 等）で書いてある。PowerShell で実行する場合は
ホスト名とユーザー名を直接展開して渡すこと。

### 0-1. スキーマのみ（リポジトリにコミットする）

```bash
pg_dump -h "$SUPA_HOST" -p 5432 -U "$SUPA_USER" -d postgres --schema=public --schema-only --no-owner --no-acl -f docs/db/000_baseline.sql
```

**✅ 2026-08-23 取得完了・確認済み**（5テーブルのみ、6.1KB）。確認結果:

| 項目 | 実際 |
|---|---|
| `user_master.allowed_departments` | `text[]` DEFAULT `'{}'` |
| `operation_log.details` | `jsonb` |
| `id` 列（`user_master` / `operation_log`） | `bigint` + `nextval` シーケンス（serial 相当、`identity` ではない） |
| PK | `group_master(product_group_code)` / `supplier_master(supplier_no)` / `store_master(store_code)` / `user_master(id)` — `ON CONFLICT` ターゲットは全て存在 |
| `user_master` の一意制約 | `UNIQUE (username)` + 部分 UNIQUE index `(entra_oid) WHERE entra_oid IS NOT NULL` |
| `user_master.role` | `CHECK (role IN ('admin','user'))` |
| RLS ポリシー | なし（service-role 前提） |
| NOT NULL | `group_master.description`, `store_master.store_name` |

これを受けて `db.js` の型プローブ（`arrayParam`）は削除し、`$n::text[]` 固定形にした。

⚠️ ダンプ適用時に `ERROR: schema "public" already exists` が 1 件出るが無害（`CREATE SCHEMA public` 行）。

### 0-2. データ込みフルダンプ（移行用。**リポジトリにはコミットしない**）

```bash
pg_dump -h "$SUPA_HOST" -p 5432 -U "$SUPA_USER" -d postgres --schema=public --no-owner --no-acl -Fc -f supabase_backup.dump
```

### 0-3. 移行前の行数を記録（後で照合する）

```bash
psql -h "$SUPA_HOST" -p 5432 -U "$SUPA_USER" -d postgres -c "select 'user_master' t, count(*) from user_master union all select 'group_master', count(*) from group_master union all select 'supplier_master', count(*) from supplier_master union all select 'store_master', count(*) from store_master union all select 'operation_log', count(*) from operation_log;"
```

---

## Phase 1: Cloud SQL インスタンス作成

前提: Cloud SQL Admin API を有効化する（未有効だった）。

```bash
gcloud services enable sqladmin.googleapis.com --project=item-master-creater
```

```bash
export PROJECT_ID='item-master-creater'
export REGION='asia-northeast1'
export INSTANCE='item-master-db'
export DB_NAME='item_import'
export DB_USER='app'
```

```bash
gcloud sql instances create "$INSTANCE" \
  --project="$PROJECT_ID" \
  --database-version=POSTGRES_18 \
  --edition=enterprise \
  --tier=db-f1-micro \
  --region="$REGION" \
  --storage-size=10GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --backup \
  --backup-start-time=18:00 \
  --enable-point-in-time-recovery \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=19
```

> `--backup-start-time` / `--maintenance-window-*` は **UTC 指定**。
> 上の値は 18:00 UTC = 03:00 JST（バックアップ）、日曜 19:00 UTC = 月曜 04:00 JST（メンテナンス）。
>
> `max_connections` は tier のメモリで自動決定される（フラグで固定すると自動追随が止まるので設定しない）:
>
> | tier | メモリ | `max_connections` |
> |---|---|---|
> | `db-f1-micro` | ~0.6GiB | **25** |
> | `db-g1-small` | ~1.7GiB | 50 |
> | `db-custom-1-3840` | 3.75GiB | 100 |
>
> 25 のうち `superuser_reserved_connections`（既定3）と Cloud SQL 内部利用分が引かれるので、
> アプリが使えるのは実効 20 前後。

DB とユーザーを作る。パスワードは Secret Manager に置き、シェル履歴に残さない:

```bash
gcloud sql databases create "$DB_NAME" --instance="$INSTANCE" --project="$PROJECT_ID"
gcloud sql users create "$DB_USER" --instance="$INSTANCE" --project="$PROJECT_ID" --prompt-for-password
```

`max_connections` の実値を確認（Phase 3 のプール設計に必要）:

```bash
psql "$LOCAL_CONN" -c 'show max_connections; show superuser_reserved_connections;'
```

**✅ 2026-08-23 実測: `max_connections` = 25 / `superuser_reserved_connections` = 3**（実効 22）。
公式ドキュメントの予測値と一致。

### ⚠️ gcloud のパスワードオプション

このバージョンの gcloud の `sql users create` には `--password-file` /
`--prompt-for-password` がなく `--password=` のみ。パスワードを履歴に残さないため、
生成 → Secret Manager 登録 → ユーザー作成をシェル変数経由で一括実行する:

```bash
PW="$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)"
gcloud secrets create item-master-db-password --project="$PROJECT_ID" --replication-policy=automatic
printf '%s' "$PW" | gcloud secrets versions add item-master-db-password --project="$PROJECT_ID" --data-file=-
gcloud sql users create "$DB_USER" --instance="$INSTANCE" --project="$PROJECT_ID" --password="$PW"
unset PW
```

以降パスワードは Secret Manager が唯一の保管場所:

```bash
gcloud secrets versions access latest --secret=item-master-db-password --project="$PROJECT_ID"
```

---

## Phase 2: リストア

Cloud SQL Auth Proxy をローカルで起動して流し込む（公開 IP に承認済みネットワークを開けずに済む）。
プロキシは gcloud コンポーネントとして既にインストール済み（`cloud-sql-proxy`）。

```bash
cloud-sql-proxy "${PROJECT_ID}:${REGION}:${INSTANCE}" --port 5433 --address 127.0.0.1
```

⚠️ **プロキシは gcloud CLI の認証ではなく Application Default Credentials (ADC) を使う。**
`gcloud auth login` 済みでも ADC が切れていると
`auth: "invalid_grant" "reauth related error (invalid_rapt)"` で接続直後に切断される
（gcloud コマンド自体は成功するので紛らわしい）。その場合は別途:

```bash
gcloud auth application-default login
```

パスワードは Secret Manager から取る:

```bash
export PGPASSWORD="$(gcloud secrets versions access latest --secret=item-master-db-password --project="$PROJECT_ID")"
export LOCAL_CONN="postgresql://${DB_USER}@127.0.0.1:5433/${DB_NAME}"
```

```bash
pg_restore --no-owner --no-acl -d "$LOCAL_CONN" supabase_backup.dump
```

> 再実行する場合のみ `--clean --if-exists` を追加する（**リストア先の同名オブジェクトを削除する**ので
> 初回投入では付けない）。

**✅ 2026-08-23 実行済み。** 出たエラーは `ERROR: schema "public" already exists` の 1 件のみで無害
（ダンプ冒頭の `CREATE SCHEMA public` 行）。Supabase 固有の残骸（`auth`/`storage` スキーマ参照、
RLS ポリシー、`supabase_admin` ロール）は `--schema=public` で取ったため混入しなかった。

### 検証

```bash
psql "$LOCAL_CONN" -c "select 'user_master' t, count(*) from user_master
  union all select 'group_master', count(*) from group_master
  union all select 'supplier_master', count(*) from supplier_master
  union all select 'store_master', count(*) from store_master
  union all select 'operation_log', count(*) from operation_log;"
```

Phase 0-3 の行数と一致すること。シーケンスの現在値も確認する:

```bash
psql "$LOCAL_CONN" -tAc "select 'operation_log seq=' || (select last_value from operation_log_id_seq) || ' max=' || (select max(id) from operation_log);"
```

`last_value < max(id)` なら次の INSERT が主キー衝突する。その場合のみ補正:

```sql
select setval(pg_get_serial_sequence('operation_log','id'), (select max(id) from operation_log));
```

**✅ 2026-08-23 検証結果: 全て一致。**

| テーブル | 行数 | 期待値 |
|---|---|---|
| group_master | 977 | ✅ |
| supplier_master | 209 | ✅ |
| store_master | 1 | ✅ |
| user_master | 26 | ✅ |
| operation_log | 2,779 | ✅ |

シーケンスは `operation_log seq=2779 max=2779` / `user_master seq=26 max=26` で
**補正不要**（`pg_restore` が `SEQUENCE SET` を含むため）。
制約・インデックスも全て復元（PK 5件、NOT NULL、`user_master_role_check`、
`user_master_username_key`、部分 UNIQUE index `user_master_entra_oid_key`）。

### 実データに対するアプリコードの読み取り検証（2026-08-23、書き込みなし）

- `users-store`: 26 ユーザー / admin 5 / `entra_oid` 保持 13 / `allowed_departments` は
  `text[]` が JS 配列として正しくパース。`findUserByEntraOid` と
  `findUserByAnyUsername`（大文字入力）の往復一致を確認
- 部門フィルタの件数が生の分布と完全一致:

| dept | groups | suppliers |
|---|---|---|
| 01 | 443 | 71 |
| 02 | 210 | 16 |
| 03 | 149 | 38 |
| 04 | 144 | 22 |
| 05 | 24 | 59 |
| 06 | 7 | 3 |

- `store_master` の有効店舗は **1件のみ**（`1001` Central Chaenwattana）。
  意図的か未取り込みか要確認。
- 操作ログ: 上限1000行に到達（全2,779行なので `truncated: true` が返る想定どおり）。
  `storage_path` 保持は 970 件。最新行は `sync_supplier`（2026-08-22 22:15 UTC）

---

## Phase 3: Cloud Run 設定変更

IAM: Cloud Run のサービスアカウントに Cloud SQL Client を付与。

```bash
export RUN_SA='<cloud-run-service-account>@<project>.iam.gserviceaccount.com'
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" --role='roles/cloudsql.client'
```

デプロイ（`--add-cloudsql-instances` が Auth Proxy ソケットを生やす）:

```bash
gcloud run deploy item-master-create-dev \
  --project="$PROJECT_ID" --region="$REGION" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${INSTANCE}" \
  --set-env-vars="INSTANCE_UNIX_SOCKET=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE},DB_USER=${DB_USER},DB_NAME=${DB_NAME},DB_POOL_MAX=4" \
  --set-secrets="DB_PASS=item-master-db-password:latest" \
  --max-instances=3 \
  --remove-env-vars=SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY
```

### プールサイズの制約（必ず満たすこと）

```
--max-instances × DB_POOL_MAX  +  保守用 psql  <  max_connections
```

`db-f1-micro`（`max_connections` = 25）での設定:

```
--max-instances=3  ×  DB_POOL_MAX=4  =  ピーク 12 接続
→ 残り 13 が Cloud SQL 内部 + superuser 予約(3) + 保守用 psql の余裕
```

ユーザー 26 人・Cloud Run の既定同時実行数 80 なので 3 インスタンスで足りる。
Cloud Scheduler の同期ジョブも同じ Cloud Run サービス経由なのでプールを共有し、追加接続は発生しない。
tier を上げた場合は `max_connections` が自動で増えるので、この式で再計算して両方の値を上げる。
Cloud Run は 1 インスタンスあたり最大 100 接続までという上限も別にある。

---

## Phase 4: 検証チェックリスト

- [ ] `/healthz` が 200
- [ ] ログイン（Entra ID）が通り、`role` / `allowed_departments` が復元されている
- [ ] 既存ユーザーで二重アカウントが作られていない（`select count(*) from user_master`）
- [ ] グループ／仕入先マスタが部門フィルタ付きで表示される（部門ごとに1つずつ確認）
- [ ] 店舗マスタが表示される（`active = true` のみ）
- [ ] xlsx 出力 → `operation_log` に行が増える → GCS にファイルが保管される
- [ ] 管理画面の操作ログ: 部門・日付範囲・フリーテキスト検索がそれぞれ効く
- [ ] 過去ログの再ダウンロード（signed URL リダイレクト）が動く
- [ ] マスタ手動インポート（xlsx アップロード）が通り、部門権限チェックが効く
- [ ] マスタエクスポート（xlsx ダウンロード）が通る
- [ ] BC 同期を `?dryRun=1` で実行 → 差分レポートが返る
- [ ] BC 同期を本番実行 → upsert 件数が返り、`operation_log` に `sync_*` が記録される
- [ ] Cloud Scheduler の 2 ジョブが成功する（group 日次 / supplier 毎時）
- [ ] 負荷をかけて接続枯渇が起きない（`max_connections` に対する余裕）

---

## Phase 5: 後片付け

1. Cloud Run から `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を削除（Phase 3 で実施済み）
2. Supabase プロジェクトは**すぐ消さない**。1〜2週間並走させ、問題なければ削除 → Pro 解約
3. `supabase_backup.dump` を安全な場所に退避（リポジトリには入れない）
4. **supplier 同期の頻度を毎時 → 日次に変更**（[docs/master-sync-setup.md](master-sync-setup.md)）。
   egress 問題の主犯候補であり、Cloud SQL でも無駄なクエリとして残る

---

## ローカル開発

`.env` に以下のいずれか:

```bash
# ローカル Postgres を使う
DATABASE_URL=postgresql://postgres:<password>@127.0.0.1:5432/item_import

# または Cloud SQL Auth Proxy 経由
DATABASE_URL=postgresql://app:<password>@127.0.0.1:5433/item_import
```

env が未設定なら DB 系エンドポイントは 503 を返し、ユーザーマスタは
`data/users.json` にフォールバックする（従来と同じ挙動）。

## 環境変数一覧（DB 関連）

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | libpq URL。指定時は他の DB_* を無視。ローカル開発／proxy 経由向け |
| `INSTANCE_UNIX_SOCKET` | `/cloudsql/<PROJECT:REGION:INSTANCE>`。Cloud Run 本番 |
| `DB_HOST` / `DB_PORT` | TCP 接続（Private IP など）。`DB_PORT` 既定 5432 |
| `DB_SSL` / `DB_CA_CERT` | TCP 時の TLS。`DB_SSL=1` で有効、`DB_CA_CERT` 未指定なら検証なし |
| `DB_USER` / `DB_PASS` / `DB_NAME` | 認証情報とデータベース名 |
| `DB_POOL_MAX` | プール上限。既定 5 |

削除された変数: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 残課題（今回のスコープ外）

1. **セッションストア**: `express-session` が既定の MemoryStore のままなので、
   Cloud Run の複数インスタンス／再起動でログインが切れる。`connect-pg-simple` で
   Postgres に載せるのが自然（Supabase の PostgREST 経由ではできなかったこと）。
2. **Node.js 20 は EOL**（2026-04-30）。`Dockerfile` の `node:20-alpine` を 22 系に上げる。
3. **`xlsx` の既知脆弱性**（prototype pollution / ReDoS、fix なし）。`npm audit` 既出。
   代替ライブラリ検討は別タスク。
4. **`master-sync` の差分方式**: 現状は毎回マスタ全件を読んで比較する。
   BC 側の更新日時フィルタで差分だけ取る方式に変えると無駄が消える。
