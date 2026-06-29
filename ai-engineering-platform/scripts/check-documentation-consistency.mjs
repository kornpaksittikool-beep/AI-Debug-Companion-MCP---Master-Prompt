import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rootPath = process.cwd();
const phaseLabel = 'phase-39-documentation-consistency';

const files = new Map(
  await Promise.all(
    [
      'README.md',
      'ROADMAP.md',
      'TODO.md',
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
  'Phase 39 completes documentation consistency across README, roadmap, TODO, phase reports, smoke-test metadata, and Codex skill guidance before new runtime capability work starts.',
);
requireIncludes(
  'README.md',
  'Documentation consistency check for current phase status, roadmap/TODO alignment, Phase 39 report coverage, and smoke-test platform metadata.',
);
requireIncludes(
  'ROADMAP.md',
  '| M39: Documentation Consistency                | Phase 39 | Align README current-phase summary with completed Phase 38 and completed Phase 39 status                                         | Phase 38 fallback policy                         | High     | Low                  | Completed |',
);
requireIncludes(
  'ROADMAP.md',
  'Phase 39 is completed. The next runtime capability phase is not started and must be planned and approved before implementation.',
);
requireIncludes(
  'TODO.md',
  '| Add documentation consistency checks for phase numbers, status labels, and smoke-test phase metadata                  | Phase 39 | Completed |',
);
requireIncludes(
  'docs/phase-39-plan.md',
  '| Completion report | Completed | `docs/phase-39-report.md` records deliverables, verification output, risks, and approval status. |',
);
requireIncludes(
  'docs/phase-39-report.md',
  '| Documentation consistency check | Completed | `scripts/check-documentation-consistency.mjs` verifies Phase 39 status, phase metadata, and stale current-phase wording. |',
);

for (const [filePath, content] of files) {
  if (filePath === 'docs/phase-39-plan.md') {
    continue;
  }
  if (/Phase 39 is planned|Phase 39 \| Planned|Phase 39 as the next planned phase/.test(content)) {
    failures.push(`${filePath} contains stale Phase 39 planned wording.`);
  }
}

requireNotIncludes('scripts/mcp-smoke-test.mjs', 'phase-38-summary-fallback-discipline');
requireNotIncludes('test/unit/health-tools.spec.ts', 'phase-38-summary-fallback-discipline');

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
