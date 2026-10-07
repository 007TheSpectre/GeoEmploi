import argon2 from 'argon2';
import crypto from 'node:crypto';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { signToken, getAdminRole } from '../../middleware/auth.js';
import { resolveLocation } from '../geo/location.js';
import { verifySiret } from './siretService.js';

const TOKEN_TTL_MS = 60 * 60 * 1000;

const CANDIDATE_PROFILE_SCHEMA = {
  first_name: { type: 'string', required: true, max: 100 },
  last_name: { type: 'string', required: true, max: 100 },
  availability: { type: 'oneOf', values: ['immediate', 'within_1_month', 'within_3_months', 'not_available'] },
  headline: { type: 'string', max: 255 },
  phone: { type: 'string', max: 20 },
  desired_salary_min: { type: 'int' },
  desired_salary_max: { type: 'int' },
  search_radius_km: { type: 'int', min: 1, max: 500 },
};

const EMPLOYER_PROFILE_SCHEMA = {
  company_name: { type: 'string', required: true, max: 255 },
  siret: { type: 'string', min: 14, max: 14 },
  sector: { type: 'string', max: 100 },
  phone: { type: 'string', max: 20 },
  commune_code: { type: 'string', max: 6 },
  departement_code: { type: 'string', max: 3 },
  postal_code: { type: 'string', max: 10 },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
  lambert93_x: { type: 'number' },
  lambert93_y: { type: 'number' },
};

export async function register(req, res) {
  const { email, password, role, ...profile } = req.body;

  validate(req.body, {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, min: 8, max: 72 },
    role: { type: 'oneOf', required: true, values: ['candidate', 'employer'] },
  });

  validate(profile, role === 'candidate' ? CANDIDATE_PROFILE_SCHEMA : EMPLOYER_PROFILE_SCHEMA);

  let location = {};
  if (role === 'employer') {
    location = await resolveLocation(profile, { required: false });
  }

  const passwordHash = await argon2.hash(password);

  let user;
  try {
    ({ user } = await withTransaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, status, created_at`,
        [email, passwordHash, role],
      );
      const created = userRes.rows[0];

      if (role === 'candidate') {
        await client.query(
          `INSERT INTO candidate_profiles
             (user_id, first_name, last_name, headline, phone, availability,
              desired_salary_min, desired_salary_max, search_radius_km)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            created.id,
            profile.first_name,
            profile.last_name,
            profile.headline ?? null,
            profile.phone ?? null,
            profile.availability ?? 'immediate',
            profile.desired_salary_min ?? null,
            profile.desired_salary_max ?? null,
            profile.search_radius_km ?? 30,
          ],
        );
      } else {
        const verificationStatus = profile.siret ? 'verified' : 'unverified';
        await client.query(
          `INSERT INTO employer_profiles
             (user_id, company_name, siret, sector, phone,
              commune_code, departement_code, postal_code, latitude, longitude,
              lambert93_x, lambert93_y, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            created.id,
            profile.company_name,
            profile.siret ?? null,
            profile.sector ?? null,
            profile.phone ?? null,
            profile.commune_code ?? null,
            profile.departement_code ?? null,
            profile.postal_code ?? null,
            location.latitude ?? null,
            location.longitude ?? null,
            location.lambert93_x ?? null,
            location.lambert93_y ?? null,
            verificationStatus,
          ],
        );
      }

      return { user: created };
    }));
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'employer_profiles_siret_key' || err.detail?.includes('siret') || err.message?.includes('siret')) {
        throw new ApiError(400, 'Ce numéro SIRET est déjà associé à un autre compte employeur');
      }
      throw new ApiError(400, 'Cet email est déjà utilisé');
    }
    throw err;
  }

  res.status(201).json({ token: signToken(user.id, role), user });
}

export async function login(req, res) {
  const { email, password } = req.body;

  validate(req.body, {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
  });

  const resUser = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = resUser.rows[0];

  if (!user || !(await argon2.verify(user.password_hash, password))) {
    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Compte suspendu');
  }
  if (user.status === 'deleted') {
    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  const isAdmin = await getAdminRole(user.id);
  const role = isAdmin ? 'admin' : user.role;

  res.json({
    token: signToken(user.id, role),
    user: { id: user.id, email: user.email, role: role, status: user.status },
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  validate(req.body, { email: { type: 'email', required: true } });

  const resUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  const user = resUser.rows[0];

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  await argon2.hash(crypto.randomBytes(32).toString('hex'));

  if (user) {
    await query(
      `INSERT INTO tokens (user_id, type, token_hash, expires_at)
       VALUES ($1, 'password_reset', $2, $3)`,
      [user.id, tokenHash, new Date(Date.now() + TOKEN_TTL_MS)],
    );
  }

  const body = { message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' };
  if (process.env.NODE_ENV !== 'production') {
    body.token = token;
  }
  res.json(body);
}

export async function resetPassword(req, res) {
  const { token, new_password } = req.body;

  validate(req.body, {
    token: { type: 'string', required: true, max: 128 },
    new_password: { type: 'string', required: true, min: 8, max: 72 },
  });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resToken = await query(
    `SELECT id, user_id, expires_at, used_at FROM tokens
     WHERE type = 'password_reset' AND token_hash = $1`,
    [tokenHash],
  );
  const row = resToken.rows[0];

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    throw new ApiError(400, 'Token invalide ou expiré');
  }

  const passwordHash = await argon2.hash(new_password);

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, row.user_id]);
    await client.query('UPDATE tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [row.id]);
  });

  res.json({ message: 'Mot de passe réinitialisé' });
}

export async function getSiretInfo(req, res) {
  const { siret } = req.params;
  const result = await verifySiret(siret);

  if (!result.valid) {
    throw new ApiError(400, result.error || 'Numéro SIRET invalide', { details: result });
  }

  res.json({
    message: 'SIRET valide et vérifié',
    valid: true,
    data: result.etablissement,
    warning: result.warning || null,
  });
}

