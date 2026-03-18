import mongoose from 'mongoose';
import { env } from '../../shared/config/env';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const mongoDB = env.mongoUri || '';
      if (!mongoDB) {
        throw new Error('MONGO_URI environment variable is not defined');
      }

      await mongoose.connect(mongoDB);
      this.isConnected = true;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnection(): typeof mongoose {
    if (!this.isConnected) {
      throw new Error('Database is not connected');
    }
    return mongoose;
  }

  public isDbConnected(): boolean {
    return this.isConnected;
  }
}

export default DatabaseConnection;