import { z } from 'zod';

const booleanFromEnvironment = z.enum(['true', 'false']).transform((value) => value === 'true');
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DATABASE_URL_TEST: z.string().url().startsWith('postgresql://').optional(),
  REDIS_URL: z.string().url().startsWith('redis://'),
  APP_NAME: z.string().min(1).default('Chamber Management API'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  ENABLE_SWAGGER: booleanFromEnvironment.optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'log', 'debug', 'verbose']).default('log'),
  TIMEZONE: z.string().default('Asia/Dhaka'),
  JWT_ACCESS_SECRET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(32),
  ),
  JWT_REFRESH_SECRET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(32),
  ),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  OTP_EXPIRY_SECONDS: z.coerce.number().int().min(60).max(3600).default(600),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(30).max(600).default(60),
  AUTH_MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  AUTH_LOCKOUT_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  STORAGE_ENDPOINT: optionalUrl,
  STORAGE_REGION: optionalString,
  STORAGE_BUCKET: optionalString,
  STORAGE_ACCESS_KEY: optionalString,
  STORAGE_SECRET_KEY: optionalString,
  AI_PROVIDER: optionalString,
  AI_API_KEY: optionalString,
  EMAIL_PROVIDER: optionalString,
  EMAIL_FROM: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().email().optional(),
  ),
  SMS_PROVIDER: optionalString,
  SMS_API_KEY: optionalString,
  NOTIFICATIONS_ENABLED: booleanFromEnvironment.optional().default('false'),
});

export type Environment = Omit<z.infer<typeof environmentSchema>, 'ENABLE_SWAGGER'> & {
  ENABLE_SWAGGER: boolean;
};

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const parsed = environmentSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  if (
    parsed.data.NODE_ENV === 'production' &&
    (parsed.data.JWT_ACCESS_SECRET.startsWith('development-only-') ||
      parsed.data.JWT_REFRESH_SECRET.startsWith('development-only-'))
  ) {
    throw new Error('Invalid environment configuration: production JWT secrets must be replaced');
  }

  return {
    ...parsed.data,
    // Development keeps the docs convenient, while production must opt in.
    ENABLE_SWAGGER: parsed.data.ENABLE_SWAGGER ?? parsed.data.NODE_ENV !== 'production',
  };
}
