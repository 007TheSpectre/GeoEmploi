import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../utils/errors.js';
import { optionalAuth } from '../../middleware/auth.js';
import { geocode, reverse } from './controllers.js';

import { getTile } from './tileCache.js';

const router = Router();


/**
 * @openapi
 * /geo/geocode:
 *   post:
 *     tags: [Geo]
 *     summary: Géocoder une localisation (Base Adresse Nationale)
 *     description: Transforme un nom de commune ou d'arrondissement en coordonnées WGS84 (latitude/longitude) et Lambert-93 (EPSG:2154).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               q: { type: string, example: "Lille 59000" }
 *               limit: { type: integer, default: 5 }
 *               postcode: { type: string, example: "75002" }
 *               citycode: { type: string, example: "75102" }
 *     responses:
 *       200:
 *         description: Liste d'adresses géocodées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       banId: { type: string }
 *                       label: { type: string }
 *                       score: { type: number }
 *                       postcode: { type: string }
 *                       citycode: { type: string }
 *                       city: { type: string }
 *                       latitude: { type: number }
 *                       longitude: { type: number }
 *                       lambert93_x: { type: number }
 *                       lambert93_y: { type: number }
 *       502:
 *         description: Service de géocodage indisponible
 */
router.post('/geocode', optionalAuth, asyncHandler(geocode));

/**
 * @openapi
 * /geo/reverse:
 *   post:
 *     tags: [Geo]
 *     summary: Géocodage inverse (coordonnées → adresse)
 *     description: Retrouve l'adresse la plus proche d'un point WGS84.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude: { type: number, example: 48.869141 }
 *               longitude: { type: number, example: 2.331303 }
 *               limit: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Adresse(s) la plus proche(s)
 *       502:
 *         description: Service de géocodage indisponible
 */
router.post('/reverse', optionalAuth, asyncHandler(reverse));

const slugify = (text) => {
  if (!text)
    return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
};

let cachedDepartments = null;
const arrondissementsCache = new Map();

async function fetchGeoJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      return null;
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get('/departements', asyncHandler(async (_req, res) => {
  if (cachedDepartments) {
    return res.json(cachedDepartments);
  }
  try {
    const data = await fetchGeoJson('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson');
    if (!data) {
      return res.status(502).json({ error: 'Service cartographique indisponible' });
    }
    cachedDepartments = data;
    res.json(cachedDepartments);
  } catch (_err) {
    return res.status(502).json({ error: 'Service cartographique indisponible' });
  }
}));

router.get('/departements/:code/arrondissements', asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { nom } = req.query;

  const cacheKey = `${code}-${nom || ''}`;
  if (arrondissementsCache.has(cacheKey)) {
    return res.json(arrondissementsCache.get(cacheKey));
  }

  let slug = nom ? slugify(nom) : '';
  if (!slug && cachedDepartments) {
    const dept = cachedDepartments.features.find((f) => f.properties.code === code);
    if (dept)
      slug = slugify(dept.properties.nom);
  }

  const subUrl = `https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements/${code}-${slug}/arrondissements-${code}-${slug}.geojson`;
  try {
    const data = await fetchGeoJson(subUrl);
    if (!data) {
      return res.status(404).json({ error: 'Arrondissements non trouvés' });
    }
    arrondissementsCache.set(cacheKey, data);
    res.json(data);
  } catch (_err) {
    return res.status(502).json({ error: 'Service cartographique indisponible' });
  }
}));

/**
 * @openapi
 * /geo/tiles/{z}/{x}/{y}.png:
 *   get:
 *     tags: [Geo]
 *     summary: Obtenir une tuile cartographique Plan IGN (proxy + cache serveur)
 *     description: Proxy avec cache RAM et disque vers le flux WMTS de la Géoplateforme IGN (GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2).
 *     parameters:
 *       - in: path
 *         name: z
 *         required: true
 *         schema: { type: integer, example: 6 }
 *         description: Niveau de zoom (0-21)
 *       - in: path
 *         name: x
 *         required: true
 *         schema: { type: integer, example: 32 }
 *         description: Colonne de la tuile
 *       - in: path
 *         name: y
 *         required: true
 *         schema: { type: string, example: "22.png" }
 *         description: Ligne de la tuile (avec ou sans .png)
 *     responses:
 *       200:
 *         description: Image de la tuile PNG
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Coordonnées de tuile invalides
 *       502:
 *         description: Service de tuiles IGN indisponible
 */
router.get('/tiles/:z/:x/:y', asyncHandler(async (req, res) => {
  let { z, x, y } = req.params;
  if (y && y.endsWith('.png')) {
    y = y.slice(0, -4);
  }

  const zoom = parseInt(z, 10);
  const col = parseInt(x, 10);
  const row = parseInt(y, 10);

  if (isNaN(zoom) || isNaN(col) || isNaN(row) || zoom < 0 || zoom > 21 || col < 0 || row < 0) {
    return res.status(400).json({ error: 'Coordonnées de tuile invalides' });
  }

  const result = await getTile(zoom, col, row);
  if (!result) {
    return res.status(502).json({ error: 'Service de tuiles indisponible' });
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.setHeader('X-Cache', result.source);
  return res.send(result.buffer);
}));

export default router;

