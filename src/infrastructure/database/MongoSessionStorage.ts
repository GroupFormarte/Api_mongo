import mongoose, { Schema, Model } from 'mongoose';
import { SessionMetadata } from '../../domain/entities/SessionEntity';
import { SessionStoragePort } from '../../application/ports/SessionStoragePort';

const sessionSchema = new Schema<SessionMetadata>({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, required: true, default: true, index: true },
});

// TTL index to automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for validation queries
sessionSchema.index({ token: 1, isActive: 1 });
sessionSchema.index({ userId: 1, isActive: 1 });

export class MongoSessionStorage implements SessionStoragePort {
  private sessionModel: Model<SessionMetadata>;

  constructor() {
    this.sessionModel = mongoose.model<SessionMetadata>('Session', sessionSchema);
  }

  async createSession(metadata: SessionMetadata): Promise<SessionMetadata> {
    const session = new this.sessionModel(metadata);
    const savedSession = await session.save();
    return savedSession.toObject();
  }

  async findSessionByToken(token: string): Promise<SessionMetadata | null> {
    const session = await this.sessionModel.findOne({
      token,
      isActive: true
    }).lean();

    return session;
  }

  async findSessionsByUserId(userId: string): Promise<SessionMetadata[]> {
    const sessions = await this.sessionModel.find({
      userId,
      isActive: true
    }).lean();

    return sessions;
  }

  async invalidateSession(token: string): Promise<boolean> {
    const result = await this.sessionModel.updateOne(
      { token },
      { $set: { isActive: false } }
    );

    return result.modifiedCount > 0;
  }

  async invalidateAllUserSessions(userId: string): Promise<number> {
    const result = await this.sessionModel.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } }
    );

    return result.modifiedCount;
  }

  async deleteExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await this.sessionModel.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isActive: false }
      ]
    });

    return result.deletedCount || 0;
  }

  async validateSession(token: string): Promise<SessionMetadata | null> {
    const now = new Date();

    // IP validation removed - only validate token, active status, and expiration
    const session = await this.sessionModel.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: now }
    }).lean();

    return session;
  }
}
