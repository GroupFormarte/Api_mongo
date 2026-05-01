import { UserEntity, UserMetadata } from '../../../../src/domain/entities/UserEntity';

describe('UserEntity', () => {
  const validUserData = {
    type_id: 1,
    number_id: '123456789',
    name: 'John',
    second_name: 'Middle',
    last_name: 'Doe',
    second_last: 'Smith',
    email: 'john.doe@example.com',
    password: 'password123',
    cellphone: '+1234567890',
    locate_district: 'District 1',
    type_user: 'student',
    gender: 'M',
    programa: 'Computer Science',
    birthday: '1990-01-01',
  };

  describe('create', () => {
    it('should create a UserEntity with current timestamp', () => {
      const beforeCreate = new Date();
      const userEntity = UserEntity.create(validUserData);
      const afterCreate = new Date();

      const metadata = userEntity.getMetadata();
      
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(metadata.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(metadata.name).toBe(validUserData.name);
      expect(metadata.email).toBe(validUserData.email);
    });
  });

  describe('getMetadata', () => {
    it('should return a copy of the metadata', () => {
      const userEntity = UserEntity.create(validUserData);
      const metadata1 = userEntity.getMetadata();
      const metadata2 = userEntity.getMetadata();

      expect(metadata1).toEqual(metadata2);
      expect(metadata1).not.toBe(metadata2); // Different objects
    });
  });

  describe('validate', () => {
    it('should return true for valid user data', () => {
      const userEntity = UserEntity.create(validUserData);
      expect(userEntity.validate()).toBe(true);
    });

    it('should return false for invalid email', () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for short number_id', () => {
      const invalidData = { ...validUserData, number_id: '123' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for empty number_id', () => {
      const invalidData = { ...validUserData, number_id: '' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for missing name', () => {
      const invalidData = { ...validUserData, name: '' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for missing last_name', () => {
      const invalidData = { ...validUserData, last_name: '' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for invalid cellphone', () => {
      const invalidData = { ...validUserData, cellphone: 'invalid-phone' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for short password', () => {
      const invalidData = { ...validUserData, password: '123' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should return false for empty password', () => {
      const invalidData = { ...validUserData, password: '' };
      const userEntity = UserEntity.create(invalidData);
      expect(userEntity.validate()).toBe(false);
    });

    it('should accept valid international phone numbers', () => {
      const validPhones = ['+1234567890', '+12345678901234', '1234567890'];
      
      validPhones.forEach(phone => {
        const userData = { ...validUserData, cellphone: phone };
        const userEntity = UserEntity.create(userData);
        expect(userEntity.validate()).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['', '+', '123', 'abc', '+0123456789', '0123456789'];
      
      invalidPhones.forEach(phone => {
        const userData = { ...validUserData, cellphone: phone };
        const userEntity = UserEntity.create(userData);
        expect(userEntity.validate()).toBe(false);
      });
    });
  });
});
