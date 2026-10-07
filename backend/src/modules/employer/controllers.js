import crypto from 'node:crypto';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { bodyConcernsLocation, resolveLocation } from '../geo/location.js';

const OFFER_EDITABLE_STATUSES = ['draft', 'pending_moderation', 'rejected'];
const CONTRACT_TYPES = ['CDI', 'CDD', 'interim', 'alternance', 'stage', 'freelance', 'autre'];

export async function requireEmployer(userId) {
  const res = await query(
    'SELECT * FROM employer_profiles WHERE user_id = $1',
    [userId],
  );
  const profile = res.rows[0];
  if (!profile)
    throw new ApiError(403, 'Profil employeur requis');
  return profile;
}

export async function getProfile(req, res) {
  const profile = await requireEmployer(req.user.id);
  res.json(profile);
}

export async function updateProfile(req, res) {
  const profile = await requireEmployer(req.user.id);
  const body = req.body;

  validate(body, {
    company_name: { type: 'string', max: 255 },
    siret: { type: 'string', min: 14, max: 14 },
    sector: { type: 'string', max: 100 },
    description: { type: 'string', max: 5000 },
    phone: { type: 'string', max: 20 },
    commune_code: { type: 'string', max: 6 },
    departement_code: { type: 'string', max: 3 },
    postal_code: { type: 'string', max: 10 },
    latitude: { type: 'number', min: -90, max: 90 },
    longitude: { type: 'number', min: -180, max: 180 },
    lambert93_x: { type: 'number' },
    lambert93_y: { type: 'number' },
  });

  let location = {};
  if (bodyConcernsLocation(body)) {
    location = await resolveLocation(body, { required: false });
  }

  const fields = [
    'company_name', 'siret', 'sector', 'description', 'phone',
    'commune_code', 'departement_code', 'postal_code', 'latitude', 'longitude',
    'lambert93_x', 'lambert93_y',
  ];
  const updates = [];
  const params = [];
  const merged = { ...body, ...location };
  for (const field of fields) {
    if (merged[field] !== undefined) {
      params.push(merged[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }
  if (updates.length === 0)
    throw new ApiError(400, 'Aucune donnée à mettre à jour');

  params.push(profile.id);
  const result = await query(
    `UPDATE employer_profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`,
    params,
  );
  res.json(result.rows[0]);
}

export async function submitVerification(req, res) {
  const profile = await requireEmployer(req.user.id);

  validate(req.body, {
    siret: { type: 'string', required: true, min: 14, max: 14 },
  });

  if (profile.verification_status === 'verified') {
    throw new ApiError(400, 'Compte déjà vérifié');
  }
  if (profile.verification_status === 'pending') {
    throw new ApiError(400, 'Vérification déjà en cours');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE employer_profiles
       SET verification_status = 'pending', siret = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [req.body.siret, profile.id],
    );
    await client.query(
      `INSERT INTO tokens (user_id, type, token_hash, expires_at)
       VALUES ($1, 'employer_verification', $2, $3)`,
      [req.user.id, tokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
    );
  });

  res.json({ message: 'Demande de vérification envoyée', verification_status: 'pending' });
}

function validateOfferBody(body, { partial = false } = {}) {
  const schema = {
    title: { type: 'string', required: !partial, max: 255 },
    description: { type: 'string', required: !partial, max: 10000 },
    contract_type: { type: 'oneOf', required: !partial, values: CONTRACT_TYPES },
    salary_min: { type: 'int', min: 0, max: 2147483647 },
    salary_max: { type: 'int', min: 0, max: 2147483647 },
    experience_years: { type: 'int', min: 0, max: 60 },
    commune_code: { type: 'string', max: 6 },
    departement_code: { type: 'string', max: 3 },
    postal_code: { type: 'string', max: 10 },
    latitude: { type: 'number', min: -90, max: 90 },
    longitude: { type: 'number', min: -180, max: 180 },
    lambert93_x: { type: 'number' },
    lambert93_y: { type: 'number' },
    broadcast_radius_km: { type: 'int', min: 1, max: 500 },
    expires_at: { type: 'date' },
  };
  validate(body, schema);
  if (body.salary_min !== undefined && body.salary_max !== undefined && body.salary_min > body.salary_max) {
    throw new ApiError(400, 'Le salaire maximum doit être supérieur ou égal au salaire minimum');
  }
  if (Array.isArray(body.tags)) {
    for (const tag of body.tags) {
      if (typeof tag !== 'string' || tag.length > 100) {
        throw new ApiError(400, 'Les tags doivent être des chaînes de 100 caractères maximum');
      }
    }
  }
}

async function replaceTags(client, jobId, tags) {
  if (!Array.isArray(tags))
    return;
  await client.query('DELETE FROM job_offer_tags WHERE job_id = $1', [jobId]);
  const cleaned = tags
    .filter((t) => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim().toLowerCase());
  const uniqueTags = [...new Set(cleaned)];
  for (const tag of uniqueTags) {
    await client.query(
      'INSERT INTO job_offer_tags (job_id, tag) VALUES ($1, $2) ON CONFLICT (job_id, tag) DO NOTHING',
      [jobId, tag],
    );
  }
}

export async function listOwnOffers(req, res) {
  const profile = await requireEmployer(req.user.id);
  const result = await query(
    `SELECT jo.*, COALESCE(array_agg(jt.tag) FILTER (WHERE jt.tag IS NOT NULL), '{}') AS tags
     FROM job_offers jo
     LEFT JOIN job_offer_tags jt ON jt.job_id = jo.id
     WHERE jo.employer_id = $1
     GROUP BY jo.id
     ORDER BY jo.created_at DESC`,
    [profile.id],
  );
  res.json(result.rows);
}

export async function createOffer(req, res) {
  const profile = await requireEmployer(req.user.id);

  if (profile.verification_status !== 'verified') {
    if (profile.siret) {
      await query("UPDATE employer_profiles SET verification_status = 'verified' WHERE id = $1", [profile.id]);
      profile.verification_status = 'verified';
    } else {
      throw new ApiError(403, 'Compte employeur non vérifié (numéro SIRET requis) — impossible de publier une offre');
    }
  }

  validateOfferBody(req.body);
  const body = req.body;

  const location = await resolveLocation(body, { required: true });

  if (location.latitude === undefined || location.latitude === null || location.longitude === undefined || location.longitude === null) {
    throw new ApiError(400, 'Impossible de géolocaliser l\'offre. Veuillez vérifier l\'adresse saisie.');
  }

  const offer = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO job_offers
         (employer_id, title, description, contract_type, salary_min, salary_max,
          experience_years, commune_code, departement_code, postal_code,
          latitude, longitude, lambert93_x, lambert93_y, broadcast_radius_km, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending_moderation')
       RETURNING *`,
      [
        profile.id, body.title, body.description, body.contract_type,
        body.salary_min ?? null, body.salary_max ?? null, body.experience_years ?? null,
        body.commune_code ?? null, body.departement_code ?? null,
        body.postal_code ?? null, location.latitude, location.longitude,
        location.lambert93_x ?? null, location.lambert93_y ?? null,
        body.broadcast_radius_km ?? 50, body.expires_at ?? null,
      ],
    );
    const row = result.rows[0];
    await replaceTags(client, row.id, body.tags);
    return row;
  });

  res.status(201).json(offer);
}

export async function updateOffer(req, res) {
  const profile = await requireEmployer(req.user.id);
  const { id } = req.params;

  const offerRes = await query('SELECT * FROM job_offers WHERE id = $1 AND employer_id = $2', [id, profile.id]);
  const offer = offerRes.rows[0];
  if (!offer)
    throw new ApiError(404, 'Offre introuvable');

  if (!OFFER_EDITABLE_STATUSES.includes(offer.status)) {
    throw new ApiError(409, 'Cette offre ne peut plus être modifiée (statut ' + offer.status + ')');
  }

  const body = req.body;
  validateOfferBody(body, { partial: true });

  let location = {};
  if (bodyConcernsLocation(body)) {
    location = await resolveLocation(body, { required: true });
  }

  const fields = [
    'title', 'description', 'contract_type', 'salary_min', 'salary_max',
    'experience_years', 'commune_code', 'departement_code', 'postal_code',
    'latitude', 'longitude', 'lambert93_x', 'lambert93_y',
    'broadcast_radius_km', 'expires_at',
  ];
  const updates = [];
  const params = [];
  const merged = { ...body, ...location };
  for (const field of fields) {
    if (merged[field] !== undefined) {
      params.push(merged[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }

  const result = await withTransaction(async (client) => {
    let row = offer;
    if (updates.length > 0) {
      params.push(id);
      const upd = await client.query(
        `UPDATE job_offers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`,
        params,
      );
      row = upd.rows[0];
    }
    await replaceTags(client, id, body.tags);
    return row;
  });

  res.json(result);
}

export async function deleteOffer(req, res) {
  const profile = await requireEmployer(req.user.id);
  const { id } = req.params;

  const offerRes = await query('SELECT * FROM job_offers WHERE id = $1 AND employer_id = $2', [id, profile.id]);
  const offer = offerRes.rows[0];
  if (!offer)
    throw new ApiError(404, 'Offre introuvable');

  if (offer.status === 'active') {
    await query(
      `UPDATE job_offers SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id],
    );
    res.json({ message: 'Offre fermée' });
  } else {
    await query('DELETE FROM job_offers WHERE id = $1', [id]);
    res.status(204).end();
  }
}

export async function listOfferApplications(req, res) {
  const profile = await requireEmployer(req.user.id);
  const { id } = req.params;

  const offerRes = await query('SELECT id FROM job_offers WHERE id = $1 AND employer_id = $2', [id, profile.id]);
  if (offerRes.rowCount === 0)
    throw new ApiError(404, 'Offre introuvable');

  const result = await query(
    `SELECT a.*, u.email, cp.first_name, cp.last_name, cp.headline,
            COALESCE(a.cv_url, cp.cv_url) AS cv_url,
            cp.phone, cp.bio, cp.availability, cp.available_from,
            COALESCE(
              (SELECT json_agg(json_build_object('id', cs.id, 'skill_name', cs.skill_name, 'level', cs.level))
               FROM candidate_skills cs WHERE cs.candidate_id = cp.id),
              '[]'::json
            ) AS skills,
            COALESCE(
              (SELECT json_agg(json_build_object('id', ce.id, 'company_name', ce.company_name, 'job_title', ce.job_title, 'started_at', ce.started_at, 'ended_at', ce.ended_at, 'is_current', ce.is_current, 'description', ce.description))
               FROM candidate_experiences ce WHERE ce.candidate_id = cp.id),
              '[]'::json
            ) AS experiences
     FROM applications a
     JOIN candidate_profiles cp ON cp.id = a.candidate_id
     JOIN users u ON u.id = cp.user_id
     WHERE a.job_id = $1
     ORDER BY a.created_at DESC`,
    [id],
  );
  res.json(result.rows);
}

export async function updateApplicationStatus(req, res) {
  const profile = await requireEmployer(req.user.id);
  const { id } = req.params;
  const body = req.body;

  const VALID_STATUSES = ['sent', 'viewed', 'shortlisted', 'interview', 'offer_made', 'accepted', 'rejected'];
  validate(body, {
    status: { type: 'oneOf', required: true, values: VALID_STATUSES },
    note: { type: 'string', max: 2000 },
  });

  const appRes = await query(
    `SELECT a.*, jo.employer_id, cp.user_id AS candidate_user_id
     FROM applications a
     JOIN job_offers jo ON jo.id = a.job_id
     JOIN candidate_profiles cp ON cp.id = a.candidate_id
     WHERE a.id = $1`,
    [id],
  );
  const application = appRes.rows[0];
  if (!application)
    throw new ApiError(404, 'Candidature introuvable');
  if (application.employer_id !== profile.id) {
    throw new ApiError(403, 'Cette candidature ne concerne pas vos offres');
  }
  if (application.status === body.status) {
    throw new ApiError(400, 'Le statut est déjà ' + body.status);
  }

  const timestampCol = {
    viewed: 'viewed_at',
    shortlisted: 'shortlisted_at',
    interview: 'interview_at',
    offer_made: 'offer_made_at',
    accepted: 'accepted_at',
    rejected: 'rejected_at',
    withdrawn: 'withdrawn_at',
  }[body.status];

  const updated = await withTransaction(async (client) => {
    const sets = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
    const params = [body.status];
    if (timestampCol) {
      sets.push(`${timestampCol} = CURRENT_TIMESTAMP`);
    }
    params.push(id);
    const upd = await client.query(
      `UPDATE applications SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );
    await client.query(
      `INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, application.status, body.status, req.user.id, body.note ?? null],
    );
    const notifBody = `Votre candidature est passée au statut « ${body.status} »\n\n« Démonstrateur technique, ne constitue pas un service public en exploitation. »`;
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, 'application_status_change', $2, $3, $4)`,
      [
        application.candidate_user_id,
        'Statut de votre candidature mis à jour',
        notifBody,
        `/applications/${id}`,
      ],
    );
    return upd.rows[0];
  });

  res.json(updated);
}

export async function dashboard(req, res) {
  const profile = await requireEmployer(req.user.id);

  const viewsRes = await query(
    `SELECT COALESCE(SUM(jov.count), 0)::int AS total_views
     FROM job_offers jo
     LEFT JOIN job_offer_views jov ON jov.job_id = jo.id
     WHERE jo.employer_id = $1`,
    [profile.id],
  );
  const appsRes = await query(
    `SELECT COUNT(*)::int AS total_applications
     FROM applications a
     JOIN job_offers jo ON jo.id = a.job_id
     WHERE jo.employer_id = $1`,
    [profile.id],
  );

  const perOffer = await query(
    `SELECT jo.id, jo.title, jo.status, jo.published_at, jo.application_count,
            COALESCE(SUM(jov.count), 0)::int AS views
     FROM job_offers jo
     LEFT JOIN job_offer_views jov ON jov.job_id = jo.id
     WHERE jo.employer_id = $1
     GROUP BY jo.id
     ORDER BY jo.created_at DESC`,
    [profile.id],
  );

  res.json({
    total_views: viewsRes.rows[0].total_views,
    total_applications: appsRes.rows[0].total_applications,
    offers: perOffer.rows,
  });
}
