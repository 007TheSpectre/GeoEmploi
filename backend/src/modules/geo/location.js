import { ApiError } from '../../utils/errors.js';
import { geocodeAddress } from './ban.js';
import { toLambert93, fromLambert93 } from './lambert93.js';

const ADDRESS_FIELDS = ['postal_code', 'commune_code', 'city', 'commune'];

function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

export function bodyConcernsLocation(body = {}) {
  return ADDRESS_FIELDS.some((field) => isPresent(body[field]))
    || isPresent(body.latitude)
    || isPresent(body.longitude)
    || isPresent(body.lambert93_x)
    || isPresent(body.lambert93_y);
}

function assertCompletePairs(body) {
  if (isPresent(body.latitude) !== isPresent(body.longitude)) {
    throw new ApiError(400, 'latitude et longitude doivent être fournies ensemble');
  }
  if (isPresent(body.lambert93_x) !== isPresent(body.lambert93_y)) {
    throw new ApiError(400, 'lambert93_x et lambert93_y doivent être fournies ensemble');
  }
}

function buildLocation(latitude, longitude) {
  const lambert = toLambert93(latitude, longitude)
    ?? { lambert93_x: null, lambert93_y: null };
  return { latitude, longitude, ...lambert };
}

const NO_COORDINATES = { latitude: null, longitude: null, lambert93_x: null, lambert93_y: null };

async function resolveByAddress(body, required) {
  try {
    const hit = await geocodeAddress(body);
    if (!hit) {
      if (required) {
        throw new ApiError(400, 'Adresse introuvable dans la Base Adresse Nationale, vérifiez la saisie');
      }
      return NO_COORDINATES;
    }
    return buildLocation(hit.latitude, hit.longitude);
  } catch (err) {
    if (err instanceof ApiError)
      throw err;
    if (required) {
      throw new ApiError(502, 'Service de géocodage temporairement indisponible, réessayez plus tard');
    }
    console.error('Géocodage impossible (mode best-effort):', err.message);
    return {};
  }
}

export async function resolveLocation(body = {}, options = {}) {
  const { required = false } = options;

  assertCompletePairs(body);

  if (isPresent(body.latitude) && isPresent(body.longitude)) {
    return buildLocation(Number(body.latitude), Number(body.longitude));
  }

  if (isPresent(body.lambert93_x) && isPresent(body.lambert93_y)) {
    const point = fromLambert93(Number(body.lambert93_x), Number(body.lambert93_y));
    return buildLocation(point.latitude, point.longitude);
  }

  const hasAddress = ADDRESS_FIELDS.some((field) => isPresent(body[field]));
  if (!hasAddress) {
    if (required) {
      throw new ApiError(400, 'Latitude et longitude ou adresse requises (offre géolocalisée)');
    }
    return {};
  }

  return resolveByAddress(body, required);
}
