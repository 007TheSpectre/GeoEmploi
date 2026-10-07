import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { authenticate } from '../../middleware/auth.js';
import {
  metrics, listUsers, updateUserStatus, listOffers, moderateOffer,
  listReports, resolveReport, moderateEmployer,
} from './controllers.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /admin/metrics:
 *   get:
 *     tags: [Admin]
 *     summary: Métriques nationales
 *     security: [{ bearerAuth: [] }]
 */
router.get('/metrics', asyncHandler(metrics));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les utilisateurs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: role, in: query, schema: { type: string, enum: [candidate, employer] } }
 *       - { name: status, in: query, schema: { type: string, enum: [active, suspended] } }
 *       - { name: search, in: query, schema: { type: string } }
 */
router.get('/users', asyncHandler(listUsers));

/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspendre ou réactiver un compte
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id/status', asyncHandler(updateUserStatus));

/**
 * @openapi
 * /admin/offers:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des offres (modération)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/offers', asyncHandler(listOffers));

/**
 * @openapi
 * /admin/offers/{id}/moderate:
 *   patch:
 *     tags: [Admin]
 *     summary: Modérer une offre (approuver, rejeter, fermer)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/offers/:id/moderate', asyncHandler(moderateOffer));

/**
 * @openapi
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les signalements
 *     security: [{ bearerAuth: [] }]
 */
router.get('/reports', asyncHandler(listReports));

/**
 * @openapi
 * /admin/reports/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Traiter un signalement
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/reports/:id/status', asyncHandler(resolveReport));

/**
 * @openapi
 * /admin/employers/{id}/verification:
 *   patch:
 *     tags: [Admin]
 *     summary: Valider ou refuser la vérification d'un employeur
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/employers/:id/verification', asyncHandler(moderateEmployer));

export default router;
