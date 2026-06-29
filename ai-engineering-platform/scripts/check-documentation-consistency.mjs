import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rootPath = process.cwd();
const phaseLabel = 'phase-40-real-integration-workflows';

const files = new Map(
  await Promise.all(
    [
      'README.md',
      'ROADMAP.md',
      'TODO.md',
      'docs/phase-40-plan.md',
      'docs/phase-40-report.md',
      'docs/phase-39-plan.md',
      'docs/phase-39-report.md',
      'docs/platform-capabilities-th.md',
      'scripts/mcp-smoke-test.mjs',
      'src/modules/health/services/health.service.ts',
      'src/modules/health/tools/platform-metadata.tool.ts',
      'src/modules/health/tools/platform-tool-summary.tool.ts',
      'test/unit/health-tools.spec.ts',
    ].map(async (relativePath) => [
      relativePath,
      await readFile(path.join(rootPath, relativePath), 'utf8'),
    ]),
  ),
);

const failures = [];

function requireIncludes(filePath, expected) {
  if (!files.get(filePath)?.includes(expected)) {
    failures.push(`${filePath} is missing expected text: ${expected}`);
  }
}

function requireNotIncludes(filePath, unexpected) {
  if (files.get(filePath)?.includes(unexpected)) {
    failures.push(`${filePath} still contains stale text: ${unexpected}`);
  }
}

for (const filePath of [
  'scripts/mcp-smoke-test.mjs',
  'src/modules/health/services/health.service.ts',
  'src/modules/health/tools/platform-metadata.tool.ts',
  'src/modules/health/tools/platform-tool-summary.tool.ts',
  'test/unit/health-tools.spec.ts',
  'docs/platform-capabilities-th.md',
]) {
  requireIncludes(filePath, phaseLabel);
}

requireIncludes(
  'README.md',
  'Phase 40 completes real integration workflow contracts for summary, debugging, code review, and planning by exposing workflow acceptance criteria through token strategy and workflow index metadata, adding regression coverage, and validating those contracts in the MCP smoke test.',
);
requireIncludes(
  'README.md',
  'Real integration workflow acceptance criteria for project summary, debugging, code review, and planning workflows.',
);
requireIncludes(
  'ROADMAP.md',
  '| M40: Real Integration Workflows               | Phase 40 | Add explicit workflow acceptance criteria for summary, debugging, code review, and planning                                      | Phase 39 documentation consistency               | High     | Medium               | Completed |',
);
requireIncludes(
  'ROADMAP.md',
  'Phase 40 is completed. The next runtime capability phase is not started and must be planned and approved before implementation.',
);
requireIncludes(
  'TODO.md',
  '| Add unit and MCP smoke coverage for real workflow contracts                                                           | Phase 40 | Completed |',
);
requireIncludes(
  'docs/phase-40-plan.md',
  '| Workflow acceptance criteria | Completed | Summary, debugging, code review, and planning profiles each define observable criteria for start tools, evidence boundaries, reporting, and verification. |',
);
requireIncludes(
  'docs/phase-40-report.md',
  '| Workflow acceptance criteria | Completed | `token_budget.recommend_strategy` and `integration.workflow_index` expose acceptance criteria for summary, debugging, code review, and planning. |',
);

for (const [filePath, content] of files) {
  if (filePath === 'docs/phase-40-plan.md') {
    continue;
  }
  if (/Phase 40 is planned|Phase 40 \| Planned|Phase 40 as the next planned phase/.test(content)) {
    failures.push(`${filePath} contains stale Phase 40 planned wording.`);
  }
}

requireNotIncludes('scripts/mcp-smoke-test.mjs', 'phase-38-summary-fallback-discipline');
requireNotIncludes('test/unit/health-tools.spec.ts', 'phase-38-summary-fallback-discipline');
requireNotIncludes('scripts/mcp-smoke-test.mjs', 'phase-39-documentation-consistency');
requireNotIncludes('test/unit/health-tools.spec.ts', 'phase-39-documentation-consistency');

if (failures.length > 0) {
  throw new Error(`Documentation consistency check failed:\n- ${failures.join('\n- ')}`);
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      phase: phaseLabel,
      checkedFiles: files.size,
    },
    null,
    2,
  ),
);
