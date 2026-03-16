import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details;

  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    details = err.message;
  }

  // MongoDB cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  }

  // MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Registro duplicado';
    details = 'Ya existe un registro con estos datos';
  }

  // Log error with file and line information
  if (statusCode >= 500) {
    logger.error('Server Error', err, {
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  } else if (statusCode >= 400) {
    logger.warn(`Client Error ${statusCode}`, {
      message: err.message,
      url: req.url,
      method: req.method,
      params: req.params,
      query: req.query
    });
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(env.nodeEnv === 'development' && statusCode >= 500 && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `No se encontró la ruta ${req.method} ${req.path}`
  });
};


/* 

crear un middleware que para no dejar un los controladores abiertos

*/