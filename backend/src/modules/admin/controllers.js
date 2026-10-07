import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { withLambert93 } from '../geo/lambert93.js';

const USER_FIELDS = ['id', 'email', 'role', 'status', 'created_at', 'last_login_at', 'suspended_at', 'suspension_reason'];

async function requireAdmin(userId) {
  const adminRes = await query('SELECT id FROM admins WHERE user_id = $1', [userId]);
  const admin = adminRes.rows[0];
  if (!admin)
    throw new ApiError(403, 'Accès administrateur requis');
  return admin;
}

async function logModeration(client, adminId, { action, jobId = null, userId = null, reason = null }) {
  await client.query(
    `INSERT INTO moderation_logs (admin_id, job_id, user_id, action, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, jobId, userId, action, reason],
  );
}

async function notify(client, userId, type, title, body, link = null) {
  const fullBody = `${body}\n\n« Démonstrateur technique, ne constitue pas un service public en exploitation. »`;
  await client.query(
    `INSERT INTO notifications (user_id, type, title, body, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, fullBody, link],
  );
}

export async function metrics(req, res) {
  await requireAdmin(req.user.id);

  const [offers, users, candidates, employers, applications, pendingReports] = await Promise.all([
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM job_offers"),
    query('SELECT COUNT(*)::int AS total FROM users WHERE status <> \'deleted\''),
    query('SELECT COUNT(*)::int AS total FROM candidate_profiles'),
    query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE verification_status = \'verified\')::int AS verified FROM employer_profiles'),
    query('SELECT COUNT(*)::int AS total FROM applications'),
    query("SELECT COUNT(*)::int AS total FROM reports WHERE status = 'pending'"),
  ]);

  res.json({
    job_offers: offers.rows[0],
    users: users.rows[0],
    candidates: candidates.rows[0],
    employers: employers.rows[0],
    applications: applications.rows[0],
    pending_reports: pendingReports.rows[0].total,
  });
}

export async function listUsers(req, res) {
  await requireAdmin(req.user.id);

  const { role, status, search, page = 1, limit = 20 } = req.query;

  const conditions = ["u.status <> 'deleted'"];
  const params = [];
  if (role && ['candidate', 'employer'].includes(role)) {
    params.push(role);
    conditions.push(`u.role = $${params.length}`);
  }
  if (status && ['active', 'suspended'].includes(status)) {
    params.push(status);
    conditions.push(`u.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.email ILIKE $${params.length} OR cp.first_name ILIKE $${params.length} OR cp.last_name ILIKE $${params.length} OR ep.company_name ILIKE $${params.length})`);
  }

  const where = conditions.join(' AND ');
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const countRes = await query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
     LEFT JOIN employer_profiles ep ON ep.user_id = u.id
     WHERE ${where}`,
    params,
  );
  const total = countRes.rows[0].total;

  const result = await query(
    `SELECT u.id, u.email, u.role, u.status, u.created_at, u.last_login_at, u.suspended_at, u.suspension_reason,
            cp.first_name, cp.last_name,
            ep.id AS employer_profile_id, ep.company_name, ep.siret, ep.verification_status
     FROM users u
     LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
     LEFT JOIN employer_profiles ep ON ep.user_id = u.id
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT ${limitNum} OFFSET ${(pageNum - 1) * limitNum}`,
    params,
  );

  res.json({ data: result.rows, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
}

export async function updateUserStatus(req, res) {
  const admin = await requireAdmin(req.user.id);
  const { id } = req.params;
  const body = req.body;

  validate(body, {
    status: { type: 'oneOf', required: true, values: ['active', 'suspended'] },
    reason: { type: 'string', max: 2000 },
  });

  const userRes = await query('SELECT id, status FROM users WHERE id = $1', [id]);
  const user = userRes.rows[0];
  if (!user || user.status === 'deleted')
    throw new ApiError(404, 'Utilisateur introuvable');
  if (user.status === body.status)
    throw new ApiError(400, 'Le compte est déjà ' + body.status);

  const isSuspension = body.status === 'suspended';

  const updated = await withTransaction(async (client) => {
    let sql;
    const params = [];
    if (isSuspension) {
      sql = `UPDATE users SET status = 'suspended', suspended_at = CURRENT_TIMESTAMP, suspended_by = $1, suspension_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, status`;
      params.push(req.user.id, body.reason ?? null, id);
    } else {
      sql = `UPDATE users SET status = 'active', suspended_at = NULL, suspended_by = NULL, suspension_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, status`;
      params.push(id);
    }
    const upd = await client.query(sql, params);

    await logModeration(client, admin.id, {
      action: isSuspension ? 'suspended' : 'reactivated',
      userId: id,
      reason: body.reason ?? null,
    });

    await notify(
      client,
      id,
      isSuspension ? 'account_suspended' : 'account_activated',
      isSuspension ? 'Compte suspendu' : 'Compte réactivé',
      isSuspension
        ? (body.reason ?? 'Votre compte a été suspendu.')
        : 'Votre compte a été réactivé.',
    );

    return upd.rows[0];
  });

  res.json(updated);
}

export async function listOffers(req, res) {
  await requireAdmin(req.user.id);

  const { status, page = 1, limit = 20 } = req.query;

  const VALID = ['draft', 'pending_moderation', 'active', 'rejected', 'expired', 'closed'];
  const conditions = [];
  const params = [];
  if (status && VALID.includes(status)) {
    params.push(status);
    conditions.push(`jo.status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM job_offers jo ${where}`, params);
  const total = countRes.rows[0].total;

  const result = await query(
    `SELECT jo.*, ep.company_name
     FROM job_offers jo
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     ${where}
     ORDER BY jo.created_at DESC
     LIMIT ${limitNum} OFFSET ${(pageNum - 1) * limitNum}`,
    params,
  );

  res.json({ data: result.rows.map(withLambert93), pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
}

export async function moderateOffer(req, res) {
  const admin = await requireAdmin(req.user.id);
  const { id } = req.params;
  const body = req.body;

  validate(body, {
    action: { type: 'oneOf', required: true, values: ['approve', 'reject', 'close'] },
    reason: { type: 'string', max: 2000 },
  });

  const offerRes = await query(
    `SELECT jo.*, ep.user_id AS employer_user_id FROM job_offers jo
     JOIN employer_profiles ep ON ep.id = jo.employer_id
     WHERE jo.id = $1`,
    [id],
  );
  const offer = offerRes.rows[0];
  if (!offer)
    throw new ApiError(404, 'Offre introuvable');

  const updated = await withTransaction(async (client) => {
    let upd;
    if (body.action === 'approve') {
      if (offer.status === 'active')
        throw new ApiError(400, 'L\'offre est déjà active');

      let updateExpiryClause = '';
      if (offer.expires_at && new Date(offer.expires_at) <= new Date()) {
        updateExpiryClause = `, expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'`;
      }

      const res = await client.query(
        `UPDATE job_offers SET status = 'active', published_at = COALESCE(published_at, CURRENT_TIMESTAMP), rejected_reason = NULL, updated_at = CURRENT_TIMESTAMP ${updateExpiryClause} WHERE id = $1 RETURNING *`,
        [id],
      );
      upd = res.rows[0];
      await logModeration(client, admin.id, { action: 'approved', jobId: id, reason: body.reason ?? null });
      await notify(client, offer.employer_user_id, 'offer_approved', 'Offre approuvée', `Votre offre « ${offer.title} » est en ligne.`, `/employer/offers/${id}`);
    } else if (body.action === 'reject') {
      if (offer.status === 'rejected')
        throw new ApiError(400, 'L\'offre est déjà rejetée');
      const res = await client.query(
        `UPDATE job_offers SET status = 'rejected', rejected_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [body.reason ?? 'Offre non conforme', id],
      );
      upd = res.rows[0];
      await logModeration(client, admin.id, { action: 'rejected', jobId: id, reason: body.reason ?? null });
      await notify(client, offer.employer_user_id, 'offer_rejected', 'Offre rejetée', `Votre offre « ${offer.title} » a été rejetée : ${body.reason ?? 'non conforme'}`, `/employer/offers/${id}`);
    } else {
      const res = await client.query(
        `UPDATE job_offers SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id],
      );
      upd = res.rows[0];
      await logModeration(client, admin.id, { action: 'closed', jobId: id, reason: body.reason ?? 'Offre fermée par la modération' });
      await notify(client, offer.employer_user_id, 'offer_closed', 'Offre fermée', `Votre offre « ${offer.title} » a été fermée.`, `/employer/offers/${id}`);
    }
    return upd;
  });

  res.json(updated);
}

export async function listReports(req, res) {
  await requireAdmin(req.user.id);

  const { status, page = 1, limit = 20 } = req.query;

  const conditions = [];
  const params = [];
  if (status && ['pending', 'resolved', 'dismissed'].includes(status)) {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM reports r ${where}`, params);
  const total = countRes.rows[0].total;

  const result = await query(
    `SELECT r.*, jo.title AS offer_title
     FROM reports r
     JOIN job_offers jo ON jo.id = r.offer_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT ${limitNum} OFFSET ${(pageNum - 1) * limitNum}`,
    params,
  );

  res.json({ data: result.rows, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
}

export async function resolveReport(req, res) {
  const admin = await requireAdmin(req.user.id);
  const { id } = req.params;
  const body = req.body;

  validate(body, {
    status: { type: 'oneOf', required: true, values: ['resolved', 'dismissed'] },
  });

  const result = await query(
    `UPDATE reports SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND status = 'pending' RETURNING *`,
    [body.status, req.user.id, id],
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Signalement introuvable ou déjà traité');
  res.json(result.rows[0]);
}

export async function moderateEmployer(req, res) {
  const admin = await requireAdmin(req.user.id);
  const { id } = req.params;
  const body = req.body;

  validate(body, {
    action: { type: 'oneOf', required: true, values: ['approve', 'reject'] },
    reason: { type: 'string', max: 2000 },
  });

  const empRes = await query(
    `SELECT ep.*, u.email FROM employer_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE ep.id = $1`,
    [id],
  );
  const emp = empRes.rows[0];
  if (!emp)
    throw new ApiError(404, 'Profil employeur introuvable');
  if (emp.verification_status !== 'pending') {
    throw new ApiError(400, 'Aucune vérification en attente pour ce compte');
  }

  const newStatus = body.action === 'approve' ? 'verified' : 'rejected';

  const updated = await withTransaction(async (client) => {
    const upd = await client.query(
      `UPDATE employer_profiles SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newStatus, id],
    );
    await client.query('UPDATE tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND type = \'employer_verification\' AND used_at IS NULL', [emp.user_id]);
    await logModeration(client, admin.id, {
      action: body.action === 'approve' ? 'approved' : 'rejected',
      userId: emp.user_id,
      reason: body.reason ?? null,
    });
    await notify(
      client,
      emp.user_id,
      body.action === 'approve' ? 'employer_verified' : 'employer_verification_rejected',
      body.action === 'approve' ? 'Compte vérifié' : 'Vérification refusée',
      body.action === 'approve'
        ? 'Votre compte employeur est vérifié, vous pouvez publier des offres.'
        : (body.reason ?? 'Votre demande de vérification a été refusée.'),
    );
    return upd.rows[0];
  });

  res.json(updated);
}
