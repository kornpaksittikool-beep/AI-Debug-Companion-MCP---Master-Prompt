import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const codexHome = process.env.CODEX_HOME ?? path.join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.codex');
const skillName = 'ai-engineering-platform-auto-use';
const sourceSkillPath = path.join(repoRoot, 'codex', 'skills', skillName);
const targetSkillPath = path.join(codexHome, 'skills', skillName);
const configPath = path.join(codexHome, 'config.toml');
const distMainPath = path.join(repoRoot, 'dist', 'main.js');

async function copyDirectory(source, target) {
  await mkdir(target, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntry = path.join(source, entry.name);
    const targetEntry = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourceEntry, targetEntry);
      continue;
    }

    await copyFile(sourceEntry, targetEntry);
  }
}

async function ensureMcpConfig() {
  await mkdir(codexHome, { recursive: true });
  const block = [
    '',
    '[mcp_servers.ai_engineering_platform]',
    "command = 'node'",
    `args = ['${distMainPath}']`,
    'startup_timeout_sec = 120',
    '',
  ].join('\n');

  if (!existsSync(configPath)) {
    await writeFile(configPath, block.trimStart(), 'utf8');
    return 'created';
  }

  const currentConfig = await readFile(configPath, 'utf8');
  if (currentConfig.includes('[mcp_servers.ai_engineering_platform]')) {
    return 'already_present';
  }

  await writeFile(configPath, `${currentConfig.trimEnd()}\n${block}`, 'utf8');
  return 'appended';
}

async function main() {
  await stat(sourceSkillPath);
  const distReady = existsSync(distMainPath);
  await copyDirectory(sourceSkillPath, targetSkillPath);
  const configStatus = await ensureMcpConfig();

  const result = {
    status: 'ok',
    codexHome,
    skillInstalledTo: targetSkillPath,
    mcpConfig: configStatus,
    mcpServerEntry: 'ai_engineering_platform',
    distMainPath,
    distReady,
    nextStep: distReady
      ? 'Open a new Codex thread and ask a natural project question such as "สรุปโปรเจ็กต์นี้ให้หน่อย".'
      : 'Run pnpm build, then open a new Codex thread.',
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown installation failure.',
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
