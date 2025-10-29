"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenHandler = exports.loginUserWithPodium = exports.logoutAllSessions = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const UserService_1 = require("../../../../application/services/UserService");
const MongoUserStorage_1 = require("../../../../infrastructure/database/MongoUserStorage");
const MongoSessionStorage_1 = require("../../../../infrastructure/database/MongoSessionStorage");
const responseHandler_1 = require("../../../../shared/utils/responseHandler");
const authMiddleware_1 = require("../../../../shared/middleware/authMiddleware");
const userService = new UserService_1.UserService(new MongoUserStorage_1.MongoUserStorage(), new MongoSessionStorage_1.MongoSessionStorage());
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        // Validate required fields
        const requiredFields = [
            'type_id',
            'number_id',
            'name',
            'last_name',
            'email',
            'cellphone',
            'locate_district',
            'type_user',
            'gender',
            'birthday',
            'password'
        ];
        userData['password'] = userData['number_id'];
        if (userData['type_user'] == undefined || userData['type_user'] == null) {
            userData['type_user'] = "Student ";
        }
        for (const field of requiredFields) {
            if (!userData[field]) {
                return responseHandler_1.ResponseHandler.badRequest(res, `Missing required field: ${field}`);
            }
        }
        const user = yield userService.registerUser(userData);
        responseHandler_1.ResponseHandler.success(res, { user: user.getMetadata() }, 'User registered successfully', 201);
    }
    catch (error) {
        if (error.message === 'Invalid user data' ||
            error.message === 'Email already registered' ||
            error.message === 'ID number already registered') {
            return responseHandler_1.ResponseHandler.badRequest(res, error.message);
        }
        console.error('Error registering user:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return responseHandler_1.ResponseHandler.badRequest(res, 'Email and password are required');
        }
        // Get client context
        const ipAddress = (0, authMiddleware_1.getClientIp)(req);
        const userAgent = (0, authMiddleware_1.getUserAgent)(req);
        const result = yield userService.loginUser(email, password, {
            ipAddress,
            userAgent
        });
        responseHandler_1.ResponseHandler.success(res, { user: result.user, token: result.token }, 'Login successful', 200);
    }
    catch (error) {
        if (error.message === 'Invalid credentials') {
            return responseHandler_1.ResponseHandler.badRequest(res, error.message);
        }
        console.error('Error logging in:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseHandler_1.ResponseHandler.badRequest(res, 'No token provided');
        }
        const token = authHeader.substring(7);
        const success = yield userService.logoutUser(token);
        if (success) {
            responseHandler_1.ResponseHandler.success(res, null, 'Logout successful', 200);
        }
        else {
            responseHandler_1.ResponseHandler.badRequest(res, 'Session not found or already logged out');
        }
    }
    catch (error) {
        console.error('Error logging out:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.logoutUser = logoutUser;
const logoutAllSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return responseHandler_1.ResponseHandler.badRequest(res, 'User not authenticated');
        }
        const count = yield userService.logoutAllUserSessions(req.user.userId);
        responseHandler_1.ResponseHandler.success(res, { sessionsInvalidated: count }, `${count} session(s) invalidated successfully`, 200);
    }
    catch (error) {
        console.error('Error logging out all sessions:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.logoutAllSessions = logoutAllSessions;
const loginUserWithPodium = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, token } = req.body;
        console.log({ userId, token });
        if (!userId || !token) {
            return responseHandler_1.ResponseHandler.badRequest(res, 'userId and podiumToken are required');
        }
        // Get client context
        const ipAddress = (0, authMiddleware_1.getClientIp)(req);
        const userAgent = (0, authMiddleware_1.getUserAgent)(req);
        const result = yield userService.loginUserWithPodium(userId, token, {
            ipAddress,
            userAgent
        });
        responseHandler_1.ResponseHandler.success(res, { userData: result.userData, token: result.token }, 'Podium login successful', 200);
    }
    catch (error) {
        if (error.message === 'Podium authentication failed' ||
            error.message.includes('Missing userId or token') ||
            error.message.includes('Invalid user credentials')) {
            return responseHandler_1.ResponseHandler.badRequest(res, error.message);
        }
        console.error('Error with Podium login:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.loginUserWithPodium = loginUserWithPodium;
const refreshTokenHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseHandler_1.ResponseHandler.badRequest(res, 'No token provided');
        }
        const token = authHeader.substring(7);
        // Get client context
        const ipAddress = (0, authMiddleware_1.getClientIp)(req);
        const userAgent = (0, authMiddleware_1.getUserAgent)(req);
        const result = yield userService.refreshToken(token, {
            ipAddress,
            userAgent
        });
        responseHandler_1.ResponseHandler.success(res, { token: result.token }, 'Token refreshed successfully', 200);
    }
    catch (error) {
        if (error.message === 'Token refresh failed' ||
            error.message.includes('Invalid token') ||
            error.message.includes('does not need refresh')) {
            return responseHandler_1.ResponseHandler.badRequest(res, error.message);
        }
        console.error('Error refreshing token:', error);
        responseHandler_1.ResponseHandler.error(res, error);
    }
});
exports.refreshTokenHandler = refreshTokenHandler;
