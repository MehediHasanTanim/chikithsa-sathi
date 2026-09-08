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
    corsOrigins:
      environment.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [],
    trustProxy: environment.TRUST_PROXY,
    apiRateLimitMax: environment.API_RATE_LIMIT_MAX,
    apiRateLimitWindowSeconds: environment.API_RATE_LIMIT_WINDOW_SECONDS,
    metricsToken: environment.METRICS_TOKEN,
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
    otpExpirySeconds: environment.OTP_EXPIRY_SECONDS,
    otpMaxAttempts: environment.OTP_MAX_ATTEMPTS,
    otpResendCooldownSeconds: environment.OTP_RESEND_COOLDOWN_SECONDS,
    maxLoginAttempts: environment.AUTH_MAX_LOGIN_ATTEMPTS,
    lockoutSeconds: environment.AUTH_LOCKOUT_SECONDS,
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
    model: environment.AI_MODEL ?? 'gpt-4o-mini',
    baseUrl: environment.AI_BASE_URL ?? 'https://api.openai.com/v1',
    timeoutMs: environment.AI_TIMEOUT_MS,
    maxRetries: environment.AI_MAX_RETRIES,
  },
  email: {
    enabled: environment.EMAIL_ENABLED,
    from: environment.EMAIL_FROM,
    smtpHost: environment.EMAIL_SMTP_HOST,
    smtpPort: environment.EMAIL_SMTP_PORT,
    smtpUser: environment.EMAIL_SMTP_USER,
    smtpPassword: environment.EMAIL_SMTP_PASSWORD,
    smtpSecure: environment.EMAIL_SMTP_SECURE,
  },
  sms: {
    enabled: environment.SMS_ENABLED,
    provider: environment.SMS_PROVIDER,
    twilioAccountSid: environment.SMS_TWILIO_ACCOUNT_SID,
    twilioAuthToken: environment.SMS_TWILIO_AUTH_TOKEN,
    twilioFrom: environment.SMS_TWILIO_FROM,
  },
  notifications: {
    enabled: environment.NOTIFICATIONS_ENABLED,
    pushEnabled: environment.PUSH_ENABLED,
    pushWebhookUrl: environment.PUSH_WEBHOOK_URL,
  },
});
