/**
 * IP lookup services: fetch public IP and full geo/connection data.
 * Uses ipapi.co (CORS-friendly; free tier, no key for basic use).
 */

const IPIFY_URL = 'https://api.ipify.org?format=json';
const IPAPI_URL = 'https://ipapi.co/json/';

// IPv4-only endpoints. All tried in parallel; first successful result used.
const IPV4_URLS = [
  { url: 'https://api.ipify.org?format=json', json: true },
  { url: 'https://ipv4.icanhazip.com/', json: false },
  { url: 'https://ipv4.seeip.org/jsonip', json: true },
  { url: 'https://4.ident.me/', json: false }
];

// IPv6-only endpoints.
const IPV6_URLS = [
  { url: 'https://api6.ipify.org?format=json', json: true },
  { url: 'https://ipv6.icanhazip.com/', json: false },
  { url: 'https://6.ident.me/', json: false }
];

/**
 * Fetch only the public IP string. Uses ipify (no key, CORS-friendly).
 * @returns {Promise<string|null>} IP string or null on failure.
 */
export async function fetchPublicIpOnly() {
  try {
    const res = await fetch(IPIFY_URL, { cache: 'no-store', mode: 'cors' });
    if (!res.ok) return null;
    const data = await res.json();
    const ip = data?.ip;
    return typeof ip === 'string' ? ip.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Fetch one IP from a URL; expects JSON { ip } or plain text.
 * @param {string} url
 * @param {{ json: boolean }} opts
 * @returns {Promise<string|null>}
 */
async function fetchOneIp(url, opts = {}) {
  const json = opts.json !== false;
  try {
    const r = await fetch(url, { cache: 'no-store', mode: 'cors' });
    if (!r.ok) return null;
    const raw = await (json ? r.json() : r.text());
    const ip = json ? raw?.ip : raw?.trim();
    const s = typeof ip === 'string' ? ip.trim() : '';
    return s.length > 0 ? s : null;
  } catch {
    return null;
  }
}

/**
 * Try multiple URLs in parallel; return the first successful IP (or null).
 * @param {Array<{ url: string, json: boolean }>} urls
 * @returns {Promise<string|null>}
 */
async function fetchFirstIp(urls) {
  const results = await Promise.all(
    urls.map(({ url, json }) => fetchOneIp(url, { json }))
  );
  return results.find((ip) => ip != null && ip.length > 0) ?? null;
}

/**
 * Fetch IPv4 and IPv6 in parallel from dedicated endpoints (not from geo API).
 * Tries multiple URLs for each; first successful response per family is used.
 * @returns {Promise<{ ipv4: string|null, ipv6: string|null }>}
 */
export async function fetchBothIpVersions() {
  const [ipv4, ipv6] = await Promise.all([
    fetchFirstIp(IPV4_URLS),
    fetchFirstIp(IPV6_URLS)
  ]);
  return { ipv4, ipv6 };
}

/**
 * Normalize a raw IP string into the minimal shape expected by the app (ip + type).
 * @param {string} ip - Raw IP string.
 * @returns {{ ip: string, type?: string }} Object with at least .ip for renderIpData.
 */
export function normalizeIpOnly(ip) {
  const raw = String(ip ?? '').trim();
  const type = raw.includes(':') ? 'IPv6' : 'IPv4';
  return { ip: raw || 'UNKNOWN', type };
}

/**
 * Fetch full IP geo/connection data. Uses ipapi.co (free tier, no key).
 * Response is normalized to the shape expected by app.js.
 * @returns {Promise<object>} Normalized IP data for renderIpData.
 */
export async function fetchIpData() {
  const res = await fetch(IPAPI_URL, { cache: 'no-store', mode: 'cors' });
  if (!res.ok) throw new Error(`IP API HTTP ${res.status}`);
  const data = await res.json();

  if (data?.error) {
    throw new Error(data.reason || data.error || 'IP lookup failed');
  }

  const ip = data.ip ?? '';
  const type = (data.version ?? (ip.includes(':') ? 'IPv6' : 'IPv4')).toString();

  return {
    ip,
    type,
    ipv4: null,
    ipv6: null,
    country: data.country_name ?? data.country ?? null,
    country_code: data.country_code ?? null,
    region: data.region ?? null,
    city: data.city ?? null,
    postal: data.postal ?? null,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    timezone: data.timezone
      ? {
          id: data.timezone,
          abbr: null,
          utc: data.utc_offset ?? null,
          current_time: null,
          is_dst: null
        }
      : null,
    connection: {
      isp: data.org ?? null,
      org: data.org ?? null,
      asn: data.asn ?? null,
      domain: null,
      hostname: data.hostname ?? null
    },
    security: {
      proxy: false,
      vpn: false,
      tor: false,
      relay: false
    },
    flag: null
  };
}
