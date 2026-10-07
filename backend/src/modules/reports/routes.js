import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler, ApiError } from '../../utils/errors.js';
import { validate } from '../../utils/validate.js';
import { optionalAuth } from '../../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Applications]
 *     summary: Signaler une offre
 *     description: Permet de signaler une offre frauduleuse ou non conforme. Authentification optionnelle.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offer_id, reason]
 *             properties:
 *               offer_id: { type: integer }
 *               reason: { type: string, enum: [fraud, expired, inappropriate, duplicate, other] }
 *               details: { type: string }
 *     responses:
 *       201: { description: Signalement enregistré }
 *       404: { description: Offre introuvable }
 */
router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const body = req.body;

  validate(body, {
    offer_id: { type: 'int', required: true, min: 1 },
    reason: { type: 'oneOf', required: true, values: ['fraud', 'expired', 'inappropriate', 'duplicate', 'other'] },
    details: { type: 'string', max: 2000 },
  });

  const offerRes = await query('SELECT id FROM job_offers WHERE id = $1', [body.offer_id]);
  if (offerRes.rowCount === 0)
    throw new ApiError(404, 'Offre introuvable');

  const result = await query(
    `INSERT INTO reports (offer_id, reporter_id, reason, details)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [body.offer_id, req.user?.id ?? null, body.reason, body.details ?? null],
  );

  res.status(201).json(result.rows[0]);
}));

export default router;
