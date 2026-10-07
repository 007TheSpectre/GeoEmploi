import argon2 from 'argon2';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { withLambert93 } from '../geo/lambert93.js';
import { getAdminRole } from '../../middleware/auth.js';

export async function getMe(req, res) {
  let userRes;
  try {
    userRes = await query(
      `SELECT id, email, role, status, geolocation_enabled, created_at, last_login_at FROM users WHERE id = $1`,
      [req.user.id],
    );
  } catch (err) {
    if (err.code === '42703' || (err.message && err.message.includes('geolocation_enabled'))) {
      userRes = await query(
        `SELECT id, email, role, status, created_at, last_login_at FROM users WHERE id = $1`,
        [req.user.id],
      );
      if (userRes.rows[0]) {
        userRes.rows[0].geolocation_enabled = false;
      }
    } else {
      throw err;
    }
  }
  const user = userRes.rows[0];
  if (!user)
    throw new ApiError(404, 'Utilisateur introuvable');
  if (user.geolocation_enabled === undefined) {
    user.geolocation_enabled = false;
  }

  const rawRole = user.role;
  const isAdmin = await getAdminRole(user.id);
  if (isAdmin) {
    user.role = 'admin';
    user.isAdmin = true;
    user.base_role = rawRole;
  }

  let profile = null;
  let stats = {};

  if (rawRole === 'candidate') {
    const pRes = await query('SELECT * FROM candidate_profiles WHERE user_id = $1', [user.id]);
    profile = pRes.rows[0] ?? null;

    const appsRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       WHERE cp.user_id = $1`,
      [user.id],
    );

    let savedCount = 0;
    try {
      const savedRes = await query(
        `SELECT COUNT(*)::int AS count
         FROM saved_job_offers s
         JOIN candidate_profiles cp ON cp.id = s.candidate_id
         WHERE cp.user_id = $1`,
        [user.id],
      );
      savedCount = savedRes.rows[0]?.count || 0;
    } catch {
      savedCount = 0;
    }

    stats = {
      saved_offers_count: savedCount,
      sent_applications_count: appsRes.rows[0]?.count || 0,
    };
  } else if (rawRole === 'employer') {
    const pRes = await query('SELECT * FROM employer_profiles WHERE user_id = $1', [user.id]);
    profile = pRes.rows[0] ?? null;

    const publishedRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM job_offers jo
       JOIN employer_profiles ep ON ep.id = jo.employer_id
       WHERE ep.user_id = $1`,
      [user.id],
    );

    const appsRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN job_offers jo ON jo.id = a.job_id
       JOIN employer_profiles ep ON ep.id = jo.employer_id
       WHERE ep.user_id = $1`,
      [user.id],
    );

    stats = {
      published_offers_count: publishedRes.rows[0]?.count || 0,
      received_applications_count: appsRes.rows[0]?.count || 0,
    };
  }

  res.json({ user, profile, stats });
}

export async function getUserStats(req, res) {
  const userId = req.user.id;
  const userRes = await query('SELECT role FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];

  if (!user) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }

  if (user.role === 'employer') {
    const publishedRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM job_offers jo
       JOIN employer_profiles ep ON ep.id = jo.employer_id
       WHERE ep.user_id = $1`,
      [userId],
    );

    const applicationsRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN job_offers jo ON jo.id = a.job_id
       JOIN employer_profiles ep ON ep.id = jo.employer_id
       WHERE ep.user_id = $1`,
      [userId],
    );

    return res.json({
      role: 'employer',
      published_offers_count: publishedRes.rows[0]?.count || 0,
      received_applications_count: applicationsRes.rows[0]?.count || 0,
    });
  } else {
    const applicationsRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM applications a
       JOIN candidate_profiles cp ON cp.id = a.candidate_id
       WHERE cp.user_id = $1`,
      [userId],
    );

    let savedCount = 0;
    try {
      const savedRes = await query(
        `SELECT COUNT(*)::int AS count
         FROM saved_job_offers s
         JOIN candidate_profiles cp ON cp.id = s.candidate_id
         WHERE cp.user_id = $1`,
        [userId],
      );
      savedCount = savedRes.rows[0]?.count || 0;
    } catch {
      savedCount = 0;
    }

    return res.json({
      role: 'candidate',
      saved_offers_count: savedCount,
      sent_applications_count: applicationsRes.rows[0]?.count || 0,
    });
  }
}

const CANDIDATE_PROFILE_IDS = `SELECT id FROM candidate_profiles WHERE user_id = $1`;

async function anonymizeCandidate(client, userId) {
  await client.query(`DELETE FROM saved_job_offers WHERE candidate_id IN (${CANDIDATE_PROFILE_IDS})`, [userId]);
  await client.query(`DELETE FROM candidate_skills WHERE candidate_id IN (${CANDIDATE_PROFILE_IDS})`, [userId]);
  await client.query(`DELETE FROM candidate_experiences WHERE candidate_id IN (${CANDIDATE_PROFILE_IDS})`, [userId]);
  await client.query(`DELETE FROM candidate_educations WHERE candidate_id IN (${CANDIDATE_PROFILE_IDS})`, [userId]);

  await client.query(
    `UPDATE candidate_profiles
     SET first_name = 'Utilisateur', last_name = 'Anonyme',
         headline = NULL, bio = NULL, phone = NULL, cv_url = NULL, photo_url = NULL,
         commune_code = NULL, departement_code = NULL, postal_code = NULL,
         latitude = NULL, longitude = NULL, lambert93_x = NULL, lambert93_y = NULL,
         availability = 'not_available', is_profile_public = FALSE
     WHERE user_id = $1`,
    [userId],
  );

  await client.query(
    `UPDATE applications
     SET cover_letter = NULL, cv_url = NULL
     WHERE candidate_id IN (${CANDIDATE_PROFILE_IDS})`,
    [userId],
  );
}

async function anonymizeEmployer(client, userId) {
  await client.query(
    `UPDATE employer_profiles
     SET company_name = 'Compte supprimé', siret = NULL, sector = NULL, description = NULL,
         phone = NULL, commune_code = NULL, departement_code = NULL,
         postal_code = NULL, latitude = NULL, longitude = NULL,
         lambert93_x = NULL, lambert93_y = NULL, verification_status = 'unverified'
     WHERE user_id = $1`,
    [userId],
  );

  await client.query(
    `UPDATE job_offers
     SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE employer_id = (SELECT id FROM employer_profiles WHERE user_id = $1)
       AND status IN ('draft', 'pending_moderation', 'active')`,
    [userId],
  );
}

export async function deleteMe(req, res) {
  const id = req.user.id;
  const { password } = req.body || {};

  await withTransaction(async (client) => {
    const userRes = await client.query(
      "SELECT id, password_hash, role FROM users WHERE id = $1 AND status <> 'deleted'",
      [id],
    );
    const user = userRes.rows[0];
    if (!user) {
      throw new ApiError(404, 'Utilisateur introuvable ou déjà supprimé');
    }

    if (password) {
      const isValid = await argon2.verify(user.password_hash, password);
      if (!isValid) {
        throw new ApiError(401, 'Mot de passe incorrect');
      }
    }

    if (user.role === 'candidate') {
      await anonymizeCandidate(client, id);
    } else if (user.role === 'employer') {
      await anonymizeEmployer(client, id);
    }

    await client.query("UPDATE admins SET full_name = 'Administrateur Anonyme' WHERE user_id = $1", [id]);
    await client.query('DELETE FROM tokens WHERE user_id = $1', [id]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);

    await client.query(
      `UPDATE users
       SET status = 'deleted',
           email = CONCAT('deleted-', id, '@anonyme.local'),
           password_hash = '',
           geolocation_enabled = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id],
    );
  });

  res.status(204).end();
}

export async function exportUserData(req, res) {
  const userId = req.user.id;

  const userRes = await query(
    `SELECT id, email, role, status, created_at, updated_at, last_login_at 
     FROM users 
     WHERE id = $1`,
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }

  const exportData = {
    metadata: {
      platform: 'GéoEmploi',
      export_date: new Date().toISOString(),
      legal_framework: 'RGPD Article 20 - Droit à la portabilité des données',
      user_id: user.id,
      user_email: user.email,
      role: user.role,
    },
    account: user,
    profile: null,
    activities: {},
    notifications: [],
  };

  try {
    const notifsRes = await query(
      `SELECT id, type, title, body, link, is_read, read_at, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    exportData.notifications = notifsRes.rows;
  } catch {
    exportData.notifications = [];
  }

  const adminRes = await query(
    `SELECT id, full_name, created_at FROM admins WHERE user_id = $1`,
    [userId]
  );
  const adminProfile = adminRes.rows[0] || null;

  const effectiveRole = adminProfile ? 'admin' : user.role;
  exportData.metadata.role = effectiveRole;

  if (adminProfile) {
    exportData.profile = adminProfile;
    exportData.admin_profile = adminProfile;
  }

  const candRes = await query(
    `SELECT id, first_name, last_name, headline, bio, phone, cv_url, photo_url,
            availability, available_from, desired_salary_min, desired_salary_max,
            commune_code, departement_code, postal_code, latitude, longitude,
            search_radius_km, is_profile_public, created_at, updated_at
     FROM candidate_profiles 
     WHERE user_id = $1`,
    [userId]
  );
  const candidateProfile = candRes.rows[0] || null;

  if (candidateProfile) {
    if (!adminProfile || user.role === 'candidate') {
      exportData.profile = withLambert93(candidateProfile);
    }
    const expRes = await query(
      `SELECT id, company_name, job_title, description, started_at, ended_at, is_current, created_at
       FROM candidate_experiences
       WHERE candidate_id = $1
       ORDER BY started_at DESC`,
      [candidateProfile.id]
    );
    const eduRes = await query(
      `SELECT id, institution, degree, field_of_study, started_at, ended_at, created_at
       FROM candidate_educations
       WHERE candidate_id = $1
       ORDER BY started_at DESC`,
      [candidateProfile.id]
    );
    const skillsRes = await query(
      `SELECT id, skill_name, level
       FROM candidate_skills
       WHERE candidate_id = $1
       ORDER BY skill_name ASC`,
      [candidateProfile.id]
    );

    exportData.profile_details = {
      experiences: expRes.rows,
      educations: eduRes.rows,
      skills: skillsRes.rows,
    };

    const appsRes = await query(
      `SELECT a.id, a.job_id, jo.title AS job_title, ep.company_name, 
              a.cover_letter, a.cv_url, a.status, a.created_at, a.updated_at
       FROM applications a
       JOIN job_offers jo ON jo.id = a.job_id
       LEFT JOIN employer_profiles ep ON ep.id = jo.employer_id
       WHERE a.candidate_id = $1
       ORDER BY a.created_at DESC`,
      [candidateProfile.id]
    );
    exportData.activities.sent_applications = appsRes.rows;

    try {
      const savedRes = await query(
        `SELECT s.id, s.job_id, jo.title AS job_title, ep.company_name, jo.contract_type,
                jo.commune_code, jo.departement_code, jo.postal_code, jo.salary_min, jo.salary_max, s.created_at AS saved_at
         FROM saved_job_offers s
         JOIN job_offers jo ON jo.id = s.job_id
         LEFT JOIN employer_profiles ep ON ep.id = jo.employer_id
         WHERE s.candidate_id = $1
         ORDER BY s.created_at DESC`,
        [candidateProfile.id]
      );
      exportData.activities.saved_offers = savedRes.rows;
    } catch {
      exportData.activities.saved_offers = [];
    }
  }

  const empRes = await query(
    `SELECT id, company_name, siret, sector, description, phone,
            commune_code, departement_code, postal_code, latitude, longitude,
            verification_status, created_at, updated_at
     FROM employer_profiles
     WHERE user_id = $1`,
    [userId]
  );
  const employerProfile = empRes.rows[0] || null;

  if (employerProfile) {
    if (!adminProfile || user.role === 'employer') {
      exportData.profile = withLambert93(employerProfile);
    }
    const offersRes = await query(
      `SELECT id, title, description, contract_type, salary_min, salary_max,
              experience_years, broadcast_radius_km, postal_code, commune_code,
              departement_code, latitude, longitude, status, application_count, published_at,
              expires_at, created_at, updated_at
       FROM job_offers
       WHERE employer_id = $1
       ORDER BY created_at DESC`,
      [employerProfile.id]
    );
    exportData.activities.published_offers = offersRes.rows.map(withLambert93);

    const receivedRes = await query(
      `SELECT a.id, a.job_id, jo.title AS job_title, a.candidate_id,
              cp.first_name, cp.last_name, a.cover_letter, a.status,
              a.created_at, a.updated_at
       FROM applications a
       JOIN job_offers jo ON jo.id = a.job_id
       LEFT JOIN candidate_profiles cp ON cp.id = a.candidate_id
       WHERE jo.employer_id = $1
       ORDER BY a.created_at DESC`,
      [employerProfile.id]
    );
    exportData.activities.received_applications = receivedRes.rows;
  }

  const safeFilename = `donnees-geoemploi-${user.email.replace(/[^a-zA-Z0-9@._-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(JSON.stringify(exportData, null, 2));
}

export async function updatePreferences(req, res) {
  const userId = req.user.id;
  const { geolocation_enabled } = req.body;

  if (typeof geolocation_enabled !== 'boolean') {
    throw new ApiError(400, 'Le paramètre geolocation_enabled doit être un booléen');
  }

  let updatedUser;
  try {
    const result = await query(
      `UPDATE users 
       SET geolocation_enabled = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, email, role, status, geolocation_enabled`,
      [geolocation_enabled, userId]
    );
    updatedUser = result.rows[0];
  } catch (err) {
    if (err.code === '42703' || (err.message && err.message.includes('geolocation_enabled'))) {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS geolocation_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
      const result = await query(
        `UPDATE users 
         SET geolocation_enabled = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id, email, role, status, geolocation_enabled`,
        [geolocation_enabled, userId]
      );
      updatedUser = result.rows[0];
    } else {
      throw err;
    }
  }
  if (!updatedUser) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }

  if (!geolocation_enabled) {
    await query(
      `UPDATE candidate_profiles 
       SET latitude = NULL, longitude = NULL, updated_at = NOW() 
       WHERE user_id = $1`,
      [userId]
    );
  }

  res.json({
    success: true,
    user: updatedUser,
    geolocation_enabled: updatedUser.geolocation_enabled,
    message: geolocation_enabled
      ? 'Géolocalisation activée avec succès'
      : 'Géolocalisation désactivée et données de localisation purgées avec succès'
  });
}

