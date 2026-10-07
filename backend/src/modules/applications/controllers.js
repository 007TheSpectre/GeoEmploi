import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { requireCandidate } from '../candidate/controllers.js';

export async function apply(req, res) {
  const candidate = await requireCandidate(req.user.id);
  const body = req.body;

  validate(body, {
    job_id: { type: 'int', required: true, min: 1 },
    cover_letter: { type: 'string', max: 10000 },
    cv_url: { type: 'string', max: 255 },
  });

  const offerRes = await query(
    `SELECT jo.*, ep.user_id AS employer_user_id
     FROM job_offers jo
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE jo.id = $1`,
    [body.job_id],
  );
  const offer = offerRes.rows[0];
  if (!offer)
    throw new ApiError(404, 'Offre introuvable');
  if (offer.status !== 'active')
    throw new ApiError(409, "L'offre n'est pas ouverte aux candidatures");
  if (offer.employer_user_id === req.user.id) {
    throw new ApiError(400, 'Vous ne pouvez pas candidater à votre propre offre');
  }

  const existing = await query(
    'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
    [offer.id, candidate.id],
  );
  if (existing.rowCount > 0)
    throw new ApiError(409, 'Vous avez déjà candidaté à cette offre');

  const application = await withTransaction(async (client) => {
    let row;
    try {
      const res = await client.query(
        `INSERT INTO applications (job_id, candidate_id, cover_letter, cv_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [offer.id, candidate.id, body.cover_letter ?? null, body.cv_url ?? candidate.cv_url ?? null],
      );
      row = res.rows[0];
    } catch (err) {
      if (err.code === '23505')
        throw new ApiError(409, 'Vous avez déjà candidaté à cette offre');
      throw err;
    }
    await client.query(
      'UPDATE job_offers SET application_count = application_count + 1 WHERE id = $1',
      [offer.id],
    );
    const notifBody = `${candidate.first_name} ${candidate.last_name} a postulé à « ${offer.title} »\n\n« Démonstrateur technique, ne constitue pas un service public en exploitation. »`;
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, 'new_application', $2, $3, $4)`,
      [
        offer.employer_user_id,
        'Nouvelle candidature reçue',
        notifBody,
        `/employer/offers/${offer.id}/applications`,
      ],
    );
    return row;
  });

  res.status(201).json(application);
}

export async function myApplications(req, res) {
  const candidate = await requireCandidate(req.user.id);

  const result = await query(
    `SELECT a.*,
            jo.title AS offer_title, jo.contract_type, jo.commune_code, jo.departement_code,
            jo.status AS offer_status, ep.company_name
     FROM applications a
     JOIN job_offers jo ON jo.id = a.job_id
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE a.candidate_id = $1
     ORDER BY a.created_at DESC`,
    [candidate.id],
  );
  res.json(result.rows);
}
