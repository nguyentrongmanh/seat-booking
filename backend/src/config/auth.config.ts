import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10) || 7776000, // 90 days in seconds
}));
