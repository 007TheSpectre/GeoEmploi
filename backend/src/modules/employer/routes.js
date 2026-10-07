import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  getProfile, updateProfile, submitVerification,
  listOwnOffers, createOffer, updateOffer, deleteOffer,
  listOfferApplications, updateApplicationStatus, dashboard,
} from './controllers.js';

const router = Router();

router.use(authenticate, requireRole('employer'));

/**
 * @openapi
 * /employer/profile:
 *   get:
 *     tags: [Employers]
 *     summary: Récupérer son profil employeur
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     tags: [Employers]
 *     summary: Mettre à jour son profil employeur
 *     security: [{ bearerAuth: [] }]
 */
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));

/**
 * @openapi
 * /employer/verification:
 *   post:
 *     tags: [Employers]
 *     summary: Soumettre une demande de vérification d'activité
 *     description: Requiert un SIRET. Le statut passe à « pending » jusqu'à la décision admin.
 *     security: [{ bearerAuth: [] }]
 */
router.post('/verification', asyncHandler(submitVerification));

/**
 * @openapi
 * /employer/offers:
 *   get:
 *     tags: [Employers]
 *     summary: Lister ses offres
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Employers]
 *     summary: Créer une offre
 *     description: Réservé aux employeurs vérifiés. L'offre est créée en statut « pending_moderation ».
 *     security: [{ bearerAuth: [] }]
 */
router.get('/offers', asyncHandler(listOwnOffers));
router.post('/offers', asyncHandler(createOffer));
router.put('/offers/:id', asyncHandler(updateOffer));
router.delete('/offers/:id', asyncHandler(deleteOffer));

/**
 * @openapi
 * /employer/offers/{id}/applications:
 *   get:
 *     tags: [Employers]
 *     summary: Candidatures reçues pour une offre
 *     security: [{ bearerAuth: [] }]
 */
router.get('/offers/:id/applications', asyncHandler(listOfferApplications));

/**
 * @openapi
 * /employer/applications/{id}/status:
 *   patch:
 *     tags: [Employers]
 *     summary: Modifier le statut d'une candidature
 *     description: Enregistre l'historique et notifie le candidat.
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/applications/:id/status', asyncHandler(updateApplicationStatus));

/**
 * @openapi
 * /employer/dashboard:
 *   get:
 *     tags: [Employers]
 *     summary: Tableau de bord employeur
 *     description: Nombre de vues et de candidatures par offre.
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', asyncHandler(dashboard));

export default router;
