# 技術調査レポート: Supabase → Cloud SQL for PostgreSQL 移行

- **調査日**: 2026-08-23
- **調査対象**: Cloud SQL for PostgreSQL, Cloud Run ↔ Cloud SQL 接続方式, node-postgres (pg), Cloud SQL Node.js Connector, コネクションプーリング, Database Migration Service / pg_dump, 代替 (Supabase Pro / Neon / AlloyDB)
- **調査コンテキスト**: 本番 Supabase プロジェクトが egress クォータ超過 + spend cap により停止し、ログイン不可（`/auth/callback` が 500）。恒久対策として Cloud SQL への移行を検討。

---

## 0. 現状アプリの Supabase 依存度（コード調査結果）

| 項目 | 結果 |
|---|---|
| 使用テーブル | `user_master`, `group_master`, `supplier_master`, `store_master`, `operation_log`（5個） |
| 使用している Supabase API | **PostgREST データアクセスのみ**（`.from().select/insert/upsert/update`） |
| Supabase Auth | **未使用**（Microsoft Entra ID OIDC） |
| Supabase Storage | **未使用**（エクスポート xlsx は GCS = `GCS_EXPORTS_BUCKET`） |
| Realtime / Edge Functions / RPC | **未使用** |
| 使用クエリ演算子 | `select, eq, order, single, maybeSingle, upsert, update, insert, limit, like, range, or, gte, lte` — すべて素の SQL で表現可能 |
| Supabase 参照箇所 | `server.js`, `users-store.js`, `master-sync.js` の 62 箇所 |
| 既存 DDL | `docs/db/001〜003` は **差分マイグレーションのみ**。ベースラインの `CREATE TABLE` は存在せず、スキーマ定義の正本は Supabase 上にしかない ⚠️ |

**結論**: ベンダーロックインは実質ゼロ。移行は「データアクセス層の差し替え」に限定される。

---

## 1. Cloud SQL for PostgreSQL

### 基本情報
- **サポート版**: PostgreSQL 9.6 〜 **18**（18 が新規インスタンスのデフォルト）
- **エディション**: Enterprise / Enterprise Plus（Enterprise Plus は専用コア 2 vCPU 以上が下限、共有コア不可）
- **マイナーバージョン**: コミュニティ GA から 30 日以内に追随、メンテナンスウィンドウで自動アップグレード
- **公式**: https://cloud.google.com/sql/docs/postgres

### バージョン別サポート期限

| メジャー | Cloud SQL 上のマイナー | 拡張サポート開始 | 廃止 (Deprecation) |
|---|---|---|---|
| 18 | 18.4 | — | — |
| **17** | 17.10 | 2030-02-01 | 2033-02-01 |
| 16 | 16.14 | 2029-02-01 | 2032-02-01 |
| 15 | 15.18 | 2028-02-01 | 2031-02-01 |
| 14 | 14.23 | 2027-02-01 | 2030-02-01 |
| 13 | 13.23 | 2026-02-01（済） | 2029-02-01 |

### 推奨アクション

> **2026-08-23 修正: 当初 17 を推奨したが 18 に変更した。**
> 移行作業を行う端末に **PostgreSQL 18.3 の `pg_dump` / `psql` / `pg_restore` が既にインストールされている**ことを確認したため。
> `pg_dump` は「自身より古いサーバ向けの出力」を保証しないので、**ダンプ生成ツールのバージョンをリストア先に合わせる**のが安全側。
> ソース（Supabase 15/17）を pg_dump 18 で読むのは正式サポート範囲であり、問題は生じない。

- **PostgreSQL 18 を採用**。理由:
  - ローカルの pg_dump / psql が 18.3 → ダンプ生成とリストア先のメジャーが一致
  - Cloud SQL の新規インスタンスのデフォルトであり、実績・情報量が多い
  - サポート期限が最も長い
- 17 でも可（拡張サポート 2030-02 / 廃止 2033-02）。その場合は **pg_dump 17 を用意すること**。
- ⚠️ 13 以下は既に拡張サポート（有償）に入っているため選択不可。

---

## 2. Cloud Run → Cloud SQL 接続方式

3方式ある。本アプリの規模・要件での評価:

| 方式 | 仕組み | VPC 必要 | 追加コスト | 評価 |
|---|---|---|---|---|
| **A. Unix ソケット（Cloud Run 組込み Cloud SQL 連携）** | `--add-cloudsql-instances` を付けると Auth Proxy が `/cloudsql/<INSTANCE_CONNECTION_NAME>` にソケットを生成。TLS 自動 | 不要 | なし | ⭕ **推奨（第1段階）**。設定が環境変数＋フラグだけで済む |
| **B. Cloud SQL Node.js Connector** | `@google-cloud/cloud-sql-connector` が `pg.Pool` に TLS 済みオプションを注入。IAM DB 認証（`authType:'IAM'`）が使える | 不要（PUBLIC 指定時） | なし | ◯ パスワードレス化したい場合。`connector.close()` の後始末が必要 |
| **C. Private IP + Direct VPC egress** | Cloud Run から VPC へ直接 egress（GA、旧 Serverless VPC Access コネクタより高速・安価・コネクタ VM 不要） | 必要 | VPC 設定・運用 | △ 公開 IP を一切持たせない要件が出た場合の将来オプション |

**共通の必須設定**
- Cloud Run のサービスアカウントに **`roles/cloudsql.client`** を付与（Cloud SQL が別プロジェクトなら DB 側プロジェクトで付与）
- Linux の Unix ソケットパス上限 108 文字に注意（方式 A）
- **Cloud Run の 1 インスタンスあたり DB 接続は最大 100**

**推奨**: **方式 A（Unix ソケット）で開始**。公開 IP は付くが「承認済みネットワークを空」にすれば Auth Proxy / IAM 経由以外は到達不可。セキュリティレビューで公開 IP 自体が NG になった時点で C へ移行（アプリ側は接続設定の差し替えのみ）。

---

## 3. Node.js クライアント選定

### 候補比較

| 候補 | 最新 | 評価 |
|---|---|---|
| **`pg` (node-postgres)** | **8.23.0**（pipelining 対応追加。8.22 で PG17+ の `sslnegotiation=direct` 対応） | ⭕ **推奨**。デファクト、依存が薄い、Cloud SQL 公式サンプルも pg 系 |
| `postgres.js` | 3.x | ◯ 高速・簡潔だが API が独自。既存コードからの移植メリットが薄い |
| Kysely | 0.28 系 | ✕ 型安全が主価値。**本プロジェクトは素の JS（TS 未導入）なので価値が出ない** |
| Drizzle ORM | 0.4x 系 | ✕ 同上 + スキーマ定義の二重管理とビルド工程の追加 |

### `pg` のバージョン注意点
- **`pg@9.0` は 2026 年に議論中だが CHANGELOG 上は未リリース**（最新は 8.23.0）。予告されている破壊的変更:
  - **query queue の廃止**（同一 client で in-flight クエリがあるまま新規クエリを積む動作。8.x で deprecation warning 化予定）
  - promise ライブラリを組込み Promise に統一
- ⚠️ 対策: **`"pg": "^8.23.0"` でピン**し、9.x への自動追随を避ける。Pool を使い client を直接使い回さない実装にしておけば query queue 廃止の影響を受けない。
- `pg@8.0` 時点の破壊的変更（既に既定）: SSL が `rejectUnauthorized: true` デフォルト、`pg.connect` などシングルトン API 削除。

### 推奨構成
- **`pg` 8.23.x + 素の SQL（パラメータ化クエリ）**、ORM なし
- `users-store.js` と同じパターンで **薄いデータアクセスモジュール**（例 `db.js`）を作り、`server.js` からは `query()` / `queryOne()` のみ呼ぶ

---

## 4. コネクションプーリング（Cloud Run 特性）

Cloud Run は水平スケールするため「インスタンス数 × プールサイズ」が DB の `max_connections` を超えないよう設計する必要がある。

- Cloud SQL の `max_connections` 既定値は **インスタンスメモリに連動**（リサイズで自動追随。フラグで固定すると自動調整されない）
- 共有コア（`db-f1-micro` 0.6GiB）は `max_connections` が小さい ⚠️ **実値は要確認**
- Managed Connection Pooling (MCP) は **Enterprise Plus 限定** → 共有コアでは使えない

**設計指針**
1. `pg.Pool` を **モジュールレベルで 1 個だけ生成**（リクエスト毎生成は禁止）
2. `pool.max` を小さく（例 **3〜5**）、`idleTimeoutMillis` を短く（例 10s）して idle 接続を溜めない
3. **Cloud Run の `--max-instances` を明示的に上限設定**（例 5）。`max-instances × pool.max + 同期ジョブ分 < max_connections` を満たすこと
4. `connectionTimeoutMillis` を設定し、枯渇時に無限待ちしない
5. Cloud Scheduler 起点の同期処理も同じプールを共有する

---

## 5. データ移行手段

| 手段 | 適性 |
|---|---|
| **`pg_dump` / `pg_restore`（推奨）** | 本件はデータ量が小さく、ダウンタイム許容可能（社内システム）。`pg_dump --no-owner --no-acl` でスキーマ＋データを取得し Cloud SQL に流す。Supabase 側は **Supavisor の session mode** 経由が推奨 |
| Database Migration Service (DMS) | 論理レプリケーションで無停止移行。本件は規模的に過剰。接続プロファイル作成と Supabase 側の replication 設定が必要 |
| 第三者ツール (DBConvert 等) | 不要 |

### 🚨 移行の前提条件（ブロッカー）
**現在 Supabase プロジェクトは restricted 状態のため、`pg_dump` も実行できない可能性が高い。またダンプ自体が egress を消費する。**
→ **移行作業の前に、spend cap 解除 or Pro 化 or 課金サイクルのリセットで一度サービスを復旧させる必要がある。**

さらに `docs/db/` に **ベースライン DDL が無い**ため、スキーマの正本は Supabase 上のみ。復旧できるうちに **`pg_dump --schema-only` を取得してリポジトリに `docs/db/000_baseline.sql` として保存する**ことを最優先で行うべき。

### 移行時の注意点
- Supabase 固有スキーマ（`auth`, `storage`, `extensions` 等）は**除外**し、`public` スキーマのみ移行（`--schema=public`）
- RLS ポリシーは本アプリで未使用（service role キーで全アクセス）だが、ダンプに含まれる場合は落とす
- `operation_log.storage_path` が指す GCS オブジェクトは **移行対象外**（GCS 側は無変更で継続利用可）
- ID 列が `identity` / `serial` の場合、リストア後に**シーケンスの現在値**を確認

---

## 6. 料金比較（2026-08 時点、参考値）

| 選択肢 | 月額（エントリ構成） | Egress | SLA | 備考 |
|---|---|---|---|---|
| **Cloud SQL `db-f1-micro`** (0.2 vCPU / 0.6GiB) | **約 $11〜12**（us-central1 基準。**Tokyo は割高、要計算機確認**）+ SSD ストレージ + バックアップ | **同一リージョンの Cloud Run ↔ Cloud SQL は無料** | ⚠️ **共有コアは SLA 対象外・確約利用割引対象外** | |
| Cloud SQL `db-g1-small` (1.7GiB) | 約 $26（us-central1） | 同上 | 同上（共有コア） | 接続数の余裕が出る |
| Cloud SQL 専用コア 1vCPU〜 | $50 前後〜 | 同上 | ⭕ SLA 対象 | 業務システムとして本来はここ |
| Supabase Pro（現状の延長） | **$25** | 250GB/月込み | — | 運用ゼロ、cap 解除で即復旧 |
| Neon | 従量（$0.106/CU-h〜、無料枠あり） | — | — | GCP 外、Entra/GCS と別請求 |
| AlloyDB | 約 $144 | — | ⭕ | 本件には過剰 |

⚠️ **Tokyo (asia-northeast1) の正確な単価は公開ページの一覧に無く、Google Cloud 料金計算ツールでの確認が必要**（本レポートでは断定しない）。

---

## 7. 総合判断

### 推奨構成

```
Cloud Run (asia-northeast1)
  └─ Unix socket (--add-cloudsql-instances)
       └─ Cloud SQL for PostgreSQL 18, Enterprise edition
          machine: db-g1-small（接続数余裕を優先）/ 最小構成なら db-f1-micro
          region: asia-northeast1（Cloud Run と同一 → egress 無料）
          public IP + 承認済みネットワーク空、自動バックアップ有効、PITR 有効

アプリ側:
  pg ^8.23.0（ORM なし、素のパラメータ化クエリ）
  db.js — モジュール単一 Pool（max 3〜5 / idleTimeout 10s / connectionTimeout 5s）
  server.js / users-store.js / master-sync.js の Supabase 呼び出しを db.js 経由に置換
```

### メリット
- **egress クォータによる突然の全停止が構造的に消える**（同一リージョン通信は無料・従量課金なし）
- GCP 内で請求・IAM・監視（Cloud Monitoring / Logging）が一元化
- 将来 Private IP 化・HA 化・レプリカ追加の選択肢がある
- Supabase の PostgREST 層が消え、`LIKE` による部門フィルタなどを素の SQL で最適化できる

### デメリット / リスク（批判的レビュー）
1. **コスト削減にはならない**。最小の `db-f1-micro` でようやく Supabase Pro（$25）より安いが、その構成は **SLA 対象外**。SLA 付き専用コアにすると Supabase Pro より高くなる。**移行の正当化理由は「コスト」ではなく「停止リスクの構造的排除と GCP 統合」**である点を明確にすべき。
2. **運用負荷が増える**。バックアップ検証、メンテナンスウィンドウ、メジャーバージョンアップグレード、接続数監視が自社責任になる。
3. **ベースライン DDL が存在しない**ため、Supabase が復旧しないとスキーマを正確に再現できない。→ 復旧直後に `pg_dump --schema-only` を取得することが移行成否の分岐点。
4. **`max_connections` 設計を誤ると Cloud Run のスケール時に接続枯渇で全リクエスト失敗する**。共有コアは MCP 非対応なのでアプリ側プール設計が唯一の防衛線。
5. **移行と無関係に egress 削減は必要**。Supabase 側の主犯候補（supplier 同期が毎時 `supplier_master` 全件 SELECT）は、Cloud SQL でも「無駄なクエリ」として残る。移行のついでに日次化・差分化すべき。
6. `express-session` が既定の MemoryStore のまま → Cloud Run 複数インスタンス／再起動でセッション消失。**DB 移行と同時に `connect-pg-simple` でセッションを Postgres に置くのが自然**（Supabase 時代は PostgREST 経由でこれができなかった）。移行の副次的メリット。

### 代替案（採用しない場合）
- **Supabase Pro に留まる（$25/月）**: 移行コストゼロ、運用ゼロ。egress 250GB/月で本アプリなら十分な余裕。**「まず Pro 化して止血し、egress 削減を実施、それでも問題が残る／GCP 統合したいなら移行」という順序が最も安全**。
- Neon: GCP 外になり請求・ネットワークが分散するため、GCP 統合という移行動機と矛盾する。

---

## 情報源

- [Cloud SQL for PostgreSQL — Database versions and version policies](https://docs.cloud.google.com/sql/docs/postgres/db-versions)
- [Connect from Cloud Run — Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/connect-run)
- [Cloud SQL Node.js Connector (GitHub)](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector)
- [@google-cloud/cloud-sql-connector (npm)](https://www.npmjs.com/package/@google-cloud/cloud-sql-connector)
- [node-postgres CHANGELOG](https://github.com/brianc/node-postgres/blob/master/CHANGELOG.md)
- [pg@9.0 breaking changes discussion](https://github.com/brianc/node-postgres/discussions/3598)
- [Manage database connections — Cloud SQL](https://docs.cloud.google.com/sql/docs/postgres/manage-connections)
- [Managed Connection Pooling overview](https://docs.cloud.google.com/sql/docs/postgres/managed-connection-pooling)
- [Direct VPC egress for Cloud Run is now GA](https://cloud.google.com/blog/products/serverless/direct-vpc-egress-for-cloud-run-is-now-ga/)
- [Migrate to Cloud SQL for PostgreSQL with Database Migration Service](https://docs.cloud.google.com/database-migration/docs/postgres/quickstart)
- [Cloud SQL pricing](https://cloud.google.com/sql/pricing)
- [Google Cloud SQL Pricing — every machine type (Bytebase)](https://www.bytebase.com/dbcost/cloudsql-pricing/)
- [PostgreSQL Hosting Options in 2026: Pricing Comparison (Bytebase)](https://www.bytebase.com/blog/postgres-hosting-options-pricing-comparison/)
