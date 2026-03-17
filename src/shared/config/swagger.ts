import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const port = env.port;
const apiUrl = process.env.API_URL;

const servers = [
  { url: `http://localhost:${port}`, description: 'Desarrollo' },
  ...(apiUrl ? [{ url: apiUrl, description: 'Producción' }] : []),
];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Formarte API',
      version: '1.0.0',
      description: 'Backend educativo con autenticación, scoring y gestión de estudiantes',
      contact: {
        name: 'Formarte Team',
        email: 'support@formarte.com',
      },
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token en formato "Bearer <token>"',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['type_id', 'number_id', 'name', 'last_name', 'email', 'password'],
          properties: {
            type_id: { type: 'integer', example: 1 },
            number_id: { type: 'string', example: '1234567890' },
            name: { type: 'string', example: 'Juan' },
            second_name: { type: 'string', example: 'Carlos', nullable: true },
            last_name: { type: 'string', example: 'Pérez' },
            second_last: { type: 'string', example: 'García', nullable: true },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            cellphone: { type: 'string', example: '+573001234567', nullable: true },
            locate_district: { type: 'string', example: 'Bogotá', nullable: true },
            type_user: { type: 'string', example: 'Student', nullable: true },
            gender: { type: 'string', enum: ['M', 'F', 'O'], nullable: true },
            programa: { type: 'string', example: 'Ingeniería', nullable: true },
            birthday: { type: 'string', format: 'date', nullable: true },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        PodiumLoginRequest: {
          type: 'object',
          required: ['userId', 'podiumToken'],
          properties: {
            userId: { type: 'string', example: '12345' },
            podiumToken: { type: 'string', example: 'podium_token_abc123' },
          },
        },
        User: {
          type: 'object',
          properties: {
            type_id: { type: 'integer' },
            number_id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [],
  },
  apis: [
    './src/interfaces/http/**/*.routes.ts',
    './src/interfaces/http/**/*.docs.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
