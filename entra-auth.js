import crypto from 'node:crypto';
import { importJWK, jwtVerify } from 'jose';

const STATE_TTL_MS = 10 * 60 * 1000;
// Comma/space-separated list of allowed email domains. Empty = allow any.
const ALLOWED_DOMAINS = (process.env.ENTRA_ALLOWED_DOMAIN || '')
  .split(/[,\s]+/)
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function requiredEnv(name) {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export function isEntraConfigured() {
  return Boolean(
    requiredEnv('ENTRA_CLIENT_ID') &&
    requiredEnv('ENTRA_CLIENT_SECRET') &&
    requiredEnv('ENTRA_TENANT_ID') &&
    requiredEnv('ENTRA_REDIRECT_URI')
  );
}

function getConfig() {
  const tenantId = requiredEnv('ENTRA_TENANT_ID');
  const clientId = requiredEnv('ENTRA_CLIENT_ID');
  const clientSecret = requiredEnv('ENTRA_CLIENT_SECRET');
  const redirectUri = requiredEnv('ENTRA_REDIRECT_URI');
  const tenantGuid = requiredEnv('ENTRA_TENANT_GUID') || tenantId;
  return {
    tenantId,
    tenantGuid,
    clientId,
    clientSecret,
    redirectUri,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  };
}

function base64urlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64urlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getStateSecret() {
  const secret = requiredEnv('SESSION_SECRET');
  if (!secret) throw new Error('SESSION_SECRET is required for Entra state signing');
  return secret;
}

export function createSignedState(payload = {}) {
  const statePayload = {
    ...payload,
    nonce: crypto.randomUUID(),
    ts: Date.now(),
  };
  const encoded = base64urlEncode(JSON.stringify(statePayload));
  const signature = crypto.createHmac('sha256', getStateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySignedState(state) {
  if (!state || typeof state !== 'string' || !state.includes('.')) return null;
  const [encoded, signature] = state.split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', getStateSecret()).update(encoded).digest('base64url');
  if (signature !== expected) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encoded));
  } catch {
    return null;
  }
  if (!payload?.ts || typeof payload.ts !== 'number') return null;
  if (Math.abs(Date.now() - payload.ts) > STATE_TTL_MS) return null;
  return payload;
}

export function getAuthorizationUrl() {
  const config = getConfig();
  const state = createSignedState({ returnTo: '/' });
  const url = new URL(`${config.authority}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  return { url: url.toString(), state };
}

export async function exchangeCodeForTokens(code) {
  const config = getConfig();
  const tokenUrl = `${config.authority}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.set('client_id', config.clientId);
  params.set('client_secret', config.clientSecret);
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('redirect_uri', config.redirectUri);
  params.set('scope', 'openid email profile');
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function fetchJwks(tenantId) {
  const url = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  return res.json();
}

function decodeJwtHeader(token) {
  const [header] = token.split('.');
  if (!header) throw new Error('Malformed token');
  return JSON.parse(base64urlDecode(header));
}

export async function validateIdToken(idToken) {
  const config = getConfig();
  const header = decodeJwtHeader(idToken);
  const jwks = await fetchJwks(config.tenantId);
  const key = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!key) throw new Error('Matching JWKS key not found');
  const publicKey = await importJWK(key, key.alg || 'RS256');
  const expectedIssuers = [
    `https://login.microsoftonline.com/${config.tenantGuid}/v2.0`,
    `https://sts.windows.net/${config.tenantGuid}/`,
  ];
  const { payload } = await jwtVerify(idToken, publicKey, {
    audience: config.clientId,
    issuer: expectedIssuers,
  });
  return payload;
}

export function getEmailFromPayload(payload) {
  if (!payload) return '';
  const email = payload.email || payload.preferred_username || payload.upn || '';
  return String(email).trim().toLowerCase();
}

/**
 * Extract the stable identity plus every email-like claim from an ID token.
 *
 * `oid` (Entra object id) is immutable for a user inside the tenant, while
 * `email` / `preferred_username` / `upn` all change when the mail attribute or
 * UPN is edited in Entra. Account matching must therefore key on `oid`;
 * the email-like claims are only used as a display/login label and as a
 * fallback for rows created before `oid` was persisted.
 *
 * `candidates` lists every distinct email-like claim so a legacy row can still
 * be matched (and re-linked) when only one of them changed.
 */
export function getIdentityFromPayload(payload) {
  const norm = (v) => String(v ?? '').trim().toLowerCase();
  if (!payload) {
    return { oid: '', loginId: '', email: '', preferredUsername: '', upn: '', displayName: '', candidates: [] };
  }
  const email = norm(payload.email);
  const preferredUsername = norm(payload.preferred_username);
  const upn = norm(payload.upn);
  const candidates = [...new Set([email, preferredUsername, upn])].filter((v) => v.includes('@'));
  return {
    // `sub` is only pairwise-unique per app, but it is still immutable and is a
    // better key than any email claim when `oid` is absent from the token.
    oid: String(payload.oid || payload.sub || '').trim(),
    loginId: email || preferredUsername || upn,
    email,
    preferredUsername,
    upn,
    displayName: String(payload.name ?? '').trim(),
    candidates,
  };
}

export function isAllowedEmail(email) {
  if (!email) return false;
  if (ALLOWED_DOMAINS.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Allow the login when *any* email-like claim sits on an allowed domain.
 * Entra can hand out a `mail` on the tenant's `*.onmicrosoft.com` domain while
 * the UPN uses the corporate domain (or vice versa); both identify the same
 * person, so checking only one claim would lock the user out.
 */
export function isAllowedIdentity(candidates = []) {
  if (ALLOWED_DOMAINS.length === 0) return true;
  return candidates.some((c) => isAllowedEmail(c));
}
