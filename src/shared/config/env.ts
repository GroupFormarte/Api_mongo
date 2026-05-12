import 'dotenv/config';
import path from 'path';

export const env = {
  port: process.env.PORT ?? '3000',
  mongoUri: process.env.MONGO_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  podiumApiUrl: process.env.PODIUM_API_URL!,
  // Resolve upload path to an absolute path; default to ./storage/uploads
  uploadPath: process.env.UPLOAD_PATH
    ? path.resolve(process.cwd(), process.env.UPLOAD_PATH)
    : path.join(process.cwd(), 'storage/uploads')
};

if (!env.mongoUri || !env.jwtSecret || !env.podiumApiUrl) {
  console.error('FATAL: Missing required env vars');
  process.exit(1);
}