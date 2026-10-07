import { query } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { bodyConcernsLocation, resolveLocation } from '../geo/location.js';

export async function requireCandidate(userId) {
  let profileRes = await query('SELECT * FROM candidate_profiles WHERE user_id = $1', [userId]);
  let profile = profileRes.rows[0];
  if (!profile) {
    const userRes = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount > 0) {
      const email = userRes.rows[0].email || 'Utilisateur';
      const namePart = email.split('@')[0] || 'User';
      const ins = await query(
        `INSERT INTO candidate_profiles (user_id, first_name, last_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING *`,
        [userId, namePart, 'Compte'],
      );
      if (ins.rows[0]) {
        profile = ins.rows[0];
      } else {
        const recheck = await query('SELECT * FROM candidate_profiles WHERE user_id = $1', [userId]);
        profile = recheck.rows[0];
      }
    } else {
      throw new ApiError(403, 'Profil candidat requis');
    }
  }
  return profile;
}

export async function getProfile(req, res) {
  const profile = await requireCandidate(req.user.id);
  const candidate = await query('SELECT * FROM candidate_profiles WHERE user_id = $1', [req.user.id]);
  res.json(candidate.rows[0]);
}

export async function updateProfile(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const body = req.body;

  validate(body, {
    headline: { type: 'string', min: 0, max: 255 },
    bio: { type: 'string', min: 0, max: 1000 },
    phone: { type: 'string', min: 0, max: 20 },
    cv_url: { type: 'string', min: 0, max: 255 },
    photo_url: { type: 'string', min: 0, max: 255 },
    availability: { type: 'oneOf', values: ['immediate', 'within_1_month', 'within_3_months', 'not_available'] },
    available_from: { type: 'date' },
    desired_salary_min: { type: 'int' },
    desired_salary_max: { type: 'int' },
    commune_code: { type: 'string', min: 0, max: 6 },
    departement_code: { type: 'string', min: 0, max: 3 },
    postal_code: { type: 'string', min: 0, max: 10 },
    latitude: { type: 'number', min: -90, max: 90 },
    longitude: { type: 'number', min: -180, max: 180 },
    lambert93_x: { type: 'number' },
    lambert93_y: { type: 'number' },
    search_radius_km: { type: 'int', min: 1, max: 500 },
    is_profile_public: { type: 'boolean' },
  });

  let location = {};
  if (bodyConcernsLocation(body)) {
    location = await resolveLocation(body, { required: false });
  }

  const fields = [
    'headline', 'bio', 'phone', 'cv_url', 'photo_url', 'availability',
    'available_from', 'desired_salary_min', 'desired_salary_max',
    'commune_code', 'departement_code', 'postal_code',
    'latitude', 'longitude', 'lambert93_x', 'lambert93_y',
    'search_radius_km', 'is_profile_public',
  ];
  const updates = [];
  const params = [];
  const merged = { ...body, ...location };

  const stringFieldsToNull = ['headline', 'bio', 'phone', 'cv_url', 'photo_url', 'commune_code', 'departement_code', 'postal_code'];
  for (const f of stringFieldsToNull) {
    if (typeof merged[f] === 'string' && merged[f].trim() === '') {
      merged[f] = null;
    }
  }

  for (const field of fields) {
    if (merged[field] !== undefined) {
      params.push(merged[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }
  if (updates.length === 0)
    throw new ApiError(400, 'Aucune donnée à mettre à jour');

  params.push(id);
  const result = await query(
    `UPDATE candidate_profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`,
    params,
  );
  res.json(result.rows[0]);
}

export async function listExperiences(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'SELECT * FROM candidate_experiences WHERE candidate_id = $1 ORDER BY started_at DESC',
    [id],
  );
  res.json(result.rows);
}

export async function addExperience(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const body = req.body;

  validate(body, {
    company_name: { type: 'string', required: true, max: 255 },
    job_title: { type: 'string', required: true, max: 255 },
    description: { type: 'string', min: 0, max: 5000 },
    started_at: { type: 'date', required: true },
    ended_at: { type: 'date' },
    is_current: { type: 'boolean' },
  });

  const result = await query(
    `INSERT INTO candidate_experiences (candidate_id, company_name, job_title, description, started_at, ended_at, is_current)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, body.company_name, body.job_title, body.description ?? null, body.started_at, body.ended_at ?? null, body.is_current ?? false],
  );
  res.status(201).json(result.rows[0]);
}

export async function updateExperience(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const { id: expId } = req.params;
  const body = req.body;

  validate(body, {
    company_name: { type: 'string', max: 255 },
    job_title: { type: 'string', max: 255 },
    description: { type: 'string', max: 5000 },
    started_at: { type: 'date' },
    ended_at: { type: 'date' },
    is_current: { type: 'boolean' },
  });

  const fields = ['company_name', 'job_title', 'description', 'started_at', 'ended_at', 'is_current'];
  const updates = [];
  const params = [];
  for (const field of fields) {
    if (body[field] !== undefined) {
      params.push(body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }
  if (updates.length === 0)
    throw new ApiError(400, 'Aucune donnée à mettre à jour');

  params.push(expId, id);
  const result = await query(
    `UPDATE candidate_experiences SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND candidate_id = $${params.length} RETURNING *`,
    params,
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Expérience introuvable');
  res.json(result.rows[0]);
}

export async function removeExperience(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'DELETE FROM candidate_experiences WHERE id = $1 AND candidate_id = $2',
    [req.params.id, id],
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Expérience introuvable');
  res.status(204).end();
}

export async function listEducations(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'SELECT * FROM candidate_educations WHERE candidate_id = $1 ORDER BY started_at DESC',
    [id],
  );
  res.json(result.rows);
}

export async function addEducation(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const body = req.body;

  validate(body, {
    institution: { type: 'string', required: true, max: 255 },
    degree: { type: 'string', required: true, max: 255 },
    field_of_study: { type: 'string', max: 255 },
    started_at: { type: 'date', required: true },
    ended_at: { type: 'date' },
  });

  const result = await query(
    `INSERT INTO candidate_educations (candidate_id, institution, degree, field_of_study, started_at, ended_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, body.institution, body.degree, body.field_of_study ?? null, body.started_at, body.ended_at ?? null],
  );
  res.status(201).json(result.rows[0]);
}

export async function updateEducation(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const { id: eduId } = req.params;
  const body = req.body;

  validate(body, {
    institution: { type: 'string', max: 255 },
    degree: { type: 'string', max: 255 },
    field_of_study: { type: 'string', max: 255 },
    started_at: { type: 'date' },
    ended_at: { type: 'date' },
  });

  const fields = ['institution', 'degree', 'field_of_study', 'started_at', 'ended_at'];
  const updates = [];
  const params = [];
  for (const field of fields) {
    if (body[field] !== undefined) {
      params.push(body[field]);
      updates.push(`${field} = $${params.length}`);
    }
  }
  if (updates.length === 0)
    throw new ApiError(400, 'Aucune donnée à mettre à jour');

  params.push(eduId, id);
  const result = await query(
    `UPDATE candidate_educations SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND candidate_id = $${params.length} RETURNING *`,
    params,
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Formation introuvable');
  res.json(result.rows[0]);
}

export async function removeEducation(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'DELETE FROM candidate_educations WHERE id = $1 AND candidate_id = $2',
    [req.params.id, id],
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Formation introuvable');
  res.status(204).end();
}

export async function listSkills(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'SELECT id, skill_name, level FROM candidate_skills WHERE candidate_id = $1 ORDER BY skill_name',
    [id],
  );
  res.json(result.rows);
}

export async function addSkill(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const body = req.body;

  validate(body, {
    skill_name: { type: 'string', required: true, max: 100 },
    level: { type: 'int', min: 1, max: 5 },
  });

  const result = await query(
    `INSERT INTO candidate_skills (candidate_id, skill_name, level)
     VALUES ($1, $2, $3)
     ON CONFLICT (candidate_id, skill_name) DO UPDATE SET level = EXCLUDED.level
     RETURNING id, skill_name, level`,
    [id, body.skill_name, body.level ?? null],
  );
  res.status(201).json(result.rows[0]);
}

export async function removeSkill(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    'DELETE FROM candidate_skills WHERE id = $1 AND candidate_id = $2',
    [req.params.id, id],
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Compétence introuvable');
  res.status(204).end();
}

export async function getSavedOffers(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const result = await query(
    `SELECT s.id AS saved_id, s.created_at AS saved_at,
            jo.*,
            ep.company_name
     FROM saved_job_offers s
     JOIN job_offers jo ON jo.id = s.job_id
     LEFT JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE s.candidate_id = $1
     ORDER BY s.created_at DESC`,
    [id],
  );
  res.json({ data: result.rows });
}

export async function saveOffer(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const jobId = Number(req.params.id || req.body?.job_id);
  if (!jobId || isNaN(jobId)) {
    throw new ApiError(400, 'Identifiant d\'offre invalide');
  }

  const jobCheck = await query('SELECT id FROM job_offers WHERE id = $1', [jobId]);
  if (jobCheck.rowCount === 0) {
    throw new ApiError(404, 'Offre introuvable');
  }

  const result = await query(
    `INSERT INTO saved_job_offers (candidate_id, job_id)
     VALUES ($1, $2)
     ON CONFLICT (candidate_id, job_id) DO UPDATE SET created_at = CURRENT_TIMESTAMP
     RETURNING id, candidate_id, job_id, created_at`,
    [id, jobId],
  );
  res.status(201).json(result.rows[0]);
}

export async function unsaveOffer(req, res) {
  const { id } = await requireCandidate(req.user.id);
  const jobId = Number(req.params.id);
  if (!jobId || isNaN(jobId)) {
    throw new ApiError(400, 'Identifiant d\'offre invalide');
  }

  const result = await query(
    'DELETE FROM saved_job_offers WHERE candidate_id = $1 AND job_id = $2',
    [id, jobId],
  );
  if (result.rowCount === 0) {
    throw new ApiError(404, 'Offre non trouvée dans vos favoris');
  }
  res.status(204).end();
}
