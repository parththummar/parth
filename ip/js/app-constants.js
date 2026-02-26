/**
 * App constants: ASCII effect tuning defaults, storage key, and tooltip copy.
 */

export const ASCII_REVEAL_CHARS = '01#*+=-[]{}<>/\\|:;.^~_xX';

export const ASCII_TUNING_STORAGE_KEY = 'ipaddress-ascii-tuning';

export const DEFAULT_ASCII_TUNING = {
  baseMs: 900,
  charMs: 150,
  minMs: 500,
  maxMs: 3000,
  hoverCooldownMs: 3000,
  chars: ASCII_REVEAL_CHARS
};

/** Tooltips for snapshot cards (keyed by value element id). */
export const SNAPSHOT_TOOLTIPS = {
  'snap-country': 'Country derived from your IP geolocation.',
  'snap-city': 'City or region from IP geolocation.',
  'snap-isp': 'Internet Service Provider associated with your IP.',
  'snap-timezone': 'Timezone from IP geolocation (server-side).',
  'snap-browser-tz': 'Timezone reported by your browser (Intl).',
  'snap-viewport': 'Current browser window width × height in pixels.'
};

/** Tooltips for detail panel rows (keyed by uppercase field name). */
export const FIELD_TOOLTIPS = {
  'IP': 'Your public IP as seen by the geo/location server.',
  'IPv4': 'Your public IPv4 address (from IPv4-only endpoint).',
  'IPv6': 'Your public IPv6 address (from IPv6-only endpoint).',
  'TYPE': 'Address family: IPv4 or IPv6.',
  'ISP': 'Internet Service Provider.',
  'ORG': 'Organization that owns the IP range.',
  'ASN': 'Autonomous System Number for the IP.',
  'COUNTRY': 'Country from IP geolocation.',
  'COUNTRY CODE': 'ISO country code (e.g. US, IN).',
  'REGION': 'Region or state from geolocation.',
  'CITY': 'City from geolocation.',
  'POSTAL': 'Postal or ZIP code from geolocation.',
  'LAT/LON': 'Approximate latitude and longitude.',
  'TIMEZONE': 'Timezone identifier (e.g. America/New_York).',
  'USER AGENT': 'Browser identification string sent with requests.',
  'PLATFORM': 'OS platform reported by the browser.',
  'VIEWPORT PX': 'Current window inner width × height.',
  'SCREEN PX': 'Total screen width × height in pixels.',
  'ROUTEABLE': 'Whether the IP is a routable public address.',
  'VPN/PROXY/TOR FLAG': 'Indicators for proxy, VPN, or Tor usage.'
};
