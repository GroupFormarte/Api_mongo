import 'dotenv/config';

export const env = {
  port: process.env.PORT ?? '3000',
  mongoUri: process.env.MONGO_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  podiumApiUrl: process.env.PODIUM_API_URL!
};

if (!env.mongoUri || !env.jwtSecret || !env.podiumApiUrl) {
  console.error('FATAL: Missing required env vars');
  process.exit(1);
}