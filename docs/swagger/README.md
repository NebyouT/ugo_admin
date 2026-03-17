# UGO Admin API - Swagger Documentation

## Overview

This directory contains modular Swagger/OpenAPI 3.0 documentation for the UGO Admin API. The documentation is organized into separate YAML files for better maintainability and clarity.

## Structure

```
docs/swagger/
├── README.md              # This file
├── schemas.yaml           # Common schemas and data models
├── auth.yaml             # Authentication endpoints
├── children.yaml         # Children management endpoints
├── parents.yaml          # Parent management endpoints
├── schools.yaml          # School management endpoints
└── integrations.yaml     # Integration endpoints (Google Maps, etc.)
```

## Accessing the Documentation

### Swagger UI
- **URL**: `http://localhost:3001/api-docs`
- **Production**: `https://ugo-admin.onrender.com/api-docs`

### Swagger JSON
- **URL**: `http://localhost:3001/api/swagger.json`
- **Production**: `https://ugo-admin.onrender.com/api/swagger.json`

## API Modules

### 1. Authentication (`auth.yaml`)
Phone-based authentication system with OTP verification.

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password
- `DELETE /api/auth/account` - Delete account

### 2. Children Management (`children.yaml`)
Complete child profile management with schedules and school integration.

**Endpoints:**
- `POST /api/children` - Create new child
- `GET /api/children` - Get all children
- `GET /api/children/{id}` - Get child by ID
- `PUT /api/children/{id}` - Update child
- `DELETE /api/children/{id}` - Delete child

**Key Features:**
- School selection from existing schools
- Flexible transportation schedules (morning/afternoon/both/full-day)
- Pickup address with Google Maps geocoding
- Per-day schedule customization
- Session-based schedules (morning/afternoon)

### 3. Parent Management (`parents.yaml`)
Parent profile and admin management operations.

**Endpoints:**
- `GET /api/parents/profile` - Get parent profile
- `GET /api/admin/parents` - Get all parents (Admin)
- `POST /api/admin/parents` - Create parent (Admin)
- `GET /api/admin/parents/{id}` - Get parent by ID (Admin)
- `PUT /api/admin/parents/{id}` - Update parent (Admin)
- `DELETE /api/admin/parents/{id}` - Delete parent (Admin)

### 4. School Management (`schools.yaml`)
School database with geospatial search capabilities.

**Endpoints:**
- `GET /api/schools` - Get all schools
- `POST /api/schools` - Create school
- `GET /api/schools/{id}` - Get school by ID
- `PUT /api/schools/{id}` - Update school
- `DELETE /api/schools/{id}` - Delete school
- `PATCH /api/schools/{id}/status` - Toggle school status
- `GET /api/schools/nearby` - Find nearby schools

### 5. Integrations (`integrations.yaml`)
Third-party service integrations.

**Endpoints:**
- `GET /api/integrations` - Get all integrations
- `GET /api/integrations/{keyName}` - Get integration by key
- `PUT /api/integrations/{keyName}` - Update integration
- `DELETE /api/integrations/{keyName}` - Delete integration
- `PATCH /api/integrations/{keyName}/status` - Update status
- `POST /api/integrations/{keyName}/test` - Test integration
- `GET /api/integrations/google-maps/geocode` - Geocode address
- `GET /api/integrations/google-maps/api-key` - Get API key

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Getting a Token

1. Register or login:
   ```bash
   POST /api/auth/login
   {
     "phone": "+251911234567",
     "password": "YourPassword123"
   }
   ```

2. Use the returned access token in subsequent requests.

## Data Models

### User
- User account with role-based access (admin, customer, driver)
- Customer types: parent, student

### Child
- Child profile with name, grade, school
- Pickup address with coordinates
- Flexible transportation schedules
- Session-based schedules (morning/afternoon)

### School
- School information with geolocation
- Address and contact details
- Operating hours and capacity
- Service radius for geospatial queries

### Parent
- Parent profile with basic information
- Address (city and country only)
- Optional emergency contact
- Associated children

## Schedule Types

Children can have flexible transportation schedules:

1. **Morning Only**: Morning pickup → dropoff (to school)
2. **Afternoon Only**: Afternoon pickup → dropoff (from school)
3. **Both Sessions**: Morning + afternoon pickup/dropoff
4. **Full Day**: Same as both sessions

Each schedule entry includes:
- `day`: Day of the week (monday-sunday)
- `type`: pickup or dropoff
- `session`: morning or afternoon
- `time`: Time in HH:MM format
- `isActive`: Boolean flag

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Resource already exists

## Modifying Documentation

### Adding New Endpoints

1. Choose the appropriate YAML file or create a new one
2. Add the endpoint definition following OpenAPI 3.0 spec
3. Update `config/swagger.js` to include the new file
4. Restart the server to see changes

### Adding New Schemas

1. Add schema definition to `schemas.yaml`
2. Reference it in endpoint definitions using `$ref: '#/components/schemas/SchemaName'`

### Example Endpoint Definition

```yaml
paths:
  /api/example:
    post:
      tags:
        - Example
      summary: Create example
      description: Detailed description
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - field1
              properties:
                field1:
                  type: string
                  example: value1
      responses:
        201:
          description: Created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
```

## Testing

Use the Swagger UI to test endpoints directly:

1. Navigate to `/api-docs`
2. Click "Authorize" and enter your JWT token
3. Expand an endpoint and click "Try it out"
4. Fill in the parameters and click "Execute"

## Version History

- **v3.0.0** - Modular documentation structure
  - Separated documentation into modular YAML files
  - Added comprehensive child creation API
  - Enhanced schedule management
  - Improved Google Maps integration documentation

- **v2.0.0** - Enhanced documentation
  - Added authentication flows
  - Documented all existing endpoints

- **v1.0.0** - Initial documentation
  - Basic API documentation

## Support

For questions or issues with the API documentation, contact the UGO development team.
