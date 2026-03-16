import { UserEntity, UserMetadata } from '../../domain/entities/UserEntity';
import { SessionEntity } from '../../domain/entities/SessionEntity';
import { SessionStoragePort } from '../ports/SessionStoragePort';
import { authService } from './AuthService';
import { LoginContext } from '../../domain/interfaces/user.interface';

export interface UserStoragePort {
  saveUser(metadata: UserMetadata): Promise<UserMetadata>;
  findUserByEmail(email: string): Promise<UserMetadata | null>;
  findUserByNumberId(numberId: string): Promise<UserMetadata | null>;
  validateUserCredentials(email: string, password: string): Promise<UserMetadata | null>;
}

export class UserService {
  constructor(
    private readonly userStorage: UserStoragePort,
    private readonly sessionStorage: SessionStoragePort
  ) {}

  async registerUser(userData: Omit<UserMetadata, 'createdAt'>): Promise<UserEntity> {
    const userEntity = UserEntity.create(userData);
    if (!userEntity.validate()) throw new Error('Invalid user data');

    const existingUserByEmail = await this.userStorage.findUserByEmail(userData.email);
    if (existingUserByEmail) throw new Error('Email already registered');
    
    const existingUserByNumberId = await this.userStorage.findUserByNumberId(userData.number_id);
    if (existingUserByNumberId) {
      throw new Error('ID number already registered');
    }

    const savedMetadata = await this.userStorage.saveUser(userEntity.getMetadata());
    return new UserEntity(savedMetadata);
  }

  async loginUser(
    email: string,
    password: string,
    context: LoginContext
  ): Promise<{ user: UserMetadata; token: string }> {
    const user = await this.userStorage.validateUserCredentials(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT using AuthService (same format as loginUserWithPodium)
    const token = authService.generateJWT(user.number_id, {
      id: user.number_id,
      email: user.email,
      name: user.name
    });

    // Create session
    const sessionEntity = SessionEntity.create(
      user.number_id,
      token,
      context.ipAddress,
      context.userAgent,
      24 * 60 * 60 * 1000 // 24 hours
    );

    await this.sessionStorage.createSession(sessionEntity.getMetadata());

    return { user, token };
  }

  async logoutUser(token: string): Promise<boolean> {
    return await this.sessionStorage.invalidateSession(token);
  }

  async logoutAllUserSessions(userId: string): Promise<number> {
    return await this.sessionStorage.invalidateAllUserSessions(userId);
  }

  async validateSession(token: string, ipAddress: string): Promise<boolean> {
    const session = await this.sessionStorage.validateSession(token);
    return session !== null;
  }

  /**
   * Login via Podium API validation
   * @param userId - User ID to validate
   * @param podiumToken - Token from Podium
   * @param context - Login context (IP, userAgent)
   * @returns Promise<{ userData: any; token: string }>
   */
  async loginUserWithPodium(
    userId: string,
    podiumToken: string,
    context: LoginContext
  ): Promise<{ userData: any; token: string }> {
    // Authenticate with Podium API
    const result = await authService.authenticateUser(userId, podiumToken);

    if (!result.success || !result.token) {
      throw new Error(result.error || 'Podium authentication failed');
    }

    // Create session with IP validation
    const sessionEntity = SessionEntity.create(
      userId,
      result.token,
      context.ipAddress,
      context.userAgent,
      24 * 60 * 60 * 1000 // 24 hours
    );

    await this.sessionStorage.createSession(sessionEntity.getMetadata());

    return {
      userData: result.userData,
      token: result.token
    };
  }

  /**
   * Refresh JWT token
   * @param token - Current JWT token
   * @param context - Login context for new session
   * @returns Promise<{ token: string }>
   */
  async refreshToken(token: string, context: LoginContext): Promise<{ token: string }> {
    const result = await authService.refreshToken(token);

    if (!result.success || !result.token) {
      throw new Error(result.error || 'Token refresh failed');
    }

    // Invalidate old session
    await this.sessionStorage.invalidateSession(token);

    // Create new session with refreshed token
    const decoded = authService.verifyJWT(result.token);
    if (!decoded) {
      throw new Error('Failed to decode refreshed token');
    }

    const sessionEntity = SessionEntity.create(
      decoded.userId,
      result.token,
      context.ipAddress,
      context.userAgent,
      24 * 60 * 60 * 1000 // 24 hours
    );

    await this.sessionStorage.createSession(sessionEntity.getMetadata());

    return { token: result.token };
  }
}