import { UserService, UserStoragePort } from '../../../../src/application/services/UserService';
import { UserEntity, UserMetadata } from '../../../../src/domain/entities/UserEntity';
import jwt from 'jsonwebtoken';

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  let userService: UserService;
  let mockUserStorage: jest.Mocked<UserStoragePort>;

  beforeEach(() => {
    mockUserStorage = {
      saveUser: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserByNumberId: jest.fn(),
      validateUserCredentials: jest.fn(),
    };
    userService = new UserService(mockUserStorage);
  });

  describe('registerUser', () => {
    const userData = {
      type_id: 1,
      number_id: '123456789',
      name: 'John',
      second_name: 'Middle',
      last_name: 'Doe',
      second_last: 'Smith',
      email: 'test@example.com',
      password: 'password123',
      cellphone: '+1234567890',
      locate_district: 'District 1',
      type_user: 'student',
      gender: 'M',
      programa: 'Computer Science',
      birthday: '1990-01-01',
    };

    it('should register a new user successfully', async () => {
      mockUserStorage.findUserByEmail.mockResolvedValue(null);
      mockUserStorage.findUserByNumberId.mockResolvedValue(null);
      mockUserStorage.saveUser.mockResolvedValue({
        ...userData,
        createdAt: new Date(),
      });

      const result = await userService.registerUser(userData);

      expect(mockUserStorage.findUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserStorage.findUserByNumberId).toHaveBeenCalledWith(userData.number_id);
      expect(mockUserStorage.saveUser).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should throw error if email already exists', async () => {
      const existingUser: UserMetadata = {
        ...userData,
        createdAt: new Date(),
      };
      mockUserStorage.findUserByEmail.mockResolvedValue(existingUser);

      await expect(userService.registerUser(userData)).rejects.toThrow('Email already registered');
    });

    it('should throw error if number ID already exists', async () => {
      const existingUser: UserMetadata = {
        ...userData,
        createdAt: new Date(),
      };
      mockUserStorage.findUserByEmail.mockResolvedValue(null);
      mockUserStorage.findUserByNumberId.mockResolvedValue(existingUser);

      await expect(userService.registerUser(userData)).rejects.toThrow('ID number already registered');
    });

    it('should throw error if user data is invalid', async () => {
      const invalidUserData = {
        ...userData,
        email: 'invalid-email',
      };

      // Mock UserEntity.create to return an invalid user
      jest.spyOn(UserEntity, 'create').mockReturnValue({
        validate: () => false,
      } as any);

      await expect(userService.registerUser(invalidUserData)).rejects.toThrow('Invalid user data');
    });
  });

  describe('loginUser', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockUser: UserMetadata = {
      type_id: 1,
      number_id: '123456789',
      name: 'John',
      second_name: 'Middle',
      last_name: 'Doe',
      second_last: 'Smith',
      email,
      password,
      cellphone: '+1234567890',
      locate_district: 'District 1',
      type_user: 'student',
      gender: 'M',
      programa: 'Computer Science',
      birthday: '1990-01-01',
      createdAt: new Date(),
    };

    it('should login user successfully', async () => {
      mockUserStorage.validateUserCredentials.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue('mock-token' as any);

      const result = await userService.loginUser(email, password);

      expect(mockUserStorage.validateUserCredentials).toHaveBeenCalledWith(email, password);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.number_id, email: mockUser.email },
        env.jwtSecret || 'your-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockUserStorage.validateUserCredentials.mockResolvedValue(null);

      await expect(userService.loginUser(email, password)).rejects.toThrow('Invalid credentials');
    });
  });
});