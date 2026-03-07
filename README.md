# 商品登録 取り込みファイル作成システム

基幹システム向けの商品登録インポートファイル（.xlsx）を作成する Web アプリです。  
グロサリー部門のメーカーバーコード商品を対象とし、日本語・タイ語に対応しています。

## ドキュメント

- [要件定義書](./要件定義書.md)
- [基本設計書](./基本設計書.md)

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
```

このアプリはコンテナ起動時に環境変数から `/config.js` を生成し、ブラウザ側で読み込みます。

## 制限・注意

- スプレッドシート**書き込み**機能は Phase2 で実装予定です。
- GenAI はブラウザから直接 Gemini API を呼び出すため、API キーがクライアントに露出します。本番ではプロキシ経由での呼び出しを推奨します。
