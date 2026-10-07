import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GéoEmploi API',
      version: '1.0.0',
      description: 'API REST de la plateforme GéoEmploi — recherche d\'emploi géolocalisée.',
      contact: {
        name: 'Équipe GéoEmploi',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API principale',
      },
    ],
    tags: [
      { name: 'Health', description: 'Vérification de l\'état du service' },
      { name: 'Auth', description: 'Authentification et gestion de session' },
      { name: 'Geo', description: 'Géographie, niveaux de zoom et géocodage (BAN)' },
      { name: 'Employers', description: 'Gestion des profils employeurs' },
      { name: 'Jobs', description: 'Offres d\'emploi' },
      { name: 'Candidates', description: 'Profils candidats' },
      { name: 'Applications', description: 'Candidatures' },
      { name: 'Admin', description: 'Administration et métriques' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['candidate', 'employer'] },
            status: { type: 'string', enum: ['active', 'suspended', 'deleted'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
  },
  apis: ['./src/app.js', './src/modules/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
