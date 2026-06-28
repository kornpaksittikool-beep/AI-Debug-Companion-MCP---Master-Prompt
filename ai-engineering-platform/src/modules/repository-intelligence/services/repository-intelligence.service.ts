import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import type {
  FileContextOptions,
  FileContextResult,
  FileExcerptOptions,
  FileExcerptResult,
  ModuleContextOptions,
  ModuleContextResult,
  RepositoryOverview,
  RepositoryProjectProfile,
  RepositoryScanOptions,
  RepositoryScanResult,
  RepositorySearchOptions,
  RepositorySearchResult,
} from '../interfaces/repository-intelligence.interface.js';
import { RepositoryScannerService } from './repository-scanner.service.js';
import { RepositorySafetyService } from './repository-safety.service.js';

const DEFAULT_CONTEXT_MAX_BYTES = 16 * 1024;
const DEFAULT_EXCERPT_MAX_BYTES = 1200;
const DEBUG_EXCERPT_MAX_BYTES = 2400;
const DEFAULT_MODULE_MAX_FILES = 25;
const DEFAULT_PROFILE_MAX_FILES = 200;
const DEFAULT_PROFILE_MAX_DEPTH = 4;
const DEFAULT_PROFILE_MAX_EXTENSIONS = 8;
const DEFAULT_PROFILE_MAX_KEY_FILES = 12;
const DEFAULT_PROFILE_MAX_LARGEST_FILES = 3;
const KEY_FILE_NAMES = new Set([
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'nx.json',
  'nest-cli.json',
  'next.config.js',
  'next.config.ts',
  'vite.config.ts',
  'tsconfig.json',
  'docker-compose.yml',
  'Dockerfile',
  'PRODUCTION_CHECKLIST.md',
  'AGENTS.md',
]);
const ENTRYPOINT_PATTERNS = [/^src\/main\.[tj]s$/, /^src\/app\.module\.ts$/, /^apps\/[^/]+\/src\/main\.[tj]s$/, /^apps\/[^/]+\/src\/app\.module\.ts$/, /^apps\/[^/]+\/src\/app\//];

@Injectable()
export class RepositoryIntelligenceService {
  constructor(
    private readonly scanner: RepositoryScannerService,
    private readonly safety: RepositorySafetyService,
  ) {}

  async scan(options: RepositoryScanOptions): Promise<RepositoryScanResult> {
    return this.scanner.scan(options);
  }

  async overview(options: RepositoryScanOptions): Promise<RepositoryOverview> {
    const scan = await this.scan(options);
    const extensionCounts = new Map<string, number>();

    for (const file of scan.files) {
      const extension = file.extension || '[none]';
      extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
    }

    return {
      rootPath: scan.rootPath,
      fileCount: scan.files.length,
      extensionCounts: [...extensionCounts.entries()]
        .map(([extension, count]) => ({ extension, count }))
        .sort((a, b) => b.count - a.count || a.extension.localeCompare(b.extension)),
      largestFiles: [...scan.files].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 10),
      truncated: scan.truncated,
    };
  }

  async projectProfile(
    options: RepositoryScanOptions & {
      readonly maxKeyFiles?: number;
      readonly maxLargestFiles?: number;
      readonly maxExtensions?: number;
    },
  ): Promise<RepositoryProjectProfile> {
    const scan = await this.scan({
      ...options,
      maxFiles: options.maxFiles ?? DEFAULT_PROFILE_MAX_FILES,
      maxDepth: options.maxDepth ?? DEFAULT_PROFILE_MAX_DEPTH,
      includeTextPreview: false,
    });
    const extensionCounts = this.extensionCounts(scan.files).slice(0, options.maxExtensions ?? DEFAULT_PROFILE_MAX_EXTENSIONS);
    const keyFiles = scan.files
      .filter((file) => KEY_FILE_NAMES.has(file.relativePath.split('/').pop() ?? file.relativePath))
      .slice(0, options.maxKeyFiles ?? DEFAULT_PROFILE_MAX_KEY_FILES);
    const packageManifests = scan.files
      .filter((file) => file.relativePath.endsWith('package.json'))
      .slice(0, options.maxKeyFiles ?? DEFAULT_PROFILE_MAX_KEY_FILES);
    const entrypointHints = scan.files
      .filter((file) => ENTRYPOINT_PATTERNS.some((pattern) => pattern.test(file.relativePath)))
      .slice(0, options.maxKeyFiles ?? DEFAULT_PROFILE_MAX_KEY_FILES);

    return {
      rootPath: scan.rootPath,
      fileCount: scan.files.length,
      truncated: scan.truncated,
      extensionCounts,
      keyFiles,
      packageManifests,
      workspaceHints: this.workspaceHints(scan.files),
      entrypointHints,
      largestFiles: [...scan.files]
        .sort((a, b) => b.sizeBytes - a.sizeBytes)
        .slice(0, options.maxLargestFiles ?? DEFAULT_PROFILE_MAX_LARGEST_FILES),
      tokenPolicy: {
        profile: 'compact',
        exactCodexBillingAvailable: false,
        billingNote:
          'MCP can estimate payload tokens for tool inputs and outputs. Exact total Codex billing requires host-provided model usage metadata, which is not available inside this MCP server.',
        recommendedNextTools: ['repository.search_files', 'repository.search_symbols', 'repository.read_file_excerpt'],
        avoidUntilNeeded: [
          'repository.overview',
          'repository.import_graph',
          'repository.call_graph',
          'repository.read_file_context',
          'repository.read_module_context',
        ],
      },
    };
  }

  async searchFiles(options: RepositorySearchOptions): Promise<RepositorySearchResult> {
    const scan = await this.scan({
      ...options,
      includeTextPreview: Boolean(options.query),
    });
    const normalizedQuery = options.query?.toLowerCase();
    const normalizedExtension = options.extension?.startsWith('.')
      ? options.extension.toLowerCase()
      : options.extension
        ? `.${options.extension.toLowerCase()}`
        : undefined;

    const matches = scan.files.filter((file) => {
      const extensionMatches = normalizedExtension ? file.extension === normalizedExtension : true;
      const queryMatches = normalizedQuery
        ? file.relativePath.toLowerCase().includes(normalizedQuery) ||
          (file.textPreview?.toLowerCase().includes(normalizedQuery) ?? false)
        : true;

      return extensionMatches && queryMatches;
    });

    return {
      rootPath: scan.rootPath,
      matches,
      truncated: scan.truncated,
    };
  }

  async readFileContext(options: FileContextOptions): Promise<FileContextResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const filePath = this.safety.resolveInsideRoot(rootPath, options.filePath);
    const stat = await fs.stat(filePath);
    const maxBytes = options.maxBytes ?? DEFAULT_CONTEXT_MAX_BYTES;
    const content = await this.readBounded(filePath, maxBytes);

    return {
      rootPath,
      filePath,
      relativePath: this.safety.toRelative(rootPath, filePath),
      sizeBytes: stat.size,
      truncated: stat.size > maxBytes,
      content,
    };
  }

  async readFileExcerpt(options: FileExcerptOptions): Promise<FileExcerptResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const filePath = this.safety.resolveInsideRoot(rootPath, options.filePath);
    const stat = await fs.stat(filePath);
    const defaultMaxBytes = options.purpose === 'debug' || options.purpose === 'review' ? DEBUG_EXCERPT_MAX_BYTES : DEFAULT_EXCERPT_MAX_BYTES;
    const maxBytes = options.maxBytes ?? defaultMaxBytes;
    const excerpt = await this.readBounded(filePath, maxBytes);

    return {
      rootPath,
      filePath,
      relativePath: this.safety.toRelative(rootPath, filePath),
      sizeBytes: stat.size,
      maxBytes,
      truncated: stat.size > maxBytes,
      excerpt,
      tokenPolicy: {
        profile: 'excerpt',
        recommendedUse: 'Use this compact excerpt for project summaries and routing. Escalate only when the excerpt is insufficient.',
        escalationTool: 'repository.read_file_context',
      },
    };
  }

  async readModuleContext(options: ModuleContextOptions): Promise<ModuleContextResult> {
    const rootPath = this.safety.resolveRoot(options.rootPath);
    const modulePath = this.safety.resolveInsideRoot(rootPath, options.modulePath);
    const scanOptions: RepositoryScanOptions = {
      rootPath: modulePath,
      maxFiles: options.maxFiles ?? DEFAULT_MODULE_MAX_FILES,
      maxDepth: options.maxDepth ?? 4,
      ...(options.maxFileSizeBytes ? { maxFileSizeBytes: options.maxFileSizeBytes } : {}),
    };
    const scan = await this.scan(scanOptions);

    const files = await Promise.all(
      scan.files.map((file) =>
        this.readFileContext({
          rootPath,
          filePath: file.path,
          maxBytes: options.maxFileSizeBytes ?? DEFAULT_CONTEXT_MAX_BYTES,
        }),
      ),
    );

    return {
      rootPath,
      modulePath: this.safety.toRelative(rootPath, modulePath),
      files,
      truncated: scan.truncated,
    };
  }

  private async readBounded(filePath: string, maxBytes: number): Promise<string> {
    const handle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const result = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, result.bytesRead).toString('utf8');
    } finally {
      await handle.close();
    }
  }

  private extensionCounts(files: readonly RepositoryScanResult['files'][number][]): readonly { extension: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const file of files) {
      const extension = file.extension || '[none]';
      counts.set(extension, (counts.get(extension) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([extension, count]) => ({ extension, count }))
      .sort((a, b) => b.count - a.count || a.extension.localeCompare(b.extension));
  }

  private workspaceHints(files: readonly RepositoryScanResult['files'][number][]): readonly string[] {
    const paths = new Set(files.map((file) => file.relativePath));
    const hints: string[] = [];
    if (paths.has('pnpm-workspace.yaml')) {
      hints.push('pnpm workspace');
    }
    if (paths.has('turbo.json')) {
      hints.push('Turborepo');
    }
    if (paths.has('nx.json')) {
      hints.push('Nx workspace');
    }
    if ([...paths].some((file) => file.startsWith('apps/'))) {
      hints.push('apps directory');
    }
    if ([...paths].some((file) => file.startsWith('packages/'))) {
      hints.push('packages directory');
    }
    return hints;
  }
}
