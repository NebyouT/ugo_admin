const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Load modular YAML documentation files
const schemasDoc = YAML.load(
  path.join(__dirname, "../docs/swagger/schemas.yaml"),
);
const authDoc = YAML.load(path.join(__dirname, "../docs/swagger/auth.yaml"));
const childrenDoc = YAML.load(
  path.join(__dirname, "../docs/swagger/children.yaml"),
);
const parentsDoc = YAML.load(
  path.join(__dirname, "../docs/swagger/parents.yaml"),
);
const schoolsDoc = YAML.load(
  path.join(__dirname, "../docs/swagger/schools.yaml"),
);
const integrationsDoc = YAML.load(
  path.join(__dirname, "../docs/swagger/integrations.yaml"),
);

// Merge all paths from modular documentation
const paths = {
  ...authDoc.paths,
  ...childrenDoc.paths,
  ...parentsDoc.paths,
  ...schoolsDoc.paths,
  ...integrationsDoc.paths,
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "UGO Admin API",
      version: "3.0.0",
      description:
        "UGO Student Transportation Management System - Complete API Documentation\n\n" +
        "## Features\n" +
        "- **Authentication**: Phone-based registration and login with OTP verification\n" +
        "- **Parent Management**: Complete parent profile and children management\n" +
        "- **Children Management**: Child profiles with school, schedules, and pickup locations\n" +
        "- **School Management**: School database with geospatial search\n" +
        "- **Google Maps Integration**: Address geocoding and location services\n\n" +
        "## Authentication\n" +
        "Most endpoints require JWT authentication. Include the token in the Authorization header:\n" +
        "```\nAuthorization: Bearer <your_token>\n```",
      contact: {
        name: "UGO Team",
        email: "support@ugo.et",
      },
      license: {
        name: "Proprietary",
        url: "https://ugo.et/license",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "http://localhost:3001"
            : "http://localhost:3001",
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],
    components: schemasDoc.components,
    paths: paths,
    tags: [
      {
        name: "Authentication",
        description:
          "User authentication - register, login, OTP verification, password management",
      },
      {
        name: "Children",
        description:
          "Child management - create, read, update, delete child profiles with schedules",
      },
      { name: "Parents", description: "Parent profile and management" },
      {
        name: "Admin - Parents",
        description: "Admin parent management operations",
      },
      {
        name: "Schools",
        description: "School management with geospatial search capabilities",
      },
      {
        name: "Integrations",
        description:
          "Third-party service integrations (Google Maps, SMS, etc.)",
      },
    ],
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Swagger JSON endpoint
  app.get("/api/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "UGO API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    }),
  );

  console.log("✓ Swagger UI available at: /api-docs");
  console.log("✓ Swagger JSON available at: /api/swagger.json");
}

module.exports = { setupSwagger, swaggerSpec };
