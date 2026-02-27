/**
 * IP and geo: ipapi.co for IP + location (CORS-friendly, works with ad blockers).
 * Optionally fetches the other IP family from ipify to show both IPv4 and IPv6.
 */

const IPAPI_URL = 'https://ipapi.co/json/';
const IPIFY_V4_URL = 'https://api.ipify.org?format=json';
const IPIFY_V6_URL = 'https://api6.ipify.org?format=json';

/**
 * Fetch IP only from an endpoint (for supplementing the other family). CORS-friendly.
 * @param {string} url - ipify v4 or v6 URL
 * @returns {Promise<string|null>}
 */
async function fetchIpFromUrl(url) {
  try {
    const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
    if (!res.ok) return null;
    const data = await res.json();
    const ip = data?.ip;
    return typeof ip === 'string' ? ip.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Fetch IP only (fallback when ipapi.co fails). Tries IPv4 then IPv6.
 * @returns {Promise<string|null>}
 */
export async function fetchPublicIpOnly() {
  const v4 = await fetchIpFromUrl(IPIFY_V4_URL);
  if (v4) return v4;
  const v6 = await fetchIpFromUrl(IPIFY_V6_URL);
  return v6 ?? null;
}

/**
 * Normalize a raw IP into the minimal shape for renderIpData.
 * @param {string} ip
 * @returns {{ ip: string, type: string, ipv4: string|null, ipv6: string|null }}
 */
export function normalizeIpOnly(ip) {
  const raw = String(ip ?? '').trim();
  const type = raw.includes(':') ? 'IPv6' : 'IPv4';
  return {
    ip: raw || 'UNKNOWN',
    type,
    ipv4: raw.includes('.') ? raw : null,
    ipv6: raw.includes(':') ? raw : null
  };
}

/**
 * Fetch IP + geo from ipapi.co (CORS-friendly, provides location; works with ad blockers).
 * Optionally fetches the other IP family from ipify so we can show both IPv4 and IPv6.
 * Returns shape expected by app.js.
 */
export async function fetchIpData() {
  const res = await fetch(IPAPI_URL, { cache: 'no-store', mode: 'cors' });
  if (!res.ok) throw new Error(`IP API HTTP ${res.status}`);
  const data = await res.json();

  const ip = typeof data.ip === 'string' ? data.ip.trim() : '';
  const type = ip.includes(':') ? 'IPv6' : 'IPv4';
  let ipv4 = ip.includes('.') ? ip : null;
  let ipv6 = ip.includes(':') ? ip : null;

  // Optionally fetch the other IP family so we can show both IPv4 and IPv6
  if (ipv4) {
    const other = await fetchIpFromUrl(IPIFY_V6_URL);
    if (other) ipv6 = other;
  } else if (ipv6) {
    const other = await fetchIpFromUrl(IPIFY_V4_URL);
    if (other) ipv4 = other;
  }

  const tz = data.timezone ?? null;
  const utc = data.utc_offset ?? null;

  return {
    ip: ipv4 ?? ipv6 ?? ip,
    type,
    ipv4,
    ipv6,
    country: data.country_name ?? data.country ?? null,
    country_code: data.country_code ?? null,
    region: data.region ?? data.region_name ?? null,
    city: data.city ?? null,
    postal: data.postal ?? data.zip_code ?? null,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    timezone: tz
      ? { id: tz, abbr: null, utc, current_time: null, is_dst: null }
      : null,
    connection: {
      isp: data.org ?? null,
      org: data.org ?? null,
      asn: data.asn ?? null,
      domain: null,
      hostname: data.hostname ?? null
    },
    security: { proxy: false, vpn: false, tor: false, relay: false },
    flag: null
  };
}
