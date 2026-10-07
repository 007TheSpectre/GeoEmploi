import { query } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';

const CONTRACT_TYPES = ['CDI', 'CDD', 'interim', 'alternance', 'stage', 'freelance', 'autre'];

export async function searchOffers(req, res) {
  const {
    lat, lng, radius, keyword, contract_type, commune_code, departement_code,
    page = 1, limit = 20,
  } = req.query;

  const conditions = ["jo.status = 'active'"];
  const params = [];

  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (lat !== undefined && lng !== undefined && radius !== undefined) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(radiusNum) || radiusNum <= 0) {
      throw new ApiError(400, 'lat, lng et radius doivent être des nombres valides (radius > 0)');
    }
    conditions.push(`(
      6371.0 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${addParam(latNum)})) * cos(radians(jo.latitude))
          * cos(radians(jo.longitude) - radians(${addParam(lngNum)}))
          + sin(radians(${addParam(latNum)})) * sin(radians(jo.latitude))
        ))
      )) <= ${addParam(radiusNum)}`);
  }

  if (keyword) {
    conditions.push(`(jo.title ILIKE ${addParam(`%${keyword}%`)} OR jo.description ILIKE ${addParam(`%${keyword}%`)})`);
  }
  if (contract_type) {
    if (!CONTRACT_TYPES.includes(contract_type)) {
      throw new ApiError(400, `contract_type doit être une des valeurs: ${CONTRACT_TYPES.join(', ')}`);
    }
    conditions.push(`jo.contract_type = ${addParam(contract_type)}`);
  }
  if (commune_code) {
    conditions.push(`jo.commune_code = ${addParam(commune_code)}`);
  }
  if (departement_code) {
    conditions.push(`jo.departement_code = ${addParam(departement_code)}`);
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const where = conditions.join(' AND ');

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM job_offers jo WHERE ${where}`, params);
  const total = countRes.rows[0].total;

  const offset = (pageNum - 1) * limitNum;
  const dataRes = await query(
    `SELECT jo.id, jo.title, jo.description, jo.contract_type, jo.salary_min, jo.salary_max,
            jo.experience_years, jo.commune_code, jo.departement_code, jo.postal_code,
            jo.latitude, jo.longitude, jo.lambert93_x, jo.lambert93_y,
            jo.broadcast_radius_km,
            jo.published_at, jo.expires_at, jo.application_count,
            ep.company_name
     FROM job_offers jo
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE ${where}
     ORDER BY jo.published_at DESC
     LIMIT ${limitNum} OFFSET ${offset}`,
    params,
  );

  res.json({
    data: dataRes.rows,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
}

export async function getOfferById(req, res) {
  const { id } = req.params;

  const offerRes = await query(
    `SELECT jo.*, ep.company_name, ep.verification_status
     FROM job_offers jo
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE jo.id = $1 AND jo.status = 'active'`,
    [id],
  );
  const offer = offerRes.rows[0];
  if (!offer)
    throw new ApiError(404, 'Offre introuvable');

  const tagsRes = await query('SELECT tag FROM job_offer_tags WHERE job_id = $1 ORDER BY tag', [id]);
  offer.tags = tagsRes.rows.map((r) => r.tag);

  await query(
    `INSERT INTO job_offer_views (job_id, view_date, count)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (job_id, view_date) DO UPDATE SET count = job_offer_views.count + 1`,
    [id],
  );

  res.json(offer);
}
