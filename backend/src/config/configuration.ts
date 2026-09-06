import type { Environment } from './env.schema';

export const configuration = (environment: Environment) => ({
  app: {
    name: environment.APP_NAME,
    port: environment.PORT,
    url: environment.APP_URL,
    environment: environment.NODE_ENV,
    enableSwagger: environment.ENABLE_SWAGGER,
    logLevel: environment.LOG_LEVEL,
    timezone: environment.TIMEZONE,
  },
  database: {
    url: environment.DATABASE_URL,
    testUrl: environment.DATABASE_URL_TEST,
  },
  redis: {
    url: environment.REDIS_URL,
    keyPrefix: `cm:${environment.NODE_ENV}:`,
  },
  jwt: {
    accessSecret: environment.JWT_ACCESS_SECRET,
    refreshSecret: environment.JWT_REFRESH_SECRET,
    accessTtl: environment.JWT_ACCESS_TTL,
    refreshTtl: environment.JWT_REFRESH_TTL,
  },
  storage: {
    endpoint: environment.STORAGE_ENDPOINT,
    region: environment.STORAGE_REGION,
    bucket: environment.STORAGE_BUCKET,
    accessKey: environment.STORAGE_ACCESS_KEY,
    secretKey: environment.STORAGE_SECRET_KEY,
  },
  ai: {
    provider: environment.AI_PROVIDER,
    apiKey: environment.AI_API_KEY,
  },
  email: {
    provider: environment.EMAIL_PROVIDER,
    from: environment.EMAIL_FROM,
  },
  sms: {
    provider: environment.SMS_PROVIDER,
    apiKey: environment.SMS_API_KEY,
  },
  notifications: {
    enabled: environment.NOTIFICATIONS_ENABLED,
  },
});
