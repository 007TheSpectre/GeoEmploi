import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { apiLimiter, authLimiter, geoLimiter } from './config/rateLimit.js';
import { errorHandler, notFoundHandler } from './utils/errors.js';

import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import geoRoutes from './modules/geo/routes.js';
import offerRoutes from './modules/offers/routes.js';
import candidateRoutes from './modules/candidate/routes.js';
import employerRoutes from './modules/employer/routes.js';
import applicationRoutes from './modules/applications/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import reportRoutes from './modules/reports/routes.js';
import adminRoutes from './modules/admin/routes.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));
app.use(express.json());

const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
if (swaggerEnabled) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'GéoEmploi — API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    validatorUrl: null,
  }));
}

app.use('/api/auth', authLimiter);
app.use('/api/geo', geoLimiter);
app.use('/api', apiLimiter);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Vérifier l'état du service
 *     description: Retourne le statut de l'API et un timestamp.
 *     responses:
 *       200:
 *         description: Service opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2026-09-01T12:00:00.000Z'
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Point d'entrée de l'API
 *     responses:
 *       200:
 *         description: Message de bienvenue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenue sur l'API de GeoEmploi
 */
app.get('/api/', (_req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de GeoEmploi'});
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
