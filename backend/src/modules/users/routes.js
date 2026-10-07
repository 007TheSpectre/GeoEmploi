import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { authenticate } from '../../middleware/auth.js';
import { getMe, deleteMe, getUserStats, exportUserData, updatePreferences } from './controllers.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer son profil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur connecté
 *       401:
 *         description: Non authentifié
 */
router.get('/me', asyncHandler(getMe));

/**
 * @openapi
 * /users/me/preferences:
 *   patch:
 *     tags: [Auth]
 *     summary: Mettre à jour les préférences de l'utilisateur (ex. géolocalisation)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               geolocation_enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Préférences mises à jour
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non authentifié
 */
router.patch('/preferences', asyncHandler(updatePreferences));
router.patch('/me/preferences', asyncHandler(updatePreferences));

/**
 * @openapi
 * /users/me/export:
 *   get:
 *     tags: [Auth]
 *     summary: Exporter toutes ses données personnelles (RGPD Article 20)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fichier JSON contenant l'ensemble des données du compte et activités
 *       401:
 *         description: Non authentifié
 */
router.get('/export', asyncHandler(exportUserData));
router.get('/me/export', asyncHandler(exportUserData));

/**
 * @openapi
 * /users/stats:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer les statistiques de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques d'activités (offres publiées/enregistrées, candidatures)
 *       401:
 *         description: Non authentifié
 */
router.get('/stats', asyncHandler(getUserStats));
router.get('/me/stats', asyncHandler(getUserStats));

/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags: [Auth]
 *     summary: Supprimer son compte (RGPD)
 *     security:
 *       - bearerAuth: []
 *     description: Suppression définitive. Le compte est désactivé et les données personnelles anonymisées. Exige la confirmation par le mot de passe actuel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Mot de passe actuel de l'utilisateur pour confirmer la suppression
 *     responses:
 *       204:
 *         description: Compte supprimé avec succès
 *       400:
 *         description: Mot de passe manquant ou invalide
 *       401:
 *         description: Mot de passe incorrect ou token invalide
 */
router.delete('/me', asyncHandler(deleteMe));

export default router;
