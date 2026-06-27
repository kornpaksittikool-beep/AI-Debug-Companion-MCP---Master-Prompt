import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';
import { RepositorySymbolService } from '../../src/modules/repository-intelligence/services/repository-symbol.service.js';
import { TypeScriptSymbolParserService } from '../../src/modules/repository-intelligence/services/typescript-symbol-parser.service.js';

async function createFixture(): Promise<string> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-symbol-'));
  await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
  await fs.writeFile(
    path.join(rootPath, 'src', 'service.ts'),
    [
      'export interface UserRecord {',
      '  id: string;',
      '}',
      '',
      'export class UserService {',
      '  findUser(id: string): UserRecord {',
      '    return { id };',
      '  }',
      '}',
      '',
      'export function createUserService(): UserService {',
      '  return new UserService();',
      '}',
    ].join('\n'),
  );
  await fs.writeFile(path.join(rootPath, 'README.md'), '# ignored by parser\n');
  return rootPath;
}

function createService(): RepositorySymbolService {
  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  const parser = new TypeScriptSymbolParserService(safety);
  return new RepositorySymbolService(scanner, safety, parser);
}

describe('RepositorySymbolService', () => {
  it('indexes TypeScript and JavaScript symbols from bounded scans', async () => {
    const rootPath = await createFixture();
    const service = createService();

    const result = await service.searchSymbols({ rootPath, query: 'User' });

    expect(result.symbols.map((symbol) => `${symbol.kind}:${symbol.name}`)).toEqual(
      expect.arrayContaining([
        'interface:UserRecord',
        'class:UserService',
        'method:findUser',
        'function:createUserService',
      ]),
    );
    expect(result.symbols.every((symbol) => symbol.relativePath === 'src/service.ts')).toBe(true);
  });

  it('reads context for a single symbol', async () => {
    const rootPath = await createFixture();
    const service = createService();

    const result = await service.readSymbolContext({
      rootPath,
      symbolName: 'findUser',
      filePath: 'src/service.ts',
      kind: 'method',
    });

    expect(result.symbol.name).toBe('findUser');
    expect(result.context).toContain('findUser(id: string)');
    expect(result.context).toContain('return { id };');
  });

  it('rejects missing symbols with contextual errors', async () => {
    const rootPath = await createFixture();
    const service = createService();

    await expect(service.readSymbolContext({ rootPath, symbolName: 'MissingSymbol' })).rejects.toThrow(
      'was not found',
    );
  });
});
