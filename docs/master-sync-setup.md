# マスタ自動連携 (LS-Central → Supabase) セットアップ

LS-Central (Business Central, cloud SaaS) の公開 OData web service から分類マスタ・仕入先マスタを取得し、Supabase に upsert する。手動 xlsx アップロードを置き換える。店舗マスタ (store_master) は現状スコープ外（手動アップロード継続）。

- **group_master** ← `Retail_Product_Groups_Excel`（**日次**バッチ）
- **supplier_master** ← `Retail_Vendor_Card_Excel`（**毎時**バッチ）
- **手動実行**: 管理モーダル → マスタ管理タブ → 「今すぐ同期 (LS-Central)」ボタン（管理者のみ）

技術背景・調査根拠: [docs/tech-research/20260618-ls-central-master-sync.md](tech-research/20260618-ls-central-master-sync.md)。連携実装は `bc-client.js`（認証・OData）+ `master-sync.js`（マッピング・upsert）+ `server.js`（エンドポイント）。

## フィールドマッピング（2026-06-18 実テナント確認）

| Supabase 列 | OData サービス / フィールド |
|---|---|
| `group_master.product_group_code` | `Retail_Product_Groups_Excel.Code` |
| `group_master.description` | `.Description` |
| `group_master.description_tha` | `.CTZ_Description_2` |
| `group_master.description_jpn` | `.CTZ_Description_3` |
| `supplier_master.supplier_no` | `Retail_Vendor_Card_Excel.No` |
| `supplier_master.abbreviation` | `.Search_Name` |
| `supplier_master.name_eng` | `.Name` |
| `supplier_master.name_tha` | `.CTZ_Name_3` |

> ✅ **検証済み (2026-06-18, 実テナント read-only)**: group 977 件（tha 100% / jpn 99.7%）、supplier 201 件（name_eng は ascii 200・Thai 0、name_tha は Thai 172・空 29）。`Name`→name_eng / `CTZ_Name_3`→name_tha の対応は正しい。`abbreviation`(=`Search_Name`) は大文字の社名が入る点のみ既存運用と要すり合わせ。

## 必要な環境変数

| 変数 | 説明 |
|---|---|
| `BC_AUTH_MODE` | `refresh_token`（現行）/ `client_credentials`（S2S）。既定 `client_credentials` |
| `BC_TENANT_ID` | Entra テナント GUID |
| `BC_CLIENT_ID` | refresh_token: device-code を取得したパブリッククライアント ID／S2S: アプリの Client ID |
| `BC_CLIENT_SECRET` | **S2S 時のみ必須**（refresh_token では不要） |
| `BC_REFRESH_TOKEN_FILE` | refresh_token・ローカル/検証用。トークンを置くファイル（例 `.bc-refresh-token`、gitignore 済み） |
| `BC_REFRESH_TOKEN_SECRET` | refresh_token・本番用。Secret Manager リソース名 `projects/<proj>/secrets/<name>`。ローテーション時に書き戻される |
| `BC_ENVIRONMENT` | 既定 `Production` |
| `BC_COMPANY_NAME` | 例: `LOPIA (Thailand) Co., Ltd.`（スペース込みそのまま・クォート不要） |
| `BC_SCOPE` | 省略可。既定 `https://api.businesscentral.dynamics.com/.default` |
| `MASTER_SYNC_TOKEN` | Cloud Scheduler → 同期エンドポイント用の共有トークン（Secret Manager 推奨） |

未設定時はエンドポイントが `503 bc_not_configured` を返し、UI には「LS-Central 接続が未設定」と表示される（既存機能には影響なし）。

## 認証方式

### 現行: 委任 refresh_token（`get-item-sales` ジョブと同方式・2026-06-18 エンドツーエンド検証済み）

S2S の管理者同意が未取得のため当面は委任の refresh_token を使用。

1. device-code で本アプリ**専用**のリフレッシュトークンを取得（`get-item-sales` のトークンは流用しない）。
2. ローカル/検証: `BC_AUTH_MODE=refresh_token` ＋ `BC_REFRESH_TOKEN_FILE=.bc-refresh-token`。本番(Cloud Run): `BC_REFRESH_TOKEN_SECRET` に Secret Manager リソース名を指定し、トークンをそのシークレットに seed。
3. `BC_CLIENT_ID` はパブリッククライアントの ID（`BC_CLIENT_SECRET` 不要）。

> ⚠️ 委任トークンはパスワード変更・MFA・条件付きアクセス・**90日無操作**で失効し、都度 device-code 再 seed が必要。supplier は毎時実行のため通常は失効しないが単一障害点。
> ⚠️ 常駐 multi-instance ではトークン更新が競合し得る。`min-instances=1` 等で緩和、または本番は単発 Cloud Run Job 化／S2S 化を検討。
> 本番で `BC_REFRESH_TOKEN_SECRET` を使う場合、実行 SA に `roles/secretmanager.secretAccessor` ＋ 新バージョン書込（`roles/secretmanager.secretVersionAdder`）が必要。

### 推奨(将来): S2S (client credentials)

無人連携には本来 S2S が最適。`BC_AUTH_MODE=client_credentials` ＋ `BC_CLIENT_SECRET`。

1. Entra でアプリ登録 → Client ID / シークレット発行
2. API のアクセス許可 → Dynamics 365 Business Central → **アプリケーションの許可** → **管理者同意**（これが従来の関門）
3. BC「Microsoft Entra アプリケーション」で Client ID 登録（State=Enabled）＋**権限セット**割当（SUPER 不可）。`Retail_Product_Groups_Excel` と `Retail_Vendor_Card_Excel` を読めること。

> `Retail_*` は LS Central のカスタムページ＝2027 Wave1 の OData 廃止対象外（将来安全）。

## エンドポイント

| メソッド / パス | 認証 | 用途 |
|---|---|---|
| `POST /api/admin/masters/sync/:type` (`type`=`group`\|`supplier`) | 管理者セッション **or** `X-Sync-Token` ヘッダ | 同期実行（手動ボタン / Scheduler 共用） |
| `GET /api/admin/masters/sync/status` | 管理者セッション | マスタタブの最終同期状況表示 |

監査は `operation_log`（`action` = `sync_group` / `sync_supplier`、`item_count` = upsert 件数）に記録。

## Cloud Scheduler 設定（本番）

Cloud Run service の URL を `RUN_URL`、共有トークンを `MASTER_SYNC_TOKEN` として:

```bash
# group: 毎日 02:30 (Asia/Bangkok)
gcloud scheduler jobs create http master-sync-group \
  --schedule="30 2 * * *" --time-zone="Asia/Bangkok" \
  --uri="${RUN_URL}/api/admin/masters/sync/group" --http-method=POST \
  --headers="X-Sync-Token=${MASTER_SYNC_TOKEN}" \
  --attempt-deadline=600s

# supplier: 毎時 15分 (Asia/Bangkok)
gcloud scheduler jobs create http master-sync-supplier \
  --schedule="15 * * * *" --time-zone="Asia/Bangkok" \
  --uri="${RUN_URL}/api/admin/masters/sync/supplier" --http-method=POST \
  --headers="X-Sync-Token=${MASTER_SYNC_TOKEN}" \
  --attempt-deadline=600s
```

> 代替案（より堅牢）: 共有トークンの代わりに Cloud Scheduler の OIDC トークン（`--oidc-service-account-email`）で認証し、ミドルウェアで検証する方式。今回は実装簡素化のため共有トークン方式を採用。

## 設計メモ

- **upsert のみ**（BC で消えた行はローカル削除しない＝非破壊。既存の手動インポートと同一挙動）。
- アクセストークンはサーバ内メモリにキャッシュ（有効期限60秒前に更新）。
- OData は `@odata.nextLink` 追従でページング、`$select` で必要列のみ取得。429/5xx は指数バックオフでリトライ。
- 反映は SPA の sessionStorage キャッシュをクリアして再取得（手動同期後は即時反映）。
