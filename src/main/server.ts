import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { env } from '../shared/config/env';

import DatabaseConnection from '../infrastructure/database/connection';

import { handleWebSocketConnection } from '../presentation/websocket/sse.controller';
import { startTrackingPositions } from '../application/services/positionTracker';
import { printStartupBanner, registerHttpRoutes } from '../presentation';
import { registerUploadFallbackRoute } from '../presentation/http/media/uploadFallback.route';
import { setupMiddlewares } from './setupMiddlewares';

// Middleware
import { errorHandler, notFoundHandler } from '../shared/middleware/errorHandler';

const app = express();
const port = env.port;

// Initialize database connection
const dbConnection = DatabaseConnection.getInstance();

// ────────────── Middlewares ──────────────
setupMiddlewares(app);
registerUploadFallbackRoute(app);

// ────────────── Rutas HTTP ──────────────
registerHttpRoutes(app);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// ────────────── Servidor HTTP + WebSocket ──────────────
const server = http.createServer(app);

// WebSocket server con ruta personalizada
const wss = new WebSocketServer({ server, path: '/ws/notifications' });

wss.on('connection', (ws) => {
  handleWebSocketConnection(ws); 
});

server.listen(port, async () => {
  try {
    await dbConnection.connect();

    printStartupBanner(port);
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