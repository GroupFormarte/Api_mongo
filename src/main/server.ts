import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Database connection
import DatabaseConnection from '../infrastructure/database/connection';

// Rutas y controladores
import qualifierRoute from '../interfaces/http/routes/qualifierRoutes';
import crudMobile from '../interfaces/http/routes/crud_app';
import timeRoute from '../interfaces/http/routes/time_zone';
import userRoutes from '../interfaces/http/routes/userRoutes';
import { handleWebSocketConnection } from '../interfaces/websocket/sse.controller';
import { startTrackingPositions } from '../application/services/positionTracker';
import progressRoute from '../interfaces/http/routes/progess/progressRoute';
import pdfRoutes from '../interfaces/http/routes/pdfRoutes';

// New modular routes
import academicRoutes from '../interfaces/http/routes/academic/academicRoutes';
import studentRoutes from '../interfaces/http/routes/students/studentRoutes';
import systemRoutes from '../interfaces/http/routes/system/systemRoutes';
import mediaRoutes from '../interfaces/http/routes/media/mediaRoutes';
import appVersionRoutes from '../interfaces/http/routes/appVersionRoutes';

// Middleware
import { errorHandler, notFoundHandler } from '../shared/middleware/errorHandler';
import { authenticate } from '../shared/middleware/authMiddleware';
dotenv.config();

const app = express();
const port = 3000;

// Initialize database connection
const dbConnection = DatabaseConnection.getInstance();

// ────────────── Middlewares ──────────────
app.use(cors({
  origin: '*', // ahora sí funciona con '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'storage/uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// ────────────── Rutas HTTP ──────────────
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, world!');
});

// ═══════════════════════════════════════════════════════════════
// FORMARTE API - UNIFIED STRUCTURE
// ═══════════════════════════════════════════════════════════════

// Public Routes (no authentication required)
app.use('/api/auth', userRoutes);               // Authentication & user management (login, register)
app.use('/api/version', appVersionRoutes);      // App version management (GET, POST, PUT)

// Protected Routes (require authentication)
app.use('/api/academic', authenticate, academicRoutes);      // Academic operations (areas, subjects, simulacros)
app.use('/api/students', authenticate, studentRoutes);       // Student management & ranking
app.use('/api/system', authenticate, systemRoutes);          // System utilities & CRUD operations
app.use('/api/media', authenticate, mediaRoutes);            // Media management (images, files, PDFs)

// Specific API Routes (protected)
app.use('/api/pdf', authenticate, pdfRoutes);                // PDF operations (legacy compatibility)
app.use('/api/qualifier', authenticate, qualifierRoute);     // Qualifier operations
app.use('/api/time', authenticate, timeRoute);               // Time zone operations

// Legacy routes (protected for compatibility)
app.use('/simulacro',  crudMobile);             // Mobile CRUD operations
app.use("/progress-app", authenticate, progressRoute);       // Progress tracking

// Error handling middleware (debe ir después de todas las rutas)
app.use(notFoundHandler);
app.use(errorHandler);

// ────────────── Servidor HTTP + WebSocket ──────────────
const server = http.createServer(app);

// WebSocket server con ruta personalizada
const wss = new WebSocketServer({ server, path: '/ws/notifications' });

wss.on('connection', (ws) => {
  handleWebSocketConnection(ws); // Función que gestiona cada conexión WebSocket
});


// Iniciar servidor
server.listen(port, async () => {
  try {
    // Connect to database
    await dbConnection.connect();

    console.log(`🚀 FormarTE API listening at http://localhost:${port}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/ws/notifications`);
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🌟 FORMARTE API - UNIFIED STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📋 Public Routes (No Auth):');
    console.log('  🔓 Auth:      /api/auth/*      - Login, Register, Logout');
    console.log('  🔓 Version:   /api/version     - App version (GET, POST, PUT)');
    console.log('\n📋 Protected Routes (Auth Required):');
    console.log('  🔐 Academic:  /api/academic/*  - Areas, subjects, simulacros');
    console.log('  🔐 Students:  /api/students/*  - Student management & ranking');
    console.log('  🔐 System:    /api/system/*    - System utilities & CRUD');
    console.log('  🔐 Media:     /api/media/*     - Images, files, PDFs');
    console.log('  🔐 PDF:       /api/pdf/*       - PDF operations');
    console.log('  🔐 Qualifier: /api/qualifier/* - Qualifier operations');
    console.log('  🔐 Time:      /api/time/*      - Time zone operations');
    console.log('\n📋 Legacy Routes (Protected):');
    console.log('  🔐 Simulacro: /simulacro/*     - Mobile CRUD operations');
    console.log('  🔐 Progress:  /progress-app/*  - Progress tracking');
    console.log('\n🔒 Security: All protected routes validate JWT tokens');
    console.log('═══════════════════════════════════════════════════════════════');

    startTrackingPositions();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  try {
    await dbConnection.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});