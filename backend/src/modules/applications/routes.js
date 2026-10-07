import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { apply, myApplications } from './controllers.js';

const router = Router();

router.use(authenticate, requireRole('candidate'));

/**
 * @openapi
 * /applications:
 *   post:
 *     tags: [Applications]
 *     summary: Candidater à une offre
 *     description: Réservé aux demandeurs d'emploi authentifiés. Une seule candidature par offre.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_id]
 *             properties:
 *               job_id: { type: integer }
 *               cover_letter: { type: string }
 *               cv_url: { type: string }
 *     responses:
 *       201: { description: Candidature créée }
 *       409: { description: Déjà candidaté ou offre non ouverte }
 */
router.post('/', asyncHandler(apply));

/**
 * @openapi
 * /applications/my-applications:
 *   get:
 *     tags: [Applications]
 *     summary: Suivre ses candidatures
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my-applications', asyncHandler(myApplications));

export default router;
