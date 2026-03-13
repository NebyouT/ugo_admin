const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UGO Admin API',
      version: '2.0.0',
      description: 'UGO Student Transportation Management System - Complete API Documentation',
      contact: {
        name: 'UGO Team'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://ugo-admin.onrender.com'
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            user_type: { type: 'string', enum: ['customer', 'driver'] },
            status: { type: 'string', enum: ['active', 'inactive'] }
          }
        },
        Child: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            full_name: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female'] },
            school: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            },
            grade: { type: 'string' },
            pickup_location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                lat: { type: 'number' },
                lng: { type: 'number' }
              }
            },
            emergency_contact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Auth endpoints (register, login, OTP, password reset)' },
      { name: 'User Profile', description: 'Profile management and phone change' },
      { name: 'Children', description: 'Children CRUD for parent app' },
      { name: 'Admin - Users', description: 'Admin user management' },
      { name: 'Admin - API Docs', description: 'API documentation management' }
    ]
  },
  apis: [
    './modules/auth/routes/*.js',
    './modules/children/routes/*.js',
    './modules/user-management/routes/*.js',
    './modules/api-docs/routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Swagger JSON endpoint
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'UGO API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true
    }
  }));

  console.log('Swagger UI: /api-docs');
}

module.exports = { setupSwagger, swaggerSpec };
