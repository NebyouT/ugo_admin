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
        },
        Group: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Morning Group A' },
            school: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'Addis Ababa Primary School' },
                address: {
                  type: 'object',
                  properties: {
                    city: { type: 'string', example: 'Addis Ababa' },
                    region: { type: 'string', example: 'Addis Ababa' },
                    country: { type: 'string', example: 'Ethiopia' }
                  }
                }
              }
            },
            driver: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string', example: 'Driver Name' },
                phone: { type: 'string', example: '091234567890' },
                rating: { type: 'number', example: 4.8 },
                photo: { type: 'string', example: 'https://storage.ugo.et/drivers/driver_001.jpg' },
                vehicle: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'Bajaj' },
                    color: { type: 'string', example: 'Blue' },
                    plate: { type: 'string', example: '3-12345' }
                  }
                }
              }
            },
            schedule: {
              type: 'object',
              properties: {
                pickup_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', example: '07:00' },
                drop_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', example: '16:30' },
                days: {
                  type: 'array',
                  items: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                  example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                }
              }
            },
            capacity: { type: 'integer', minimum: 1, maximum: 15, example: 8 },
            current_members: { type: 'integer', minimum: 0, example: 5 },
            base_price: { type: 'number', minimum: 0, example: 2500 },
            status: { type: 'string', enum: ['open', 'full', 'inactive', 'cancelled'], example: 'open' },
            service_radius: { type: 'number', minimum: 1, example: 5 },
            start_date: { type: 'string', format: 'date' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean', example: true },
            isDeleted: { type: 'boolean', example: false }
          }
        },
        School: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', required: true, example: 'Addis Ababa International School' },
            latitude: { type: 'number', required: true, example: 9.0192 },
            longitude: { type: 'number', required: true, example: 38.7525 },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: 'Bole Road' },
                city: { type: 'string', example: 'Addis Ababa' },
                region: { type: 'string', example: 'Addis Ababa' },
                country: { type: 'string', default: 'Ethiopia' },
                postalCode: { type: 'string' },
                formattedAddress: { type: 'string', example: 'Bole Road, Addis Ababa, Ethiopia' }
              }
            },
            contactInfo: {
              type: 'object',
              properties: {
                phone: { type: 'string', example: '+251911123456' },
                email: { type: 'string', example: 'info@school.edu' },
                website: { type: 'string', example: 'https://school.edu' }
              }
            },
            type: { type: 'string', enum: ['kindergarten', 'primary', 'secondary', 'high_school', 'university', 'other'], default: 'primary' },
            grades: {
              type: 'object',
              properties: {
                from: { type: 'string', example: '1' },
                to: { type: 'string', example: '8' }
              }
            },
            studentCapacity: { type: 'integer', default: 0, example: 500 },
            currentStudents: { type: 'integer', default: 0, example: 350 },
            operatingHours: {
              type: 'object',
              properties: {
                monday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '16:00' }
                  }
                },
                tuesday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '16:00' }
                  }
                },
                wednesday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '16:00' }
                  }
                },
                thursday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '16:00' }
                  }
                },
                friday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '16:00' }
                  }
                },
                saturday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '12:00' }
                  }
                },
                sunday: { 
                  type: 'object',
                  properties: { 
                    open: { type: 'string', example: 'Closed' },
                    close: { type: 'string', example: 'Closed' }
                  }
                }
              }
            },
            serviceRadius: { type: 'number', default: 5, example: 5 },
            isActive: { type: 'boolean', default: true },
            status: { type: 'string', enum: ['active', 'inactive', 'pending_verification'], default: 'active' },
            description: { type: 'string' },
            facilities: { type: 'array', items: { type: 'string' }, example: ['library', 'playground', 'cafeteria'] },
            logo: { type: 'string', example: 'https://school.edu/logo.png' },
            photos: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        GroupDetail: {
          allOf: ['$ref', '#/components/schemas/Group'],
          type: 'object',
          properties: {
            group: {
              $ref: '#/components/schemas/Group'
            }
          }
        },
        Driver: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'driver_001' },
            full_name: { type: 'string', example: 'Ato Bekele Tadesse' },
            phone: { type: 'string', example: '0933456789' },
            photo: { type: 'string', example: 'https://storage.ugo.et/drivers/driver_001.jpg' },
            rating: {
              type: 'object',
              properties: {
                overall: { type: 'number', example: 4.8 },
                safety: { type: 'number', example: 4.9 },
                punctuality: { type: 'number', example: 4.7 },
                communication: { type: 'number', example: 4.6 },
                total_reviews: { type: 'integer', example: 45 }
              }
            },
            experience: {
              type: 'object',
              properties: {
                total_rides: { type: 'integer', example: 120 },
                total_students: { type: 'integer', example: 25 },
                member_since: { type: 'string', format: 'date', example: '2025-06-15' }
              }
            },
            vehicle: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Bajaj' },
                color: { type: 'string', example: 'Blue' },
                plate: { type: 'string', example: '3-12345' },
                capacity: { type: 'integer', example: 8 },
                photo: { type: 'string', example: 'https://storage.ugo.et/vehicles/vehicle_001.jpg' }
              }
            },
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'review_001' },
                  parent_name: { type: 'string', example: 'Meron H.' },
                  rating: { type: 'number', example: 5.0 },
                  comment: { type: 'string', example: 'Very punctual and safe!' },
                  created_at: { type: 'string', format: 'date-time', example: '2026-02-20T10:00:00Z' }
                }
              }
            }
          }
        },
        Availability: {
          type: 'object',
          properties: {
            group_id: { type: 'string', example: 'group_001' },
            group_name: { type: 'string', example: 'DD Primary - Morning A' },
            capacity: { type: 'integer', example: 8 },
            current_members: { type: 'integer', example: 5 },
            spots_left: { type: 'integer', example: 3 },
            is_available: { type: 'boolean', example: true },
            status: { type: 'string', example: 'open' }
          }
        },
        Schedule: {
          type: 'object',
          properties: {
            group_id: { type: 'string', example: 'group_001' },
            group_name: { type: 'string', example: 'DD Primary - Morning A' },
            school: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'school_001' },
                name: { type: 'string', example: 'Dire Dawa Primary School' },
                start_time: { type: 'string', example: '08:00' },
                end_time: { type: 'string', example: '16:00' }
              }
            },
            schedule: {
              type: 'object',
              properties: {
                morning: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'pickup' },
                    start_time: { type: 'string', example: '07:00' },
                    arrival_at_school: { type: 'string', example: '07:50' }
                  }
                },
                afternoon: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'drop' },
                    start_time: { type: 'string', example: '16:15' },
                    end_time: { type: 'string', example: '17:00' }
                  }
                }
              }
            },
            days: {
              type: 'array',
              items: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
              example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }
          }
        },
        PriceEstimate: {
          type: 'object',
          properties: {
            group_id: { type: 'string', example: 'group_001' },
            group_name: { type: 'string', example: 'DD Primary - Morning A' },
            pickup_location: {
              type: 'object',
              properties: {
                address: { type: 'string', example: 'Kezira, House #123' }
              }
            },
            pricing: {
              type: 'object',
              properties: {
                base_price: { type: 'number', example: 2500 },
                distance_km: { type: 'number', example: 3.5 },
                distance_fee: { type: 'number', example: 300 },
                total_price: { type: 'number', example: 2800 },
                currency: { type: 'string', example: 'ETB' },
                billing: { type: 'string', example: 'monthly' }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            current_page: { type: 'integer', example: 1 },
            total_pages: { type: 'integer', example: 1 },
            total_items: { type: 'integer', example: 10 },
            limit: { type: 'integer', example: 10 }
          }
        },
        Zone: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: 'zone_001' },
            name: { type: 'string', required: true, example: 'Bole Commercial Area' },
            readable_id: { type: 'integer', example: 1 },
            description: { type: 'string', example: 'Commercial zone for Bole area with high traffic' },
            coordinates: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Polygon'], default: 'Polygon' },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: { type: 'number' }
                    }
                  },
                  example: [[38.7525, 9.0192], [38.7535, 9.0198], [38.7545, 9.0202], [38.7525, 9.0192]]
                }
              }
            },
            service_radius: { type: 'number', minimum: 0.1, maximum: 50, default: 5, example: 5 },
            extra_fare_status: { type: 'boolean', default: false, example: true },
            extra_fare_fee: { type: 'number', minimum: 0, default: 0, example: 50 },
            extra_fare_reason: { type: 'string', example: 'High traffic area' },
            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', default: '#667eea', example: '#667eea' },
            is_active: { type: 'boolean', default: true, example: true },
            isDeleted: { type: 'boolean', default: false, example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deletedAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string', example: 'user_001' },
            updatedBy: { type: 'string', example: 'user_001' },
            deletedBy: { type: 'string', example: 'user_001' },
            total_area: { type: 'number', example: 12.5 },
            is_active_status: { type: 'string', example: 'Active' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Auth endpoints (register, login, OTP, password reset)' },
      { name: 'User Profile', description: 'Profile management and phone change' },
      { name: 'Children', description: 'Children CRUD for parent app' },
      { name: 'Admin - Users', description: 'Admin user management' },
      { name: 'Admin - API Docs', description: 'API documentation management' },
      { name: 'Groups', description: 'Ride-sharing group management' },
      { name: 'Schools', description: 'School management with Google Maps' },
      { name: 'Zones', description: 'Zone management for geospatial service areas and fare calculation' },
      { name: 'Integrations', description: 'Third-party service integrations' }
    ]
  },
  apis: [
    './modules/auth/routes/*.js',
    './modules/children/routes/*.js',
    './modules/user-management/routes/*.js',
    './modules/schools/routes/*.js',
    './modules/groups/routes/*.js',
    './modules/zone-management/routes/*.js',
    './modules/integrations/routes/*.js',
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
