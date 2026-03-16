import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllSessions,
  loginUserWithPodium,
  refreshTokenHandler
} from '../controllers/user/userController';
import { authenticate } from '../../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../../shared/middleware/errorHandler';

const userRoutes = Router();

// POST /api/auth/register - Register a new user
userRoutes.post('/register', asyncHandler(registerUser));

// POST /api/auth/login - Login user (email/password)
userRoutes.post('/login', asyncHandler(loginUser));

// POST /api/auth/podium-login - Login user via Podium API
userRoutes.post('/podium-login', asyncHandler(loginUserWithPodium));

// POST /api/auth/refresh-token - Refresh JWT token
userRoutes.post('/refresh-token', asyncHandler(refreshTokenHandler));

// POST /api/auth/logout - Logout current session
userRoutes.post('/logout', asyncHandler(logoutUser));

// POST /api/auth/logout-all - Logout all user sessions (requires authentication)
userRoutes.post('/logout-all', authenticate, asyncHandler(logoutAllSessions));

export default userRoutes;