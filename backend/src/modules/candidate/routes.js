import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  getProfile, updateProfile,
  listExperiences, addExperience, updateExperience, removeExperience,
  listEducations, addEducation, updateEducation, removeEducation,
  listSkills, addSkill, removeSkill,
  getSavedOffers, saveOffer, unsaveOffer,
} from './controllers.js';

const router = Router();

router.use(authenticate);

router.get('/saved-offers', asyncHandler(getSavedOffers));
router.post('/saved-offers/:id', asyncHandler(saveOffer));
router.delete('/saved-offers/:id', asyncHandler(unsaveOffer));

router.use(requireRole('candidate'));

/**
 * @openapi
 * /candidate/profile:
 *   get:
 *     tags: [Candidates]
 *     summary: Récupérer son profil candidat
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profil candidat }
 *   put:
 *     tags: [Candidates]
 *     summary: Mettre à jour son profil candidat
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Profil mis à jour }
 */
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));

/**
 * @openapi
 * /candidate/experiences:
 *   get:
 *     tags: [Candidates]
 *     summary: Lister ses expériences
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Candidates]
 *     summary: Ajouter une expérience
 *     security: [{ bearerAuth: [] }]
 */
router.get('/experiences', asyncHandler(listExperiences));
router.post('/experiences', asyncHandler(addExperience));
router.put('/experiences/:id', asyncHandler(updateExperience));
router.delete('/experiences/:id', asyncHandler(removeExperience));

/**
 * @openapi
 * /candidate/educations:
 *   get:
 *     tags: [Candidates]
 *     summary: Lister ses formations
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Candidates]
 *     summary: Ajouter une formation
 *     security: [{ bearerAuth: [] }]
 */
router.get('/educations', asyncHandler(listEducations));
router.post('/educations', asyncHandler(addEducation));
router.put('/educations/:id', asyncHandler(updateEducation));
router.delete('/educations/:id', asyncHandler(removeEducation));

/**
 * @openapi
 * /candidate/skills:
 *   get:
 *     tags: [Candidates]
 *     summary: Lister ses compétences
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     tags: [Candidates]
 *     summary: Ajouter une compétence
 *     security: [{ bearerAuth: [] }]
 */
router.get('/skills', asyncHandler(listSkills));
router.post('/skills', asyncHandler(addSkill));
router.delete('/skills/:id', asyncHandler(removeSkill));

export default router;
