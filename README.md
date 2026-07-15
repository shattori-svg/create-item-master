# 商品登録 取り込みファイル作成システム

基幹システム向けの商品登録インポートファイル（.xlsx）を作成する Web アプリです。  
グロサリー部門のメーカーバーコード商品を対象とし、日本語・タイ語に対応しています。

## ドキュメント

- [要件定義書](./要件定義書.md)
- [基本設計書](./基本設計書.md)
- [ユーザーマニュアル（日本語）](./docs/ユーザーマニュアル.md)
- [คู่มือการใช้งาน (タイ語)](./docs/คู่มือการใช้งาน.md)

## 開発の動かし方

### 必要環境

- Node.js 18+
- npm

### セットアップと起動

```bash
cd create_item_import_system
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

### ビルド（本番用）

```bash
npm run build
```

`dist/` に静的ファイルが出力されます。任意の Web サーバーで配信できます。

### 認証付きサーバー起動（Entra ID）

本番同等の認証付き起動は次を使います。

```bash
npm run build
npm run start
```

`http://localhost:8080` で起動します。

必須環境変数（Entra ID 有効化）:

- `ENTRA_CLIENT_ID`
- `ENTRA_CLIENT_SECRET`
- `ENTRA_TENANT_ID`
- `ENTRA_REDIRECT_URI`
- `SESSION_SECRET`（推奨: 32文字以上ランダム）

任意:

- `ENTRA_TENANT_GUID`
- `ENTRA_ALLOWED_DOMAIN`（カンマ区切りで複数ドメイン可。例: `g.oic-sys.net,oic-g.com`。空なら全許可）
- `USERS_FILE`（既定: `data/users.json`）
- `PORT`（既定: `8080`）

### Cloud Run へのデプロイ

gcloud CLI でログイン・プロジェクト設定済みの状態で実行します。

**Linux / macOS（Cloud Shell 可）:**

```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows（PowerShell）:**

```powershell
.\deploy.ps1
```

環境変数で上書き可能です。

- `GCP_PROJECT_ID` … プロジェクト ID（未設定時は `gcloud config get-value project`）
- `GCP_REGION` … リージョン（既定: `asia-northeast1`）
- `CLOUD_RUN_SERVICE` … サービス名（既定: `item-master-create-dev`）

## 構成（Phase1）

- **フロント**: 単一画面（SPA 相当）。Vite + バニラ JS。
- **Excel**: SheetJS (xlsx) でブラウザ上で .xlsx の生成・読み取り。
- **多言語**: `src/locales/ja.json`, `th.json`。
- **マスタ**: 分類・仕入先は **Google スプレッドシート**（lopia thailand item import master）のシート「group」「supplier」から取得。API キー未設定時はサンプルデータを使用。
- **データ**: 入力済み商品リストはメモリのみ。復元は「読込」でインポートファイルを読み込んで行います。

## 主な機能

1. 部門のドロップダウン選択（01–06）
2. 分類・仕入先の検索可能コンボボックス（名称・コードで検索）
3. 入力フォーム（規格初期値 1pcs、販売入数初期値 1、税率初期値 7%）
4. 販売入数 2 以上で「ケースJANコード」「ケース売価」を表示
5. 入力済み商品リスト（表形式・最大 100 件・編集・削除）
6. ファイル出力（Item / Additional Barcode シート、デフォルトファイル名 `部門_YYYYMMDD_HHMMSS.xlsx`）
7. インポートファイルの読込（リスト復元）
8. 日本語／ไทย の言語切替

## 分類・仕入先マスタをスプレッドシートから読み込む

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成し、**Google Sheets API** を有効化する。
2. **認証情報** → **API キーを作成** し、キーをコピーする。
3. スプレッドシート「lopia thailand item import master」を **「リンクを知っている全員が閲覧可」** に共有する。
4. プロジェクト直下に `.env` を作成し、次を記述する（`.env.example` をコピーして編集可）:
   ```
   VITE_GOOGLE_SHEETS_API_KEY=あなたのAPIキー
   ```
5. `npm run dev` を再起動する。起動時にシート「group」「supplier」からマスタを取得し、分類・仕入先のコンボボックスに反映される。

API キーを設定しない場合はサンプルデータ（数件）が使われます。

## 分類の GenAI（Gemini）推測

「推測」ボタンで、商品名（英・泰）から分類コードを AI で提案できます。

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを取得する。
2. `.env` に次を追加する:
   ```
   VITE_GEMINI_API_KEY=あなたのGemini APIキー
   ```
3. `npm run dev` を再起動する。

`VITE_GEMINI_API_KEY` が未設定の場合は、従来どおりキーワード一致による推測になります。

## Cloud Run での環境変数設定

Cloud Run では `.env` は自動で使われません。次の環境変数を **サービスの環境変数** として設定してください。

```text
VITE_GEMINI_API_KEY=あなたのGemini APIキー
VITE_GOOGLE_SHEETS_API_KEY=あなたのGoogle Sheets APIキー
GCS_EXPORTS_BUCKET=item-import-exports-dev   # 出力xlsx保管バケット（後述）
```

このアプリはコンテナ起動時に環境変数から `/config.js` を生成し、ブラウザ側で読み込みます。

## 出力ファイル保管（GCS）のセットアップ

操作ログから過去の xlsx を再ダウンロード可能にするため、出力ファイルは **Google Cloud Storage (GCS)** に保管します。保持期間 **90 日**（lifecycle で自動削除）、ダウンロードは **admin ロールのみ**。

### 前提

- gcloud CLI がインストール・認証済み
- 対象プロジェクトの `Storage Admin` / `IAM Admin` 権限を持つアカウントで実行

### 手順

以下を1度だけ実行します。`PROJECT_ID` と `BUCKET` は環境に合わせて変更してください。

```bash
# 0. 変数を設定
PROJECT_ID="$(gcloud config get-value project)"
REGION="asia-northeast1"
BUCKET="item-import-exports-dev"        # 環境ごとに -dev / -prod を分ける
SERVICE_NAME="item-master-create-dev"   # Cloud Run サービス名

# 1. バケット作成（uniform bucket-level access、非公開）
gcloud storage buckets create "gs://${BUCKET}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --uniform-bucket-level-access \
  --public-access-prevention

# 2. 90日 lifecycle ルールを設定（age=90 で削除）
cat > /tmp/lifecycle.json <<'JSON'
{
  "lifecycle": {
    "rule": [
      { "action": { "type": "Delete" }, "condition": { "age": 90 } }
    ]
  }
}
JSON
gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file=/tmp/lifecycle.json

# 3. Cloud Run 実行サービスアカウント（既定: ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com）にバケット書込権限を付与
#    Cloud Run サービス未デプロイ時は describe が失敗するため stderr を捨て、フォールバックを利かせる
RUNTIME_SA="$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null)"
[ -z "${RUNTIME_SA}" ] && RUNTIME_SA="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectAdmin"

# 4. V4 signed URL 発行のため、実行 SA に自身を impersonate する権限を付与
#    （IAM signBlob API を使うため。鍵 JSON を持たないランタイムでは必須）
gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="${PROJECT_ID}"
```

### Cloud Run へバケット名を渡す

`deploy.sh` / `deploy.ps1` は `GCS_EXPORTS_BUCKET` 環境変数を Cloud Run サービスに伝搬します。デプロイ時に次のいずれかで指定してください。

```bash
# 一時的に
GCS_EXPORTS_BUCKET="item-import-exports-dev" ./deploy.sh

# 永続化したい場合（手動 or Console）
gcloud run services update "${SERVICE_NAME}" \
  --region="${REGION}" \
  --update-env-vars="GCS_EXPORTS_BUCKET=item-import-exports-dev"
```

### ローカル開発時

ローカル `node server.js` から GCS に書き込む場合は **Application Default Credentials** が必要です。

```bash
gcloud auth application-default login
export GCS_EXPORTS_BUCKET="item-import-exports-dev"
```

`GCS_EXPORTS_BUCKET` が未設定の場合、サーバーは GCS への保管をスキップし、操作ログのみ記録します（後方互換）。

## 制限・注意

- スプレッドシート**書き込み**機能は Phase2 で実装予定です。
- GenAI はブラウザから直接 Gemini API を呼び出すため、API キーがクライアントに露出します。本番ではプロキシ経由での呼び出しを推奨します。
