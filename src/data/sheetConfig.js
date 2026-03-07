/**
 * Google スプレッドシート連携の設定（要件定義書 2.3）
 * lopia thailand item import master
 *
 * スプレッドシートから分類・仕入先マスタを読み込むには、
 * 1. Google Cloud でプロジェクトを作成し「Google Sheets API」を有効化
 * 2. 認証情報で「API キー」を作成
 * 3. スプレッドシートを「リンクを知っている全員が閲覧可」に共有
 * 4. 下記 GOOGLE_SHEETS_API_KEY に API キーを設定（または環境変数で上書き）
 */
export const SPREADSHEET_ID = '1RRZWx3Oa8ONpkszDQTdDsoE2h2N0aUNr3VcBQVwQ17Q';
export const GROUP_SHEET_NAME = 'group';
export const SUPPLIER_SHEET_NAME = 'supplier';

/** API キーが未設定の場合はサンプルデータを使用します。設定するとスプレッドシートから取得します。 */
export const GOOGLE_SHEETS_API_KEY = typeof import.meta.env?.VITE_GOOGLE_SHEETS_API_KEY === 'string'
  ? import.meta.env.VITE_GOOGLE_SHEETS_API_KEY.trim()
  : '';
