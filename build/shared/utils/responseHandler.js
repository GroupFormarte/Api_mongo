"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const ApiResponse_1 = require("./ApiResponse");
class ResponseHandler {
    static success(res, data, message = 'Operation successful', statusCode = 200) {
        return ApiResponse_1.ApiResponse.success(res, data, message, statusCode);
    }
    static error(res, error, message = 'An error occurred', statusCode = 500) {
        const errorMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : message;
        return ApiResponse_1.ApiResponse.error(res, errorMsg, statusCode);
    }
    static badRequest(res, message = 'Bad request') {
        return ApiResponse_1.ApiResponse.badRequest(res, message);
    }
    static notFound(res, message = 'Not found') {
        return ApiResponse_1.ApiResponse.notFound(res, message);
    }
}
exports.ResponseHandler = ResponseHandler;
