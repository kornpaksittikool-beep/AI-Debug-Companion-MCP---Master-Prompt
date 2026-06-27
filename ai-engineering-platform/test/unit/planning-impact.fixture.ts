import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { DatabaseAdapterRegistryService } from '../../src/modules/database-intelligence/services/database-adapter-registry.service.js';
import { DatabaseConnectionPolicyService } from '../../src/modules/database-intelligence/services/database-connection-policy.service.js';
import { DatabaseIntelligenceService } from '../../src/modules/database-intelligence/services/database-intelligence.service.js';
import { MysqlDatabaseAdapter } from '../../src/modules/database-intelligence/services/mysql-database.adapter.js';
import { PostgresDatabaseAdapter } from '../../src/modules/database-intelligence/services/postgres-database.adapter.js';
import { DatabaseReadonlyPolicyService } from '../../src/modules/database-intelligence/services/database-readonly-policy.service.js';
import { SqliteDatabaseAdapter } from '../../src/modules/database-intelligence/services/sqlite-database.adapter.js';
import { GitCommandRunnerService } from '../../src/modules/git-intelligence/services/git-command-runner.service.js';
import { GitIntelligenceService } from '../../src/modules/git-intelligence/services/git-intelligence.service.js';
import { GitSafetyService } from '../../src/modules/git-intelligence/services/git-safety.service.js';
import { InvestigationSessionStore } from '../../src/modules/investigation/services/investigation-session.store.js';
import { InvestigationService } from '../../src/modules/investigation/services/investigation.service.js';
import { ProblemClassifierService } from '../../src/modules/investigation/services/problem-classifier.service.js';
import { PlanningStoreService } from '../../src/modules/planning-impact/services/planning-store.service.js';
import { RepositoryIgnoreService } from '../../src/modules/repository-intelligence/services/repository-ignore.service.js';
import { RepositoryIntelligenceService } from '../../src/modules/repository-intelligence/services/repository-intelligence.service.js';
import { RepositorySafetyService } from '../../src/modules/repository-intelligence/services/repository-safety.service.js';
import { RepositoryScannerService } from '../../src/modules/repository-intelligence/services/repository-scanner.service.js';
import { RepositorySymbolService } from '../../src/modules/repository-intelligence/services/repository-symbol.service.js';
import { TypeScriptSymbolParserService } from '../../src/modules/repository-intelligence/services/typescript-symbol-parser.service.js';
import { PathPolicyService } from '../../src/core/security/path-policy.service.js';

const execFileAsync = promisify(execFile);

export interface PlanningFixtureServices {
  readonly rootPath: string;
  readonly store: PlanningStoreService;
  readonly investigation: InvestigationService;
  readonly repository: RepositoryIntelligenceService;
  readonly symbols: RepositorySymbolService;
  readonly database: DatabaseIntelligenceService;
  readonly git: GitIntelligenceService;
}

async function runGit(rootPath: string, args: readonly string[]): Promise<void> {
  await execFileAsync('git', [...args], { cwd: rootPath, windowsHide: true });
}

export async function createPlanningFixture(): Promise<PlanningFixtureServices> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'planning-impact-'));
  await fs.mkdir(path.join(rootPath, 'src', 'auth'), { recursive: true });
  await fs.writeFile(
    path.join(rootPath, 'src', 'auth', 'login.service.ts'),
    'export class LoginService { validateLogin(): boolean { return true; } }\n',
  );
  await fs.writeFile(path.join(rootPath, 'README.md'), '# Planning fixture\n');

  await runGit(rootPath, ['init', '-b', 'main']);
  await runGit(rootPath, ['config', 'user.name', 'Test User']);
  await runGit(rootPath, ['config', 'user.email', 'test@example.com']);
  await runGit(rootPath, ['add', '.']);
  await runGit(rootPath, ['commit', '-m', 'initial auth files']);

  const safety = new RepositorySafetyService(new PathPolicyService());
  const scanner = new RepositoryScannerService(new RepositoryIgnoreService(), safety);
  const repository = new RepositoryIntelligenceService(scanner, safety);
  const symbols = new RepositorySymbolService(scanner, safety, new TypeScriptSymbolParserService(safety));
  const databaseConnectionPolicy = new DatabaseConnectionPolicyService(safety);
  const databaseReadonlyPolicy = new DatabaseReadonlyPolicyService();
  const databaseAdapter = new SqliteDatabaseAdapter(databaseConnectionPolicy, databaseReadonlyPolicy);
  const database = new DatabaseIntelligenceService(
    new DatabaseAdapterRegistryService(databaseAdapter, new PostgresDatabaseAdapter(), new MysqlDatabaseAdapter()),
    databaseConnectionPolicy,
  );
  const git = new GitIntelligenceService(new GitSafetyService(safety), new GitCommandRunnerService());
  const investigation = new InvestigationService(
    new InvestigationSessionStore(),
    new ProblemClassifierService(),
  );

  return {
    rootPath,
    store: new PlanningStoreService(),
    investigation,
    repository,
    symbols,
    database,
    git,
  };
}
