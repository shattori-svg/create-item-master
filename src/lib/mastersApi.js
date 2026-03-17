/**
 * マスタデータAPI クライアント
 * Supabase バックエンド (/api/masters/*) からマスタを取得する
 * sessionStorage にキャッシュして再取得を避ける
 */

const CACHE_KEY_GROUP = 'masters_cache_group';
const CACHE_KEY_SUPPLIER = 'masters_cache_supplier';

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // sessionStorage が使えない場合は無視
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

/**
 * 指定部門の分類マスタを取得する。
 * @param {string} dept - 部門コード（例: "01"）
 * @returns {Promise<Array>}
 */
export async function fetchGroups(dept) {
  const cacheKey = `${CACHE_KEY_GROUP}_${dept}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(`/api/masters/groups?dept=${encodeURIComponent(dept)}`);
  const rows = Array.isArray(data) ? data : [];
  writeCache(cacheKey, rows);
  return rows;
}

/**
 * 指定部門の仕入先マスタを取得する。
 * @param {string} dept - 部門コード（例: "01"）
 * @returns {Promise<Array>}
 */
export async function fetchSuppliers(dept) {
  const cacheKey = `${CACHE_KEY_SUPPLIER}_${dept}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(`/api/masters/suppliers?dept=${encodeURIComponent(dept)}`);
  const rows = Array.isArray(data) ? data : [];
  writeCache(cacheKey, rows);
  return rows;
}

/**
 * 全部門の分類・仕入先マスタを取得し { group, supplier } で返す。
 * エラー時は null を返す。
 * @param {string} dept - 部門コード
 */
export async function fetchMastersFromApi(dept) {
  try {
    const [group, supplier] = await Promise.all([
      fetchGroups(dept),
      fetchSuppliers(dept),
    ]);
    return { group, supplier };
  } catch (err) {
    console.warn('Masters API fetch failed:', err);
    return null;
  }
}

/**
 * セッションキャッシュをクリアして再取得を強制する
 */
export function clearMastersCache() {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((k) => {
      if (k.startsWith(CACHE_KEY_GROUP) || k.startsWith(CACHE_KEY_SUPPLIER)) {
        sessionStorage.removeItem(k);
      }
    });
  } catch {
    // ignore
  }
}
