import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { searchAddress, reverseGeocode } from './ban.js';

export async function geocode(req, res) {
  const body = req.body ?? {};
  validate(body, {
    q: { type: 'string', required: true, min: 2, max: 500 },
    limit: { type: 'int', min: 1, max: 20 },
    postcode: { type: 'string', max: 10 },
    citycode: { type: 'string', max: 6 },
  });

  const query = body.q.trim();
  if (query.length < 2) {
    throw new ApiError(400, 'q doit contenir au moins 2 caractères');
  }

  let results;
  try {
    results = await searchAddress({
      q: query,
      limit: body.limit ?? 5,
      postcode: body.postcode,
      citycode: body.citycode,
    });
  } catch (_err) {
    throw new ApiError(502, 'Service de géocodage temporairement indisponible');
  }

  res.json({ data: results });
}

export async function reverse(req, res) {
  const body = req.body ?? {};
  validate(body, {
    latitude: { type: 'number', required: true, min: -90, max: 90 },
    longitude: { type: 'number', required: true, min: -180, max: 180 },
    limit: { type: 'int', min: 1, max: 20 },
  });

  let results;
  try {
    results = await reverseGeocode({
      latitude: body.latitude,
      longitude: body.longitude,
      limit: body.limit ?? 1,
    });
  } catch (_err) {
    throw new ApiError(502, 'Service de géocodage temporairement indisponible');
  }

  res.json({ data: results });
}
