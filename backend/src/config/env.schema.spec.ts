import { validateEnvironment } from './env.schema';

const requiredEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://chamber:chamber@localhost:5432/chamber_management?schema=public',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'development-only-access-secret-replace-before-production',
  JWT_REFRESH_SECRET: 'development-only-refresh-secret-replace-before-production',
};

describe('environment validation', () => {
  it('parses required values and permits empty future-sprint configuration stubs', () => {
    const environment = validateEnvironment({
      ...requiredEnvironment,
      AI_API_KEY: '',
    });

    expect(environment.PORT).toBe(3000);
    expect(environment.AI_API_KEY).toBeUndefined();
  });

  it('fails fast when a required connection value is missing', () => {
    expect(() => {
      const invalidEnvironment = { ...requiredEnvironment, REDIS_URL: undefined };
      validateEnvironment(invalidEnvironment);
    }).toThrow('Invalid environment configuration');
  });

  it('accepts only configured AI provider adapters', () => {
    expect(validateEnvironment({ ...requiredEnvironment, AI_PROVIDER: 'openai' }).AI_PROVIDER).toBe(
      'openai',
    );
    expect(() =>
      validateEnvironment({ ...requiredEnvironment, AI_PROVIDER: 'unsupported' }),
    ).toThrow('Invalid environment configuration');
  });

  it('disables Swagger by default in production and requires explicit opt-in', () => {
    const productionEnvironment = {
      ...requiredEnvironment,
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'a'.repeat(64),
      JWT_REFRESH_SECRET: 'b'.repeat(64),
      SMS_ENABLED: 'true',
      SMS_PROVIDER: 'twilio',
      SMS_TWILIO_ACCOUNT_SID: 'AC123',
      SMS_TWILIO_AUTH_TOKEN: 'secret',
      SMS_TWILIO_FROM: '+15005550006',
    };
    const production = validateEnvironment(productionEnvironment);
    const optedIn = validateEnvironment({
      ...productionEnvironment,
      ENABLE_SWAGGER: 'true',
    });

    expect(production.ENABLE_SWAGGER).toBe(false);
    expect(optedIn.ENABLE_SWAGGER).toBe(true);
  });

  it('rejects short production secrets and insecure configured CORS origins', () => {
    expect(() =>
      validateEnvironment({
        ...requiredEnvironment,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(63),
        JWT_REFRESH_SECRET: 'b'.repeat(64),
      }),
    ).toThrow('production JWT secrets');
    expect(() =>
      validateEnvironment({
        ...requiredEnvironment,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(64),
        JWT_REFRESH_SECRET: 'b'.repeat(64),
        CORS_ORIGINS: 'http://app.example.test',
      }),
    ).toThrow('production CORS origins');
  });

  it('requires configured SMS delivery in production', () => {
    expect(() => validateEnvironment({ ...requiredEnvironment, EMAIL_ENABLED: 'true' })).toThrow(
      'enabled email delivery requires',
    );
    expect(() =>
      validateEnvironment({
        ...requiredEnvironment,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(64),
        JWT_REFRESH_SECRET: 'b'.repeat(64),
      }),
    ).toThrow('production SMS OTP delivery must be enabled');
  });
});
