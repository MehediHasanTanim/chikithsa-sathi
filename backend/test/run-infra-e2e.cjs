/*
 * Runs the infrastructure E2E suite against the explicitly configured test
 * database. Keeping this in Node (rather than shell syntax) makes it portable
 * between local development and CI runners.
 */
const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');

function loadLocalEnvironment() {
  const environmentFile = resolve(projectRoot, '.env');
  if (!existsSync(environmentFile)) return;
  for (const line of readFileSync(environmentFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadLocalEnvironment();

const testDatabaseUrl = process.env.DATABASE_URL_TEST;

if (!testDatabaseUrl) {
  throw new Error('DATABASE_URL_TEST must be set before running infrastructure E2E tests.');
}

const parsed = new URL(testDatabaseUrl);
if (!parsed.pathname.toLowerCase().includes('test')) {
  throw new Error('DATABASE_URL_TEST must point to a database whose name contains "test".');
}

const environment = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  RUN_INFRA_E2E: 'true',
  NODE_ENV: 'test',
};

for (const command of [
  ['npx', ['prisma', 'migrate', 'deploy']],
  ['npx', ['prisma', 'db', 'seed']],
  ['npx', ['jest', '--config', 'test/jest-e2e.json', '--runInBand']],
]) {
  console.log(`\nRunning ${command[0]} ${command[1].join(' ')}`);
  const result = spawnSync(command[0], command[1], {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command[0]} ${command[1].join(' ')} exited with status ${result.status}.`);
  }
  console.log(`Completed ${command[0]} ${command[1].join(' ')}`);
}
