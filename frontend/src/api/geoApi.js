export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const TILE_LAYER_URL = `${API_BASE_URL}/geo/tiles/{z}/{x}/{y}.png`;

const slugify = (text) => {
  if (!text)
    return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
};

export const fetchDepartmentsGeoJson = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/geo/departements`);
    if (!res.ok)
      throw new Error('Failed backend fetch');
    return await res.json();
  } catch (err) {
    const fallback = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson');
    return await fallback.json();
  }
};

export const fetchArrondissementsGeoJson = async (code, nom) => {
  try {
    const url = new URL(`${API_BASE_URL}/geo/departements/${code}/arrondissements`);
    if (nom)
      url.searchParams.append('nom', nom);
    const res = await fetch(url.toString());
    if (!res.ok)
      throw new Error('Failed backend fetch');
    return await res.json();
  } catch (err) {
    const slug = slugify(nom || '');
    const fallbackUrl = `https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements/${code}-${slug}/arrondissements-${code}-${slug}.geojson`;
    const fallbackRes = await fetch(fallbackUrl);
    if (!fallbackRes.ok)
      return null;
    return await fallbackRes.json();
  }
};

const isPointInRing = (ring, lat, lng) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngA, latA] = ring[i];
    const [lngB, latB] = ring[j];
    if (latA > lat !== latB > lat && lng < ((lngB - lngA) * (lat - latA)) / (latB - latA) + lngA) {
      inside = !inside;
    }
  }
  return inside;
};

export const findDepartmentAtPoint = (geojson, latLng) => {
  if (!geojson?.features || !latLng)
    return null;
  const [lat, lng] = latLng;
  for (const feature of geojson.features) {
    const geometry = feature.geometry;
    if (!geometry)
      continue;
    const polygons = geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates];
    for (const rings of polygons) {
      const outer = rings?.[0];
      if (!outer || outer.length < 4 || !isPointInRing(outer, lat, lng))
        continue;
      const inHole = rings.slice(1).some((hole) => hole && hole.length >= 4 && isPointInRing(hole, lat, lng));
      if (!inHole)
        return feature;
    }
  }
  return null;
};

export const geocodeAddress = async ({ q, limit = 5, postcode, citycode }) => {
  const payload = { q };
  if (limit)
    payload.limit = limit;
  if (postcode)
    payload.postcode = postcode;
  if (citycode)
    payload.citycode = citycode;

  const res = await fetch(`${API_BASE_URL}/geo/geocode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur de géocodage (${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
};

