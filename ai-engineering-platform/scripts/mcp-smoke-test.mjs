import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

function parseToolResult(result) {
  const item = result.content?.[0];
  if (item?.type !== 'text') {
    throw new Error('Expected text tool result.');
  }
  return JSON.parse(item.text);
}

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function runGit(rootPath, args) {
  execFileSync('git', args, { cwd: rootPath, stdio: 'ignore' });
}

async function callTool(client, name, args) {
  const result = parseToolResult(await client.callTool({ name, arguments: args }));
  if (result.code && result.message) {
    throw new Error(`${name} failed: ${result.message}`);
  }
  return result;
}

async function createFixture() {
  const rootPath = await mkdtemp(path.join(tmpdir(), 'aep-mcp-smoke-'));
  await mkdir(path.join(rootPath, 'src'), { recursive: true });
  await writeFile(
    path.join(rootPath, 'src', 'helper.ts'),
    'export function helper(): string { return "ok"; }\n',
  );
  await writeFile(
    path.join(rootPath, 'src', 'service.ts'),
    'import { helper } from "./helper";\nexport class Service { run(): string { return helper(); } }\n',
  );
  await writeFile(path.join(rootPath, 'README.md'), '# Original\n');
  await writeFile(
    path.join(rootPath, 'package.json'),
    JSON.stringify({ scripts: { build: 'node -e "process.exit(0)"' } }),
  );
  runGit(rootPath, ['init', '-b', 'main']);
  runGit(rootPath, ['config', 'user.name', 'Smoke Test']);
  runGit(rootPath, ['config', 'user.email', 'smoke@example.com']);
  runGit(rootPath, ['add', '.']);
  runGit(rootPath, ['commit', '-m', 'initial']);
  return rootPath;
}

const rootPath = await createFixture();
const verificationCommand = process.platform === 'win32' ? 'pnpm.cmd build' : 'pnpm build';
const transport = new StdioClientTransport({ command: 'node', args: ['dist/main.js'] });
const client = new Client({ name: 'ai-engineering-platform-smoke-test', version: '0.1.0' });

await client.connect(transport);
try {
  const tools = await client.listTools();
  const health = await callTool(client, 'platform.health', {});
  const metadata = await callTool(client, 'platform.metadata', { includeTools: false });
  const toolSummary = await callTool(client, 'platform.tool_summary', {});
  const projectProfile = await callTool(client, 'repository.project_profile', {
    rootPath,
    mode: 'summary',
  });
  const summaryFileSearch = await callTool(client, 'repository.search_files', {
    rootPath,
    query: 'src',
    mode: 'summary',
    maxMatches: 50,
  });
  const fileExcerpt = await callTool(client, 'repository.read_file_excerpt', {
    rootPath,
    filePath: 'README.md',
    purpose: 'summary',
  });
  const importGraph = await callTool(client, 'repository.import_graph', { rootPath });
  const plan = await callTool(client, 'planning.create_plan', {
    objective: 'Smoke update README',
    rootPath,
    targetFiles: ['README.md'],
  });
  const approval = await callTool(client, 'planning.approval_gate', {
    planId: plan.id,
    decision: 'approve',
  });
  const proposal = await callTool(client, 'patch.create_proposal', {
    planId: plan.id,
    rootPath,
    changes: [
      {
        operation: 'update',
        filePath: 'README.md',
        summary: 'Smoke update.',
        proposedContent: '# Updated\n',
      },
    ],
    verificationCommands: [verificationCommand],
  });
  const apply = await callTool(client, 'patch.apply_proposal', {
    proposalId: proposal.id,
    runVerification: true,
    verificationTimeoutMs: 30000,
  });
  const updated = await readFile(path.join(rootPath, 'README.md'), 'utf8');
  const rollback = await callTool(client, 'patch.rollback_apply', { applyRunId: apply.id });
  const restored = await readFile(path.join(rootPath, 'README.md'), 'utf8');
  const artifactContent = 'remote artifact bytes';
  const artifact = await callTool(client, 'plugin.verify_artifact', {
    artifactContent,
    source: {
      type: 'https_archive',
      url: 'https://example.com/plugin.tgz',
      checksumAlgorithm: 'sha256',
      checksum: sha256(artifactContent),
    },
  });
  const tokenEstimate = await callTool(client, 'token_budget.estimate', {
    budgetTokens: 20,
    items: [{ id: 'readme', content: updated, priority: 'high' }],
  });
  const tokenStrategy = await callTool(client, 'token_budget.recommend_strategy', {
    objective: 'Smoke verify token-aware flow',
    questionType: 'tech_stack_quick_view',
    currentTokens: tokenEstimate.estimatedTokens,
  });
  const summaryTokenStrategy = await callTool(client, 'token_budget.recommend_strategy', {
    objective: 'Summarize this project purpose',
    questionType: 'project_summary',
    currentTokens: tokenEstimate.estimatedTokens,
  });
  const integrationReadiness = await callTool(client, 'integration.readiness', {
    configuredServerName: 'ai_engineering_platform',
    expectedTools: ['platform.health', 'token_budget.estimate'],
    availableTools: tools.tools.map((tool) => tool.name),
    agentsInstructionLoaded: true,
  });
  const integrationSession = await callTool(client, 'integration.start_session', {
    client: 'codex',
    workspaceRoot: rootPath,
    sessionId: 'smoke-session',
  });
  await callTool(client, 'integration.record_tool_usage', {
    sessionId: integrationSession.id,
    toolName: 'token_budget.estimate',
    status: 'success',
    estimatedInputTokens: 5,
    estimatedOutputTokens: tokenEstimate.estimatedTokens,
  });
  const workflowIndex = await callTool(client, 'integration.workflow_index', {
    taskType: 'tech_stack_quick_view',
  });
  const summaryWorkflowIndex = await callTool(client, 'integration.workflow_index', {
    taskType: 'project_summary',
  });
  const flushTelemetry = await callTool(client, 'integration.flush_telemetry', {
    rootPath,
  });
  const integrationSummary = await callTool(client, 'integration.telemetry_summary', {
    rootPath,
    sessionId: integrationSession.id,
  });
  const autoTelemetry = await callTool(client, 'integration.auto_telemetry_summary', {
    questionType: 'tech_stack_quick_view',
  });

  const summary = {
    rootPath,
    toolCount: tools.tools.length,
    healthStatus: health.status,
    platformPhase: metadata.platform.phase,
    metadataCompact: !metadata.tools && metadata.toolSummary?.totalTools === tools.tools.length,
    toolSummaryModules: toolSummary.modules.length,
    projectProfileSummary: projectProfile.tokenPolicy?.profile === 'summary',
    projectProfileKeyFiles: projectProfile.keyFiles.length,
    projectProfileLargestFiles: projectProfile.largestFiles.length,
    projectProfileSummaryNextTools: projectProfile.tokenPolicy?.recommendedNextTools ?? [],
    summarySearchReturnedMatches: summaryFileSearch.returnedMatches,
    summarySearchMaxMatches: summaryFileSearch.tokenPolicy?.maxMatches,
    summarySearchProfile: summaryFileSearch.tokenPolicy?.profile,
    summarySearchHasPreview: summaryFileSearch.matches.some((match) => Boolean(match.textPreview)),
    fileExcerptProfile: fileExcerpt.tokenPolicy?.profile,
    fileExcerptMaxBytes: fileExcerpt.maxBytes,
    exactCodexBillingAvailable: projectProfile.tokenPolicy?.exactCodexBillingAvailable === true,
    importResolved: importGraph.edges.some((edge) => edge.resolvedRelativePath === 'src/helper.ts'),
    planStatus: plan.status,
    approvalStatus: approval.status,
    proposalStatus: proposal.status,
    applyStatus: apply.status,
    verificationStatuses: apply.verificationResults.map((result) => result.status),
    updated,
    rollbackStatus: rollback.status,
    restored,
    artifactValid: artifact.valid,
    tokenEstimate: tokenEstimate.estimatedTokens,
    tokenStrategyStatus: tokenStrategy.status,
    tokenStrategyQuestionType: tokenStrategy.questionProfile?.questionType,
    tokenStrategyMaxTokens: tokenStrategy.maxTokens,
    tokenStrategyExcerptMaxBytes: tokenStrategy.questionProfile?.excerptMaxBytes,
    tokenStrategyDoNotCallTools: tokenStrategy.doNotCallTools,
    summaryStrategyQuestionType: summaryTokenStrategy.questionProfile?.questionType,
    summaryStrategyGateMode: summaryTokenStrategy.questionProfile?.gateMode,
    summaryStrategyDefaultReportMode: summaryTokenStrategy.questionProfile?.defaultReportMode,
    summaryStrategyDebugReportTriggers:
      summaryTokenStrategy.questionProfile?.debugReportTriggers ?? [],
    summaryStrategyPreferredTools: summaryTokenStrategy.preferredTools,
    summaryStrategyDoNotCallTools: summaryTokenStrategy.doNotCallTools,
    integrationReady: integrationReadiness.ready,
    integrationToolCalls: integrationSummary.toolCalls,
    workflowIndexEntries: workflowIndex.entries.length,
    summaryWorkflowDoNotCallTools: summaryWorkflowIndex.entries[0]?.doNotCallTools ?? [],
    summaryWorkflowEvidenceTools: summaryWorkflowIndex.entries[0]?.evidenceTools ?? [],
    summaryWorkflowGateMode: summaryWorkflowIndex.entries[0]?.gateMode,
    summaryWorkflowDefaultReportMode: summaryWorkflowIndex.entries[0]?.defaultReportMode,
    summaryWorkflowDebugReportTriggers:
      summaryWorkflowIndex.entries[0]?.debugReportTriggers ?? [],
    telemetryRecordsWritten: flushTelemetry.recordsWritten,
    autoTelemetryToolCalls: autoTelemetry.toolCalls,
    autoTelemetryEstimatedTokens: autoTelemetry.estimatedTotalTokens,
    autoTelemetryBudgetStatus: autoTelemetry.budgetStatus?.status,
  };

  if (
    summary.toolCount < 84 ||
    summary.healthStatus !== 'ok' ||
    summary.platformPhase !== 'phase-37-user-facing-compact-reporting' ||
    !summary.metadataCompact ||
    summary.toolSummaryModules < 1 ||
    !summary.projectProfileSummary ||
    summary.projectProfileKeyFiles > 5 ||
    summary.projectProfileLargestFiles !== 0 ||
    summary.projectProfileSummaryNextTools.some((tool) => tool === 'repository.search_symbols') ||
    summary.summarySearchProfile !== 'summary' ||
    summary.summarySearchMaxMatches !== 8 ||
    summary.summarySearchReturnedMatches > 8 ||
    summary.summarySearchHasPreview ||
    summary.fileExcerptProfile !== 'excerpt' ||
    summary.fileExcerptMaxBytes !== 700 ||
    summary.exactCodexBillingAvailable ||
    !summary.importResolved ||
    summary.approvalStatus !== 'approved' ||
    summary.proposalStatus !== 'ready_for_review' ||
    summary.applyStatus !== 'applied' ||
    !summary.verificationStatuses.every((status) => status === 'passed') ||
    summary.updated !== '# Updated\n' ||
    summary.rollbackStatus !== 'rolled_back' ||
    summary.restored !== '# Original\n' ||
    !summary.artifactValid ||
    summary.tokenEstimate <= 0 ||
    summary.tokenStrategyStatus !== 'within_budget' ||
    summary.tokenStrategyQuestionType !== 'tech_stack_quick_view' ||
    summary.tokenStrategyMaxTokens !== 2500 ||
    summary.tokenStrategyExcerptMaxBytes !== 900 ||
    !summary.tokenStrategyDoNotCallTools.includes('repository.read_file_context') ||
    summary.summaryStrategyQuestionType !== 'project_summary' ||
    summary.summaryStrategyGateMode !== 'compact_read_only' ||
    summary.summaryStrategyDefaultReportMode !== 'normal_user_summary' ||
    !summary.summaryStrategyDebugReportTriggers.includes('tools used') ||
    !summary.summaryStrategyDebugReportTriggers.includes('debug MCP') ||
    summary.summaryStrategyPreferredTools.includes('platform.tool_summary') ||
    summary.summaryStrategyPreferredTools.includes('repository.search_files') ||
    summary.summaryStrategyPreferredTools.includes('repository.search_symbols') ||
    !summary.summaryStrategyDoNotCallTools.some((tool) => tool.includes('platform.tool_summary')) ||
    !summary.summaryStrategyDoNotCallTools.some((tool) =>
      tool.includes('repository.search_files'),
    ) ||
    !summary.summaryStrategyDoNotCallTools.includes('repository.search_symbols') ||
    summary.summaryWorkflowEvidenceTools.includes('platform.tool_summary') ||
    summary.summaryWorkflowGateMode !== 'compact_read_only' ||
    summary.summaryWorkflowDefaultReportMode !== 'normal_user_summary' ||
    !summary.summaryWorkflowDebugReportTriggers.includes('telemetry') ||
    !summary.summaryWorkflowDebugReportTriggers.includes('evidence detail') ||
    summary.summaryWorkflowEvidenceTools.includes('repository.search_files') ||
    summary.summaryWorkflowEvidenceTools.includes('repository.search_symbols') ||
    !summary.summaryWorkflowDoNotCallTools.some((tool) => tool.includes('platform.tool_summary')) ||
    !summary.summaryWorkflowDoNotCallTools.some((tool) =>
      tool.includes('repository.search_files'),
    ) ||
    !summary.summaryWorkflowDoNotCallTools.includes('repository.search_symbols') ||
    !summary.integrationReady ||
    summary.integrationToolCalls !== 1 ||
    summary.workflowIndexEntries !== 1 ||
    summary.telemetryRecordsWritten !== 1 ||
    summary.autoTelemetryToolCalls < 10 ||
    summary.autoTelemetryEstimatedTokens <= 0 ||
    !['within_budget', 'over_budget'].includes(summary.autoTelemetryBudgetStatus)
  ) {
    throw new Error(`MCP smoke test failed: ${JSON.stringify(summary, null, 2)}`);
  }

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await client.close();
}
