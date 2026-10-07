import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { register, login, forgotPassword, resetPassword, getSiretInfo } from './controllers.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Créer un compte
 *     description: Inscription demandeur d'emploi ou employeur. Crée l'utilisateur et son profil associé.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [candidate, employer] }
 *     responses:
 *       201:
 *         description: Compte créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation échouée
 */
router.post('/register', asyncHandler(register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Se connecter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Identifiants incorrects
 *       403:
 *         description: Compte suspendu
 */
router.post('/login', asyncHandler(login));

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demander la réinitialisation du mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Demande traitée
 */
router.post('/forgot-password', asyncHandler(forgotPassword));

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Réinitialiser le mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token: { type: string }
 *               new_password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password', asyncHandler(resetPassword));

/**
 * @openapi
 * /auth/siret/{siret}:
 *   get:
 *     tags: [Auth]
 *     summary: Vérifier un numéro SIRET et récupérer les infos d'entreprise (API SIRENE / Data.gouv)
 *     parameters:
 *       - in: path
 *         name: siret
 *         required: true
 *         schema:
 *           type: string
 *         description: Numéro SIRET (14 chiffres)
 *     responses:
 *       200:
 *         description: Numéro SIRET valide, retourne les données de l'établissement pré-remplies
 *       400:
 *         description: Numéro SIRET invalide ou établissement fermé / non trouvé
 */
router.get('/siret/:siret', asyncHandler(getSiretInfo));

export default router;
