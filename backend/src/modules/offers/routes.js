import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { searchOffers, getOfferById } from './controllers.js';

const router = Router();

/**
 * @openapi
 * /offers:
 *   get:
 *     tags: [Jobs]
 *     summary: Rechercher des offres géolocalisées
 *     description: Consultation libre, sans compte. Retourne uniquement les offres actives.
 *     parameters:
 *       - { name: lat, in: query, schema: { type: number } }
 *       - { name: lng, in: query, schema: { type: number } }
 *       - { name: radius, in: query, schema: { type: number }, description: Rayon en km }
 *       - { name: keyword, in: query, schema: { type: string } }
 *       - { name: contract_type, in: query, schema: { type: string, enum: [CDI, CDD, interim, alternance, stage, freelance, autre] } }
 *       - { name: commune_code, in: query, schema: { type: string } }
 *       - { name: departement_code, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Liste paginée des offres
 */
router.get('/', asyncHandler(searchOffers));

/**
 * @openapi
 * /offers/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Détail d'une offre
 *     description: Consultation libre. Incrémente le compteur de vues quotidien.
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Détail de l'offre
 *       404:
 *         description: Offre introuvable ou inactive
 */
router.get('/:id', asyncHandler(getOfferById));

export default router;
