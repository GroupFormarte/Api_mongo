import { Response } from 'express';
import { ApiResponse } from './ApiResponse';

export class ResponseHandler {
  static success(res: Response, data: unknown, message = 'Operation successful', statusCode = 200) {
    return ApiResponse.success(res, data, message, statusCode);
  }

  static error(res: Response, error: unknown, message = 'An error occurred', statusCode = 500) {
    const errorMsg =
      error instanceof Error ? error.message : typeof error === 'string' ? error : message;
    return ApiResponse.error(res, errorMsg, statusCode);
  }

  static badRequest(res: Response, message = 'Bad request') {
    return ApiResponse.badRequest(res, message);
  }

  static notFound(res: Response, message = 'Not found') {
    return ApiResponse.notFound(res, message);
  }
}