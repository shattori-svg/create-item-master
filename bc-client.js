import 'dotenv/config';
import fs from 'node:fs';

// Business Central (LS-Central) OData v4 client.
//
// Auth (BC_AUTH_MODE):
//   - 'client_credentials' (default) — service-to-service via Entra ID; the
//     Microsoft-documented flow for unattended integrations. Needs an Entra app
//     with the BC application permission admin-consented + a client secret.
//   - 'refresh_token' — delegated flow using a long-lived refresh token (minted
//     once via device-code). Matches the sibling `get-item-sales` job, which runs
//     this way because admin consent for the application permission was
//     unavailable. The refresh token rotates on each use and is persisted back.
//
// Master fields (incl. THA/JPN) come from the tenant's already-published
// LS Central custom OData web services (Retail_* pages), so no BC-side AL
// development is required. See docs/tech-research/20260618-ls-central-master-sync.md.

const DEFAULT_SCOPE = 'https://api.businesscentral.dynamics.com/.default';
const METADATA_TOKEN_URL = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
const SECRET_MANAGER_BASE = 'https://secretmanager.googleapis.com/v1';

function cfg() {
  return {
    authMode: (process.env.BC_AUTH_MODE || 'client_credentials').trim(),
    tenantId: (process.env.BC_TENANT_ID || '').trim(),
    clientId: (process.env.BC_CLIENT_ID || '').trim(),
    clientSecret: (process.env.BC_CLIENT_SECRET || '').trim(),
    environment: (process.env.BC_ENVIRONMENT || 'Production').trim(),
    company: (process.env.BC_COMPANY_NAME || '').trim(),
    scope: (process.env.BC_SCOPE || DEFAULT_SCOPE).trim(),
    // refresh_token mode: where the rotating refresh token lives.
    refreshTokenFile: (process.env.BC_REFRESH_TOKEN_FILE || '').trim(),
    refreshTokenSecret: (process.env.BC_REFRESH_TOKEN_SECRET || '').trim(),
  };
}

export function isBcConfigured() {
  const c = cfg();
  if (!c.tenantId || !c.clientId || !c.company) return false;
  if (c.authMode === 'refresh_token') return Boolean(c.refreshTokenFile || c.refreshTokenSecret);
  return Boolean(c.clientSecret);
}

/** Google access token from the Cloud Run metadata server (Secret Manager access). */
async function getGoogleAccessToken() {
  const res = await fetch(METADATA_TOKEN_URL, { headers: { 'Metadata-Flavor': 'Google' } });
  if (!res.ok) throw new Error(`GCP metadata token request failed (HTTP ${res.status})`);
  const j = await res.json();
  return j.access_token;
}

/**
 * Refresh-token storage: a local file (dev / verification) or Secret Manager
 * (production on Cloud Run). Returns { read(), write(token) }.
 */
function refreshTokenStore(c) {
  if (c.refreshTokenFile) {
    return {
      read: async () => fs.readFileSync(c.refreshTokenFile, 'utf8').trim(),
      write: async (tok) => fs.writeFileSync(c.refreshTokenFile, tok),
    };
  }
  if (c.refreshTokenSecret) {
    // c.refreshTokenSecret: full resource name, e.g. projects/X/secrets/bc-refresh-token
    return {
      read: async () => {
        const g = await getGoogleAccessToken();
        const res = await fetch(`${SECRET_MANAGER_BASE}/${c.refreshTokenSecret}/versions/latest:access`, {
          headers: { Authorization: `Bearer ${g}` },
        });
        if (!res.ok) throw new Error(`Secret access failed (HTTP ${res.status})`);
        const j = await res.json();
        return Buffer.from(j.payload.data, 'base64').toString('utf8').trim();
      },
      write: async (tok) => {
        const g = await getGoogleAccessToken();
        const res = await fetch(`${SECRET_MANAGER_BASE}/${c.refreshTokenSecret}:addVersion`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${g}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: { data: Buffer.from(tok, 'utf8').toString('base64') } }),
        });
        if (!res.ok) throw new Error(`Secret addVersion failed (HTTP ${res.status})`);
      },
    };
  }
  throw new Error('refresh_token mode requires BC_REFRESH_TOKEN_FILE or BC_REFRESH_TOKEN_SECRET');
}

async function tokenViaRefreshToken(c) {
  const store = refreshTokenStore(c);
  const refreshToken = await store.read();
  const res = await fetch(`https://login.microsoftonline.com/${c.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: c.clientId,
      refresh_token: refreshToken,
      // offline_access so Entra returns a (rotated) refresh token to persist.
      scope: `${c.scope} offline_access`,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`BC refresh-token request failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  if (!json.access_token) throw new Error('BC refresh-token response had no access_token');
  if (json.refresh_token && json.refresh_token !== refreshToken) {
    try {
      await store.write(json.refresh_token);
    } catch (err) {
      console.error('[bc-client] failed to persist rotated refresh token:', err.message);
    }
  }
  return json;
}

async function tokenViaClientCredentials(c) {
  const res = await fetch(`https://login.microsoftonline.com/${c.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: c.clientId,
      client_secret: c.clientSecret,
      scope: c.scope,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      detail = j.error_description ? j.error_description.split('\n')[0] : (j.error || detail);
    } catch { /* keep raw */ }
    throw new Error(`BC token request failed (HTTP ${res.status}): ${detail}`);
  }
  const json = JSON.parse(text);
  if (!json.access_token) throw new Error('BC token response had no access_token');
  return json;
}

// In-memory access-token cache (the server is long-running; avoid a token
// request per sync). Refreshed 60s before expiry.
let cachedToken = null; // { value: string, expiresAt: number }

export async function getAccessToken() {
  if (!isBcConfigured()) {
    throw new Error('Business Central not configured (check BC_AUTH_MODE and related env vars)');
  }
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const c = cfg();
  const json = c.authMode === 'refresh_token'
    ? await tokenViaRefreshToken(c)
    : await tokenViaClientCredentials(c);
  cachedToken = { value: json.access_token, expiresAt: now + Number(json.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry on transient errors (network, 408, 429, 5xx) with exponential backoff +
// jitter. Honors Retry-After when present. BC production limit is 600 req/min.
async function fetchWithRetry(url, options, { retries = 3, label = 'request' } = {}) {
  let attempt = 0;
  for (;;) {
    let res;
    try {
      res = await fetch(url, options);
    } catch (err) {
      if (attempt >= retries) throw new Error(`${label} network error after ${attempt} retries: ${err.message}`);
      await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 250));
      attempt += 1;
      continue;
    }
    if (res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt >= retries) return res;
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 500 * 2 ** attempt + Math.floor(Math.random() * 250);
      await sleep(wait);
      attempt += 1;
      continue;
    }
    return res;
  }
}

/**
 * Query a published BC OData v4 web service, following @odata.nextLink until all
 * pages are retrieved.
 * @param {string} serviceName e.g. 'Retail_Product_Groups_Excel'
 * @param {{ select?: string, filter?: string, top?: number }} opts
 * @returns {Promise<Array<object>>}
 */
export async function queryOData(serviceName, { select = '', filter = '', top = 0 } = {}) {
  const c = cfg();
  const token = await getAccessToken();
  const companyEnc = encodeURIComponent(c.company);
  const base = `https://api.businesscentral.dynamics.com/v2.0/${c.tenantId}/${c.environment}/ODataV4/Company('${companyEnc}')/${serviceName}`;
  const params = [];
  if (select) params.push(`$select=${encodeURIComponent(select)}`);
  if (filter) params.push(`$filter=${encodeURIComponent(filter)}`);
  if (top) params.push(`$top=${top}`);
  let nextUrl = params.length ? `${base}?${params.join('&')}` : base;

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const rows = [];
  let page = 0;
  while (nextUrl) {
    page += 1;
    const res = await fetchWithRetry(nextUrl, { method: 'GET', headers }, { label: `${serviceName} p${page}` });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${serviceName} request failed (HTTP ${res.status}) on page ${page}: ${text.slice(0, 300)}`);
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`${serviceName} returned non-JSON on page ${page}`);
    }
    if (Array.isArray(json.value)) rows.push(...json.value);
    nextUrl = json['@odata.nextLink'] || null;
  }
  return rows;
}
