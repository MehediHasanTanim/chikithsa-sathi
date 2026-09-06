import { validateEnvironment } from './env.schema';

const requiredEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://chamber:chamber@localhost:5432/chamber_management?schema=public',
  REDIS_URL: 'redis://localhost:6379',
};

describe('environment validation', () => {
  it('parses required values and permits empty future-sprint configuration stubs', () => {
    const environment = validateEnvironment({
      ...requiredEnvironment,
      AI_API_KEY: '',
      JWT_ACCESS_SECRET: '',
    });

    expect(environment.PORT).toBe(3000);
    expect(environment.AI_API_KEY).toBeUndefined();
  });

  it('fails fast when a required connection value is missing', () => {
    expect(() => {
      const { REDIS_URL: _redisUrl, ...invalidEnvironment } = requiredEnvironment;
      validateEnvironment(invalidEnvironment);
    }).toThrow('Invalid environment configuration');
  });
});
