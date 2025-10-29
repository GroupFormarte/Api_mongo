"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/user/userController");
const authMiddleware_1 = require("../../../shared/middleware/authMiddleware");
const userRoutes = (0, express_1.Router)();
// POST /api/auth/register - Register a new user
userRoutes.post('/register', userController_1.registerUser);
// POST /api/auth/login - Login user (email/password)
userRoutes.post('/login', userController_1.loginUser);
// POST /api/auth/podium-login - Login user via Podium API
userRoutes.post('/podium-login', userController_1.loginUserWithPodium);
// POST /api/auth/refresh-token - Refresh JWT token
userRoutes.post('/refresh-token', userController_1.refreshTokenHandler);
// POST /api/auth/logout - Logout current session
userRoutes.post('/logout', userController_1.logoutUser);
// POST /api/auth/logout-all - Logout all user sessions (requires authentication)
userRoutes.post('/logout-all', authMiddleware_1.authenticate, userController_1.logoutAllSessions);
exports.default = userRoutes;
