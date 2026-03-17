"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message, statusCode = 200, meta) {
        const response = {
            success: true,
            data,
            message,
            meta: Object.assign({ timestamp: new Date().toISOString(), version: this.API_VERSION }, meta)
        };
        return res.status(statusCode).json(response);
    }
    static error(res, error, statusCode = 500, details) {
        const response = {
            success: false,
            error,
            meta: Object.assign({ timestamp: new Date().toISOString(), version: this.API_VERSION }, (details && { details })),
            message: error
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, page, limit, total, message) {
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
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }
    static updated(res, data, message = 'Resource updated successfully') {
        return this.success(res, data, message, 200);
    }
    static deleted(res, message = 'Resource deleted successfully') {
        return this.success(res, null, message, 200);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }
    static badRequest(res, message = 'Bad request', details) {
        return this.error(res, message, 400, details);
    }
    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Access forbidden') {
        return this.error(res, message, 403);
    }
    static conflict(res, message = 'Resource conflict', details) {
        return this.error(res, message, 409, details);
    }
    static validationError(res, errors, message = 'Validation failed') {
        return this.error(res, message, 422, { validationErrors: errors });
    }
    static bulk(res, results, message) {
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
    static withPerformance(res, data, executionTime, cacheHit = false, message) {
        return this.success(res, data, message, 200, {
            performance: {
                executionTime,
                cacheHit
            }
        });
    }
}
exports.ApiResponse = ApiResponse;
ApiResponse.API_VERSION = '1.0.0';
exports.default = ApiResponse;
