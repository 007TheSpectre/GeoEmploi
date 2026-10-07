import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler, ApiError } from '../../utils/errors.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Applications]
 *     summary: Lister ses notifications
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Liste paginée }
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const countRes = await query(
    'SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1',
    [req.user.id],
  );
  const total = countRes.rows[0].total;

  const result = await query(
    `SELECT id, type, title, body, link, is_read, read_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [req.user.id],
  );

  res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Applications]
 *     summary: Marquer une notification comme lue
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Notification mise à jour }
 */
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, req.user.id],
  );
  if (result.rowCount === 0)
    throw new ApiError(404, 'Notification introuvable');
  res.json(result.rows[0]);
}));

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Applications]
 *     summary: Marquer toutes ses notifications comme lues
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Nombre de notifications mises à jour }
 */
router.patch('/read-all', asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = FALSE`,
    [req.user.id],
  );
  res.json({ updated: result.rowCount });
}));

export default router;
