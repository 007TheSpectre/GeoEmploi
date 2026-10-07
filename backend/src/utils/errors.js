export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFoundHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

const PG_ERROR_STATUS = {
  23505: { status: 409, message: 'Conflit : cette valeur est déjà utilisée' },
  23503: { status: 409, message: 'Opération refusée : donnée référencée introuvable' },
  23502: { status: 400, message: 'Un champ obligatoire est manquant' },
  23514: { status: 400, message: 'La valeur saisie n\'est pas autorisée' },
  22003: { status: 400, message: 'Valeur numérique hors limites' },
  '22P02': { status: 400, message: 'Format de donnée invalide' },
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corps de requête JSON invalide' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }

  const pgMapping = PG_ERROR_STATUS[err.code];
  if (pgMapping) {
    if (err.code === '23505') {
      if (err.constraint === 'employer_profiles_siret_key' || err.detail?.includes('siret')) {
        return res.status(409).json({ error: 'Ce numéro SIRET est déjà associé à un autre compte employeur' });
      }
      if (err.constraint === 'users_email_key' || err.detail?.includes('email')) {
        return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
      }
      if (err.constraint === 'uq_job_offer_tags_job_tag') {
        return res.status(409).json({ error: 'Un mot-clé / tag est présent en doublon sur cette offre' });
      }
    }
    const detailMsg = err.constraint ? ` (${err.constraint})` : '';
    return res.status(pgMapping.status).json({ error: `${pgMapping.message}${detailMsg}` });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
