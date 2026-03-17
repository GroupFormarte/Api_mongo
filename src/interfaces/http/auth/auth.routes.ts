import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  logoutAllSessions,
  loginUserWithPodium,
  refreshTokenHandler
} from './auth.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { validateBody } from '../../../shared/validation/middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  podiumLoginSchema,
} from '../../../shared/validation/schemas/auth.schema';

const userRoutes = Router();

userRoutes.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(registerUser)
);

userRoutes.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(loginUser)
);

userRoutes.post(
  '/podium-login',
  validateBody(podiumLoginSchema),
  asyncHandler(loginUserWithPodium)
);

userRoutes.post(
  '/refresh-token',
  asyncHandler(refreshTokenHandler)
);

userRoutes.post(
  '/logout',
  asyncHandler(logoutUser)
);

userRoutes.post(
  '/logout-all',
  authenticate,
  asyncHandler(logoutAllSessions)
);

export default userRoutes;