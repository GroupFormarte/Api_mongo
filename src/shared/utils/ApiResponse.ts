import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    performance?: {
      executionTime: number;
      cacheHit?: boolean;
    };
  };
}

export class ApiResponse {
  private static readonly API_VERSION = '1.0.0';

  public static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200,
    meta?: any
  ): Response {
    let plainData = data;
    if (data && typeof data === 'object') {
      if ('toObject' in data && typeof (data as any).toObject === 'function') {
        plainData = (data as any).toObject() as T;
      } else if (Array.isArray(data)) {
        plainData = data.map(item => {
          if (item && typeof item === 'object' && 'toObject' in item && typeof (item as any).toObject === 'function') {
            return (item as any).toObject();
          }
          return item;
        }) as any as T;
      }
    }

    const response: ApiResponseData<T> = {
      success: true,
      data: plainData,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.API_VERSION,
        ...meta
      }
    };

    return res.status(statusCode).json(response);
  }

  public static error(
    res: Response,
    error: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponseData = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        version: this.API_VERSION,
        ...(details && { details })
      },
      message: error
    };

    return res.status(statusCode).json(response);
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);

    return this.success(res, data, message, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  }

  public static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  public static updated<T>(
    res: Response,
    data: T,
    message: string = 'Resource updated successfully'
  ): Response {
    return this.success(res, data, message, 200);
  }

  public static deleted(
    res: Response,
    message: string = 'Resource deleted successfully'
  ): Response {
    return this.success(res, null, message, 200);
  }

  public static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, 404);
  }

  public static badRequest(
    res: Response,
    message: string = 'Bad request',
    details?: any
  ): Response {
    return this.error(res, message, 400, details);
  }

  public static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, 401);
  }

  public static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.error(res, message, 403);
  }

  public static conflict(
    res: Response,
    message: string = 'Resource conflict',
    details?: any
  ): Response {
    return this.error(res, message, 409, details);
  }

  public static validationError(
    res: Response,
    errors: any[],
    message: string = 'Validation failed'
  ): Response {
    return this.error(res, message, 422, { validationErrors: errors });
  }

  public static bulk<T>(
    res: Response,
    results: {
      successful: T[];
      failed: any[];
      total: number;
    },
    message?: string
  ): Response {
    const defaultMessage = `Bulk operation completed. ${results.successful.length}/${results.total} successful`;

    return this.success(res, {
      successful: results.successful,
      failed: results.failed,
      summary: {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: ((results.successful.length / results.total) * 100).toFixed(2) + '%'
      }
    }, message || defaultMessage);
  }

  public static withPerformance<T>(
    res: Response,
    data: T,
    executionTime: number,
    cacheHit: boolean = false,
    message?: string
  ): Response {
    return this.success(res, data, message, 200, {
      performance: {
        executionTime,
        cacheHit
      }
    });
  }
}

export default ApiResponse;