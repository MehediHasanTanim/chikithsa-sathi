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
});
