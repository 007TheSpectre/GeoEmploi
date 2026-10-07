import proj4 from 'proj4';

// Définition de la projection Lambert-93 (EPSG:2154), projection conique
// conforme utilisée en France métropolitaine :
// - lat_1 / lat_2 : parallèles de référence (49°N et 44°N) ;
// - lat_0 / lon_0 : latitude et longitude de l'origine ;
// - x_0 / y_0 : faux est / faux nord appliqués aux coordonnées ;
// - ellps=GRS80 : ellipsoïde de référence ;
// - units=m : coordonnées exprimées en mètres.
proj4.defs(
  'EPSG:2154',
  '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 '
    + '+x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs',
);

const WGS84 = 'EPSG:4326';
const LAMBERT93 = 'EPSG:2154';

const ZONE_BOUNDS = { minLat: 41, maxLat: 52, minLng: -6, maxLng: 10 };

function inProjectionZone(latitude, longitude) {
  return latitude >= ZONE_BOUNDS.minLat
    && latitude <= ZONE_BOUNDS.maxLat
    && longitude >= ZONE_BOUNDS.minLng
    && longitude <= ZONE_BOUNDS.maxLng;
}

function asFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function toLambert93(latitude, longitude) {
  const lat = asFiniteNumber(latitude);
  const lng = asFiniteNumber(longitude);
  if (lat === null || lng === null)
    return null;
  if (!inProjectionZone(lat, lng))
    return null;
  const [x, y] = proj4(WGS84, LAMBERT93, [lng, lat]);
  return { lambert93_x: x, lambert93_y: y };
}

export function toLambert93Rounded(latitude, longitude) {
  const point = toLambert93(latitude, longitude);
  if (!point)
    return null;
  return {
    lambert93_x: Math.round(point.lambert93_x),
    lambert93_y: Math.round(point.lambert93_y),
  };
}

export function withLambert93(record = {}) {
  const lambert = toLambert93Rounded(record.latitude, record.longitude);
  return {
    ...record,
    lambert93_x: lambert ? lambert.lambert93_x : null,
    lambert93_y: lambert ? lambert.lambert93_y : null,
  };
}

export function fromLambert93(lambert93_x, lambert93_y) {
  const [longitude, latitude] = proj4(LAMBERT93, WGS84, [lambert93_x, lambert93_y]);
  return { latitude, longitude };
}
