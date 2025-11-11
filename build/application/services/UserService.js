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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserEntity_1 = require("../../domain/entities/UserEntity");
const SessionEntity_1 = require("../../domain/entities/SessionEntity");
const AuthService_1 = require("./AuthService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserService {
    constructor(userStorage, sessionStorage) {
        this.userStorage = userStorage;
        this.sessionStorage = sessionStorage;
    }
    registerUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create and validate user entity
            const userEntity = UserEntity_1.UserEntity.create(userData);
            if (!userEntity.validate()) {
                throw new Error('Invalid user data');
            }
            // Check if user already exists
            const existingUserByEmail = yield this.userStorage.findUserByEmail(userData.email);
            if (existingUserByEmail) {
                throw new Error('Email already registered');
            }
            const existingUserByNumberId = yield this.userStorage.findUserByNumberId(userData.number_id);
            if (existingUserByNumberId) {
                throw new Error('ID number already registered');
            }
            // Save user
            const savedMetadata = yield this.userStorage.saveUser(userEntity.getMetadata());
            return new UserEntity_1.UserEntity(savedMetadata);
        });
    }
    loginUser(email, password, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userStorage.validateUserCredentials(email, password);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.number_id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            // Create session with IP validation
            const sessionEntity = SessionEntity_1.SessionEntity.create(user.number_id, token, context.ipAddress, context.userAgent, 24 * 60 * 60 * 1000 // 24 hours
            );
            yield this.sessionStorage.createSession(sessionEntity.getMetadata());
            return { user, token };
        });
    }
    logoutUser(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionStorage.invalidateSession(token);
        });
    }
    logoutAllUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionStorage.invalidateAllUserSessions(userId);
        });
    }
    validateSession(token, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionStorage.validateSession(token);
            return session !== null;
        });
    }
    /**
     * Login via Podium API validation
     * @param userId - User ID to validate
     * @param podiumToken - Token from Podium
     * @param context - Login context (IP, userAgent)
     * @returns Promise<{ userData: any; token: string }>
     */
    loginUserWithPodium(userId, podiumToken, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Authenticate with Podium API
            const result = yield AuthService_1.authService.authenticateUser(userId, podiumToken);
            if (!result.success || !result.token) {
                throw new Error(result.error || 'Podium authentication failed');
            }
            // Create session with IP validation
            const sessionEntity = SessionEntity_1.SessionEntity.create(userId, result.token, context.ipAddress, context.userAgent, 24 * 60 * 60 * 1000 // 24 hours
            );
            yield this.sessionStorage.createSession(sessionEntity.getMetadata());
            return {
                userData: result.userData,
                token: result.token
            };
        });
    }
    /**
     * Refresh JWT token
     * @param token - Current JWT token
     * @param context - Login context for new session
     * @returns Promise<{ token: string }>
     */
    refreshToken(token, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield AuthService_1.authService.refreshToken(token);
            if (!result.success || !result.token) {
                throw new Error(result.error || 'Token refresh failed');
            }
            // Invalidate old session
            yield this.sessionStorage.invalidateSession(token);
            // Create new session with refreshed token
            const decoded = AuthService_1.authService.verifyJWT(result.token);
            if (!decoded) {
                throw new Error('Failed to decode refreshed token');
            }
            const sessionEntity = SessionEntity_1.SessionEntity.create(decoded.userId, result.token, context.ipAddress, context.userAgent, 24 * 60 * 60 * 1000 // 24 hours
            );
            yield this.sessionStorage.createSession(sessionEntity.getMetadata());
            return { token: result.token };
        });
    }
}
exports.UserService = UserService;
