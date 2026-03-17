import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import ApiResponse from '../../utils/ApiResponse';

/**
 * Middleware para validar request body contra un Zod schema
 * @param schema - Esquema Zod a validar
 * @returns Middleware Express
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return ApiResponse.badRequest(res, 'Validación fallida', { errors: fieldErrors });
      }
      return ApiResponse.error(res, 'Error de validación desconocido', 400);
    }
  };
};

/**
 * Middleware para validar query params contra un Zod schema
 * @param schema - Esquema Zod a validar
 * @returns Middleware Express
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return ApiResponse.badRequest(res, 'Query params inválidos', { errors: fieldErrors });
      }
      return ApiResponse.error(res, 'Error de validación desconocido', 400);
    }
  };
};

/**
 * Middleware para validar params de ruta contra un Zod schema
 * @param schema - Esquema Zod a validar
 * @returns Middleware Express
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return ApiResponse.badRequest(res, 'Parámetros de ruta inválidos', { errors: fieldErrors });
      }
      return ApiResponse.error(res, 'Error de validación desconocido', 400);
    }
  };
};
