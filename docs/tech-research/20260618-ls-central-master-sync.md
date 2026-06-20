# 技術調査レポート: LS-Central (Business Central) マスタ自動連携

- **調査日**: 2026-06-18
- **調査対象**: BC データ取得 API 方式 (OData v4 web services / 標準 API v2.0 / カスタム API ページ), OAuth2 client credentials (S2S) 認証, Node.js 認証ライブラリ (@azure/identity, @azure/msal-node), Google Cloud Scheduler + Cloud Run Jobs, BC API レート制限
- **調査コンテキスト**: `create_item_import_system` の手動マスタ連携 (group / supplier / store を xlsx 手動アップロード) を、LS-Central (BC cloud SaaS) からの自動取得に置き換えたい。社内に実証済みの BC 連携実装 `get-item-sales` (OData v4 + 素の fetch + client credentials + Cloud Run Jobs) が存在する。

---

## 1. BC データ取得 API 方式

### 現行の 3 方式

| 方式 | エンドポイント | 位置づけ (2026) |
|---|---|---|
| **標準 API v2.0** | `/api/v2.0/companies({id})/<entity>` | **第一候補**。Microsoft 保守・バージョン管理済み・高速・webhook 対応。ただし**公開フィールドは限定的**（例: Customer は実テーブル 200+ 列中 27 列のみ） |
| **カスタム API ページ / API クエリ** | `/api/<publisher>/<group>/<version>/...` | 標準 API で足りないフィールド・エンティティ向け。**BC 側で AL 開発が必要**。OData ページより 30–50% 高速 |
| **OData v4 web services** | `/ODataV4/Company('..')/<service>` | ページを OData 公開する従来方式。**2027 Wave 1 で一部廃止**（下記） |

### ⚠️ 2027 Wave 1 (v30.0) の OData 廃止 — 正確な範囲

- **廃止されるもの**: **Microsoft 標準 (first-party) ページ**（Base Application / System Application / 1st-party アプリのページ）を OData エンドポイントとして公開する機能。
- **存続するもの**: **開発者が作成したカスタムページ**の OData 公開は引き続き可能。
- **代替**: API ページ / API クエリへの移行を Microsoft が強く推奨。
- **既知のギャップ**: Unbound Action は現状 OData 専用で REST 代替がまだ無い（本件には無関係）。
- **関連**: SOAP は既に BC 2025 Wave 1 (BC26) で Microsoft UI ページ上のものが非推奨化。

> **本件への含意**: 既存 `get-item-sales` は `/ODataV4/` 上の `workflowItems` / `ItemSalesPage` / `Barcodes` を使用。`ItemSalesPage` はカスタムページ（存続）だが、標準ページ由来のサービスがあれば 2027 までに移行が必要。**新規実装は標準 API v2.0 + カスタム API ページを優先**し、OData 新規依存は避けるのが将来安全。

---

## 2. OAuth2 client credentials (S2S) 認証

- **フロー**: Client Credentials（サービスプリンシパル、ユーザー操作なしの非対話バックグラウンド連携）。BC の S2S 認証として Microsoft 公式手順あり。
- **トークン**: `POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`、scope = `https://api.businesscentral.dynamics.com/.default`。
- **必要セットアップ**:
  1. Entra ID でアプリ登録 → Client ID / Tenant ID 取得
  2. クライアントシークレット（or 証明書）発行
  3. API permissions に BC 権限を付与し**管理者同意**
  4. **BC 側**: 「Microsoft Entra Applications」ページで当該アプリを登録し、権限セット（API アクセス用）を割当
- **セキュリティ**: 本番ではシークレットより**証明書**が推奨（Microsoft の identity platform security checklist）。最低でも Secret Manager 注入・期限管理。
- **実証**: `get-item-sales/src/bcAuth.js` が同フローを素の `fetch` + `URLSearchParams` で実装済み（外部ライブラリ不使用）。

---

## 3. Node.js 認証ライブラリ

| 選択肢 | 最新版 (2026-06) | Node 要件 | 評価 |
|---|---|---|---|
| **素の `fetch`** | — (Node 24 内蔵) | — | client credentials は token endpoint への単純 POST のみ。**ゼロ依存・実証済み (`get-item-sales`)**。トークンキャッシュは自前 |
| **@azure/identity** | **4.13.1** (2026-06-08) | `>=20` | `ClientSecretCredential` / `ClientCertificateCredential`。内部で MSAL を利用しトークンキャッシュ・更新を自動化。Azure SDK 連携前提の設計 |
| **@azure/msal-node** | **5.2.5** (2026-06-16) | `>=20` | `ConfidentialClientApplication.acquireTokenByClientCredential`。認証プロトコルを細かく制御したい場合。`@azure/identity` の内部実装でもある |

- ローカル Node: **v24.14.0**（いずれのライブラリの Node 要件も満たす）。
- **判断**: バッチ（1 実行 1 トークン）は素の fetch で十分・既存踏襲が最良。**オンデマンド取得（リクエスト毎にトークンが要る）にはトークンキャッシュが重要**なので、`@azure/identity` (`ClientSecretCredential`) でキャッシュを任せるか、自前で簡易キャッシュを持つ。新規依存を避けるなら自前キャッシュ + 素の fetch。

---

## 4. スケジュール実行基盤 (GCP)

- **実証パターン**: Cloud Scheduler (cron) → **Cloud Run Jobs**（永続デーモンではなくステートレスな単発コンテナ）。`get-item-sales` が sync 種別ごとに `main()` を分離（`sync.js` / `syncCosts.js` / `syncMaster.js`）し独立スケジュール・失敗分離。
- **ベストプラクティス**:
  - シークレットは Secret Manager 注入（コードに埋めない）。
  - 終了コード 0/1 で成否を表現 → Cloud Scheduler / Cloud Monitoring でアラート。
  - 構造化 JSON ログを stdout → Cloud Logging が自動取込。
  - HTTP は必ずリトライ層経由（`get-item-sales/src/httpRetry.js`: 3 回・指数バックオフ + ジッター・408/429/5xx 対象）。
- **本件の選択肢**:
  - **バッチ（日次マスタ）**: Cloud Run Job + Cloud Scheduler を新規追加（`get-item-sales` 流）。
  - **オンデマンド（商品マスタ検索）**: 既存の Express サーバ (Cloud Run **service**) に BC プロキシ API を追加し、リクエスト時にライブ取得。新規ジョブ不要。

---

## 5. レート制限・ページング・スロットリング

- **レート制限**: 本番 **600 req/min**、サンドボックス 300 req/min。超過時 `429 Too Many Requests`。
- **実行時間上限**: 1 リクエスト **10 分**。超過で `504 Gateway Timeout` → リクエスト分割で対応。
- **429 対応**: 指数バックオフ + クールオフ必須。タイトループ即時リトライ禁止。
- **ページング**: 大規模データは `@odata.nextLink` を**必ず追従**（`$top/$skip` 手動実装より推奨）。
- **ペイロード削減**: `$select`（必要列のみ）、`$filter`（`lastModifiedDateTime gt ...` で差分取得）、`$expand`（関連エンティティ同時取得）、`$batch`（複数操作を 1 リクエスト）。
- **push 化**: ポーリングより **webhooks（subscriptions）** が推奨。変更時のみ通知。

---

## 総合判断

### 推奨構成（新規連携）

1. **認証**: client credentials (S2S) を `get-item-sales` から踏襲。バッチは素の fetch、オンデマンドは `@azure/identity@4.13.1` の `ClientSecretCredential` でトークンキャッシュ（or 自前キャッシュ）。本番は将来的に証明書認証へ。
2. **API 方式**: **標準 API v2.0 を第一候補**（`vendors`, `items` 等）。標準で取れないフィールド/エンティティ（多言語名・LS Central 固有: 商品グループ THA/JPN、店舗マスタ、仕入先の略称/タイ語名）は**カスタム API ページ**を新設 or 既存 OData サービス（カスタムページ由来なら存続）を再利用。**OData の新規依存は避ける**。
3. **実行形態（ハイブリッド）**:
   - group / supplier / store → **Cloud Run Job + Cloud Scheduler 日次バッチ** → Supabase upsert。データ小・更新緩やか。
   - 商品マスタ → **既存 Express に BC プロキシ API を追加しオンデマンド取得**（`$filter`/`$select` で必要分のみ、`@odata.nextLink` 追従、トークン & 短 TTL キャッシュ）。大規模・高頻度更新のため全件同期しない。
4. **レート制限対策**: リトライ層（指数バックオフ・429/5xx）、`$select`/`$filter`、差分取得（`lastModifiedDateTime`）、ページング追従を全 BC 呼び出しに適用。

### 最大のリスク / 未確定事項（設計フェーズで要確認）

- **🔴 BC 側エンティティ/フィールドの提供状況**: supplier の略称・タイ語名、商品グループの THA/JPN 説明、LS Central 店舗マスタが、標準 API v2.0 で取得可能か、**カスタム API ページの AL 開発が必要か**が未確定。**BC 管理者/パートナーとの調整が必須**。これが本件のクリティカルパス。
- **既存 OData サービスの再利用可否**: `get-item-sales` が叩く `workflowItems` / `ItemSalesPage` / `Barcodes` を本アプリからも参照できるか（権限セット・公開範囲）。再利用できればマスタ取得の一部は即実装可能。
- **商品マスタの用途**: 本アプリは新規商品を「作る」側。既存商品マスタを読む目的（重複チェック / 参照コピー / PLU 検証 等）により、オンデマンド API のクエリ設計（検索キー: 商品番号 / バーコード / 名称）が変わる。
- **認証情報の分離**: 既存 BC アプリ登録を共用するか、本アプリ用に新規アプリ登録するか（権限最小化・監査の観点）。

---

## 実地調査結果（公開 OData 棚卸し, 2026-06-18 追記）

device-code probe で本番テナント（company "LOPIA (Thailand) Co., Ltd."）の `$metadata` を取得し、**122 の OData entity set が公開済み**であることを確認。当初「多言語フィールドは OData 非公開」としたが、それは `get-item-sales` が使う `workflowItems`/標準 API v2.0 のみの話で、**LS Central の `Retail_*` / `*_Excel`(CTZ_* カスタム項目) ページが THA/JPN 込みで公開されている**ことが判明。**結論: マスタ自動連携は既存 OData 再利用で実現可能・BC 側 AL 開発不要。**

### マスタ → 既存 OData サービス 確定マッピング

| アプリのマスタ | 列 | 取得元サービス（既存公開） | フィールド | 判定 |
|---|---|---|---|---|
| **group_master** | product_group_code / description / description_tha / description_jpn | **`Retail_Product_Groups_Excel`** | `Code` / `Description` / `CTZ_Description_2`[TH] / `CTZ_Description_3`[JP] | ✅ 完全 |
| **supplier_master** | supplier_no / abbreviation / name_eng / name_tha | **`Retail_Vendor_Card_Excel`**（or `Vendor_Card_Excel`） | `No` / `Search_Name` / `Name` / `CTZ_Name_3`[TH] | ✅ 完全 |
| **store_master** | store_code / store_name / store_name_eng | `Store_Card_Excel*`（サブページ0行）/ 標準API `locations`（名称1つ） | 未確定 | ⚠️ 要追加確認 |
| **item系**（計量器/編集/重複/PLU） | — | `Retail_Item_Excel`（`PPScaleItem` 計量器フラグ・Retail_Product_Code・価格/原価・Vendor_No・Tare_Weight）, `Retail_Barcode_Excel`（`ItemDescriptionTHA`[TH]/`ItemDescriptionJPN`・Barcode_No・Retail_Product_Code）, `Item_Units_of_Measure_Excel`（`CTZ_Size_Specification_ENG/THA/JPN`） | — | ✅ 豊富 |

### 設計上の注意（実地調査を踏まえ更新）

- **2027 Wave1 廃止回避**: `Retail_*` は LS Central（サードパーティ）カスタムページ＝廃止対象外で将来安全。`*_Excel`（Vendor_Card_Excel 等の Microsoft 標準ページ由来）に依存する場合は 2027 移行を追跡。**マスタ取得は `Retail_*` 系を優先**。
- **本番認証**: 探索は device-code（委任）で実施したが、無人バッチは **S2S client credentials** を使用。S2S アプリ（Entra）に、上記ページ読取を許す **BC 権限セット**の割当が必要（設定のみ・AL 不要）。`get-item-sales` の S2S アプリを再利用 or 権限追加。
- **パフォーマンス**: `Vendor_Card_Excel` は ~120 列。`$select` で必要列のみ取得（No/Name/CTZ_Name_3/Search_Name 等）。
- **store_master の穴**: 専用の店舗マスタ OData が未確認（Store Card サブページは 0 行、`locations` は名称1言語）。店舗は少数・静的なので、追加プローブで Store 系ページを特定 or `locations`+英語名手動のハイブリッドで対応。

### 情報源

- [API page type - Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-api-pagetype)
- [Developing a custom API - Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-develop-custom-api)
- [Using S2S Authentication - Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/automation-apis-using-s2s-authentication)
- [Using OAuth to authenticate Web Services - Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/webservices/authenticate-web-services-using-oauth)
- [Working with API Limits - Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/dynamics-rate-limits) (ms.date 2024-11-13)
- [BC 2027 Wave 1: Deprecate OData on Microsoft Pages (dynamicscommunities)](https://dynamicscommunities.com/ug/dynamics-business-central-nav-ug/business-central-2027-release-wave-1-say-goodbye-to-odata-on-microsoft-pages/)
- [Get Ready: BC Will Deprecate OData Page Endpoints in 2027 (eONE)](https://www.eonesolutions.com/blog/business-central-will-deprecate-odata/)
- [OData Deprecation: Integration Architecture (TharangaC, 2026-04)](https://tharangac.com/2026/04/business-central-odata-deprecation-integration-architecture.html)
- [@azure/identity - npm](https://www.npmjs.com/package/@azure/identity) (v4.13.1)
- [@azure/msal-node - npm](https://www.npmjs.com/package/@azure/msal-node) (v5.2.5)
- [Microsoft BC API Integration Guide 2026 (Apideck)](https://www.apideck.com/blog/microsoft-dynamics-business-central-api-integration-guide-2025)
