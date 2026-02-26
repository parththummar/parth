/**
 * IP and geo: JSONP for geo (avoids CORS). Fallback to ipify for IP only.
 */

const GEO_JSONP_URL = 'https://reallyfreegeoip.org/json/';
const IPIFY_URL = 'https://api.ipify.org?format=json';

/**
 * Fetch JSON via JSONP (works without CORS). Resolves with parsed data or rejects.
 * @param {string} url - Base URL; callback param will be appended.
 * @returns {Promise<object>}
 */
function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const name = `__geo_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Geo API timeout'));
    }, 12000);
    function cleanup() {
      clearTimeout(timeout);
      window[name] = () => {};
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[name] = (data) => {
      cleanup();
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = `${url}?callback=${encodeURIComponent(name)}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Geo API failed'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Fetch IP only (fallback when geo API fails). CORS-friendly.
 * @returns {Promise<string|null>}
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
 * Fetch IP + geo via JSONP (avoids CORS). reallyfreegeoip.org, no key.
 * Returns shape expected by app.js. No ISP in API response.
 */
export async function fetchIpData() {
  const data = await fetchJsonp(GEO_JSONP_URL);

  const ip = data.ip ?? '';
  const type = ip.includes(':') ? 'IPv6' : 'IPv4';
  const ipv4 = ip.includes('.') ? ip : null;
  const ipv6 = ip.includes(':') ? ip : null;
  const tz = data.time_zone ?? data.timezone;

  return {
    ip,
    type,
    ipv4,
    ipv6,
    country: data.country_name ?? data.country ?? null,
    country_code: data.country_code ?? null,
    region: data.region_name ?? data.region ?? null,
    city: data.city ?? null,
    postal: data.zip_code ?? data.postal ?? null,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    timezone: tz
      ? { id: tz, abbr: null, utc: null, current_time: null, is_dst: null }
      : null,
    connection: {
      isp: null,
      org: null,
      asn: null,
      domain: null,
      hostname: null
    },
    security: { proxy: false, vpn: false, tor: false, relay: false },
    flag: null
  };
}
