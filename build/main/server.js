"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const env_1 = require("../shared/config/env");
const connection_1 = __importDefault(require("../infrastructure/database/connection"));
const sse_controller_1 = require("../interfaces/websocket/sse.controller");
const positionTracker_1 = require("../application/services/positionTracker");
const http_2 = require("../interfaces/http");
const uploadFallback_route_1 = require("../interfaces/http/media/uploadFallback.route");
const setupMiddlewares_1 = require("./setupMiddlewares");
// Middleware
const errorHandler_1 = require("../shared/middleware/errorHandler");
const app = (0, express_1.default)();
const port = env_1.env.port;
// Initialize database connection
const dbConnection = connection_1.default.getInstance();
// ────────────── Middlewares ──────────────
(0, setupMiddlewares_1.setupMiddlewares)(app);
(0, uploadFallback_route_1.registerUploadFallbackRoute)(app);
// ────────────── Rutas HTTP ──────────────
(0, http_2.registerHttpRoutes)(app);
// Error handling middleware
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ────────────── Servidor HTTP + WebSocket ──────────────
const server = http_1.default.createServer(app);
// WebSocket server con ruta personalizada
const wss = new ws_1.WebSocketServer({ server, path: '/ws/notifications' });
wss.on('connection', (ws) => {
    (0, sse_controller_1.handleWebSocketConnection)(ws);
});
server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield dbConnection.connect();
        (0, http_2.printStartupBanner)(port);
        (0, positionTracker_1.startTrackingPositions)();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}));
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Graceful shutdown initiated...');
    try {
        yield dbConnection.disconnect();
        console.log('✅ Database disconnected');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}));
