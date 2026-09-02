'use strict';

const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  DATABASE_URL:           z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL:              z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET:      z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT:                   z.coerce.number().default(3000),
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN:          z.string().default('http://localhost:5173'),
  COINGECKO_BASE_URL:     z.string().default('https://api.coingecko.com/api/v3'),
  COINGECKO_API_KEY:      z.string().optional().default(''),
  RISK_FREE_RATE:         z.coerce.number().default(0.05),
  // Used only by the seed script — never stored anywhere except .env
  ADMIN_SEED_PASSWORD:    z.string().optional(),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment configuration:');
  parsed.error.issues.forEach((issue) =>
    console.error(`   ${issue.path.join('.')}: ${issue.message}`)
  );
  process.exit(1);
}

module.exports = parsed.data;
