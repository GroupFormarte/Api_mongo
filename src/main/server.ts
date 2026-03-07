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
import scoringRoutes from '../interfaces/http/routes/scoringRoutes';

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

const getFileNotAvailableHTML = (fileName: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archivo No Disponible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .icon svg { width: 60px; height: 60px; fill: white; }
    h1 { color: #333; font-size: 28px; margin-bottom: 15px; font-weight: 700; }
    .message { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .file-name {
      background: #f8f9fa;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #495057;
      margin-bottom: 30px;
      word-break: break-all;
    }
    .info-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .info-box p { color: #856404; font-size: 14px; margin: 0; }
    .info-box strong { display: block; margin-bottom: 8px; font-size: 15px; }
    .timer-icon { display: inline-block; margin-right: 8px; vertical-align: middle; }
    .btn {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
    .footer { margin-top: 40px; color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </div>
    <h1>Archivo No Disponible</h1>
    <p class="message">
      El archivo que intentas acceder ya no está disponible.
      Los reportes se eliminan automáticamente después de un período de tiempo por seguridad.
    </p>
    <div class="file-name">${fileName}</div>
    <div class="info-box">
      <p>
        <strong>
          <span class="timer-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#856404">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </span>
          Tiempo de retención: 30 minutos
        </strong>
        Por favor, genera un nuevo reporte si necesitas acceder a este documento.
      </p>
    </div>
    <a href="javascript:history.back()" class="btn">Volver</a>
    <p class="footer">Sistema de Reportes &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
`;

app.use('/uploads', (req: Request, res: Response) => {
  const fileName = path.basename(req.path);
  res.status(404).send(getFileNotAvailableHTML(fileName));
});

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
app.use('/api/scoring', scoringRoutes);

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