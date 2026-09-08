import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const sourceRoot = resolve(__dirname, '../../modules');
const apiContract = resolve(__dirname, '../../../../docs/Complete API Contract.md');

function files(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('architecture and documentation contract', () => {
  const sourceFiles = files(sourceRoot);

  it('keeps Prisma implementation imports outside application modules', () => {
    const violations = sourceFiles.filter((path) =>
      readFileSync(path, 'utf8').includes('@database/prisma/prisma.service'),
    );
    expect(violations).toEqual([]);
  });

  it('requires every controller route to be represented in Swagger metadata', () => {
    const violations = sourceFiles
      .filter((path) => path.endsWith('.controller.ts'))
      .filter((path) => {
        const source = readFileSync(path, 'utf8');
        const routes = source.match(/^\s*@(?:Get|Post|Put|Patch|Delete)\(/gm)?.length ?? 0;
        const operations = source.match(/^\s*@ApiOperation\(/gm)?.length ?? 0;
        return !source.includes('@ApiTags(') || routes !== operations;
      });
    expect(violations).toEqual([]);
  });

  it('forbids sequential repository queries in collection loops', () => {
    const sequentialQueryInLoop =
      /for\s*\(\s*(?:const|let)\s+[^;]+\s+of\s+[^)]+\)\s*\{[\s\S]{0,500}?await\s+this\.repository\./;
    const violations = sourceFiles
      .filter((path) => path.endsWith('.service.ts'))
      .filter((path) => sequentialQueryInLoop.test(readFileSync(path, 'utf8')));
    expect(violations).toEqual([]);
  });

  it('keeps API examples and error-code conventions in the published contract', () => {
    const contract = readFileSync(apiContract, 'utf8');
    expect(contract).toContain('## Request');
    expect(contract).toContain('## Response');
    expect(contract).toContain('error codes');
  });
});
