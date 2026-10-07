const BAN_BASE_URL = 'https://api-adresse.data.gouv.fr';
const BAN_TIMEOUT_MS = 5000;
export const MIN_GEOCODE_SCORE = 0.5;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BAN_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeFeature(feature) {
  const { geometry, properties } = feature;
  const [longitude, latitude] = geometry.coordinates;
  return {
    banId: properties.banId ?? properties.id ?? null,
    label: properties.label ?? null,
    score: properties.score ?? null,
    type: properties.type ?? null,
    street: properties.street ?? null,
    name: properties.name ?? null,
    housenumber: properties.housenumber ?? null,
    postcode: properties.postcode ?? null,
    citycode: properties.citycode ?? null,
    city: properties.city ?? null,
    context: properties.context ?? null,
    latitude,
    longitude,
    lambert93_x: properties.x ?? null,
    lambert93_y: properties.y ?? null,
  };
}

function banSearchUrl({ q, limit = 5, postcode, citycode }) {
  const url = new URL(`${BAN_BASE_URL}/search/`);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit));
  if (postcode)
    url.searchParams.set('postcode', postcode);
  if (citycode)
    url.searchParams.set('citycode', citycode);
  return url.toString();
}

function banReverseUrl({ latitude, longitude, limit = 1 }) {
  const url = new URL(`${BAN_BASE_URL}/reverse/`);
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export async function searchAddress({ q, limit = 5, postcode, citycode }) {
  const response = await fetchWithTimeout(banSearchUrl({ q, limit, postcode, citycode }));
  if (!response.ok) {
    throw new Error(`BAN search HTTP ${response.status}`);
  }
  const payload = await response.json();
  return (payload.features ?? []).map(normalizeFeature);
}

export async function reverseGeocode({ latitude, longitude, limit = 1 }) {
  const response = await fetchWithTimeout(banReverseUrl({ latitude, longitude, limit }));
  if (!response.ok) {
    throw new Error(`BAN reverse HTTP ${response.status}`);
  }
  const payload = await response.json();
  return (payload.features ?? []).map(normalizeFeature);
}

export function buildAddressQuery(fields = {}) {
  const parts = [];
  if (fields.city || fields.commune)
    parts.push(fields.city || fields.commune);
  if (fields.postal_code)
    parts.push(fields.postal_code);
  return parts.join(' ').trim();
}

export async function geocodeAddress(fields = {}) {
  const q = buildAddressQuery(fields);
  if (!q)
    return null;
  const results = await searchAddress({
    q,
    postcode: fields.postal_code,
    citycode: fields.commune_code,
  });
  const best = results[0];
  if (!best || best.score == null || best.score < MIN_GEOCODE_SCORE)
    return null;
  return best;
}
