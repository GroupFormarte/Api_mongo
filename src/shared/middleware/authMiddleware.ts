import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MongoSessionStorage } from '../../infrastructure/database/MongoSessionStorage';
import { authService } from '../../application/services/AuthService';

const sessionStorage = new MongoSessionStorage();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Extract client IP address from request
 */
export function getClientIp(req: Request): string {
  // Check various headers for the real IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  return req.socket.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Authentication middleware with IP validation
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
        error: 'Authentication required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token (supports both standard and Podium tokens)
    let decoded: any;
    decoded = authService.verifyJWT(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
      return;
    }

    // Validate session (IP validation removed)
    const session = await sessionStorage.validateSession(token);

    if (!session) {
      res.status(401).json({
        success: false,
        message: 'Invalid session',
        error: 'Session expired or invalid'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'Internal server error'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    next();
    return;
  }

  // Token provided, validate it
  await authenticate(req, res, next);
}
