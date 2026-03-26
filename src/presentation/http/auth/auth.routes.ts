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
import { registerSchema, loginSchema, podiumLoginSchema, } from '../../../shared/validation/schemas/auth.schema';

const router = Router();

router
  .post('/register', validateBody(registerSchema), asyncHandler(registerUser))
  .post('/login', validateBody(loginSchema), asyncHandler(loginUser))
  .post('/podium-login', validateBody(podiumLoginSchema), asyncHandler(loginUserWithPodium))
  .post('/refresh-token', asyncHandler(refreshTokenHandler))
  .post('/logout', asyncHandler(logoutUser))
  .post('/logout-all', authenticate, asyncHandler(logoutAllSessions))

export default router;