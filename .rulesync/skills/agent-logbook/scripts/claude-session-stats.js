#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

async function getSessionInfo(sessionId) {
  try {
    const projectDirs = await fs.promises.readdir(CLAUDE_PROJECTS_DIR);
    const sessionLookup = projectDirs.map(async (projectDir) => {
      const projectPath = path.join(CLAUDE_PROJECTS_DIR, projectDir);
      const stats = await fs.promises.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Not a directory: ${projectPath}`);
      }

      const sessionFile = path.join(projectPath, `${sessionId}.jsonl`);
      const subagentsDir = path.join(projectPath, sessionId, 'subagents');

      await fs.promises.access(sessionFile);

      let subagentFiles = [];
      try {
        const files = await fs.promises.readdir(subagentsDir);
        subagentFiles = files
          .filter((f) => f.endsWith('.jsonl'))
          .map((f) => path.join(subagentsDir, f));
      } catch {}

      return { sessionFile, subagentFiles };
    });

    try {
      return await Promise.any(sessionLookup);
    } catch (error) {
      if (error instanceof AggregateError) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error searching projects directory:', error.message);
  }
  return null;
}

async function aggregateStats(filePath) {
  const stats = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    models: new Set(),
  };

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'assistant' && data.message && data.message.usage) {
        const usage = data.message.usage;
        stats.input_tokens += usage.input_tokens || 0;
        stats.output_tokens += usage.output_tokens || 0;
        stats.cache_creation_input_tokens +=
          usage.cache_creation_input_tokens || 0;
        stats.cache_read_input_tokens += usage.cache_read_input_tokens || 0;

        if (data.message.model) {
          stats.models.add(data.message.model);
        }
      }
    } catch {
      // ignore invalid json lines
    }
  }

  return stats;
}

function combineStats(target, source) {
  target.input_tokens += source.input_tokens;
  target.output_tokens += source.output_tokens;
  target.cache_creation_input_tokens += source.cache_creation_input_tokens;
  target.cache_read_input_tokens += source.cache_read_input_tokens;
  source.models.forEach((m) => target.models.add(m));
}

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: claude-session-stats.js <session-id>');
    process.exit(1);
  }

  const sessionInfo = await getSessionInfo(sessionId);
  if (!sessionInfo) {
    console.error(`Session file not found for ID: ${sessionId}`);
    process.exit(1);
  }

  const mainStats = await aggregateStats(sessionInfo.sessionFile);
  const totalStats = { ...mainStats, models: new Set(mainStats.models) };

  const subagentsStats = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    models: new Set(),
    count: sessionInfo.subagentFiles.length,
  };

  const allSubagentStats = await Promise.all(
    sessionInfo.subagentFiles.map((file) => aggregateStats(file)),
  );
  for (const stats of allSubagentStats) {
    combineStats(subagentsStats, stats);
    combineStats(totalStats, stats);
  }

  console.log(`\nClaude Session Stats: ${sessionId}`);
  console.log(`========================================`);
  console.log(
    `Main Session Models: ${Array.from(mainStats.models).join(', ') || 'N/A'}`,
  );
  if (subagentsStats.count > 0) {
    console.log(
      `Subagent Models:     ${Array.from(subagentsStats.models).join(', ') || 'N/A'}`,
    );
  }
  console.log(`----------------------------------------`);
  console.log(`MAIN SESSION:`);
  console.log(
    `  Input Tokens:          ${mainStats.input_tokens.toLocaleString()}`,
  );
  console.log(
    `  Output Tokens:         ${mainStats.output_tokens.toLocaleString()}`,
  );
  console.log(
    `  Cache Creation Input:  ${mainStats.cache_creation_input_tokens.toLocaleString()}`,
  );
  console.log(
    `  Cache Read Input:      ${mainStats.cache_read_input_tokens.toLocaleString()}`,
  );

  if (subagentsStats.count > 0) {
    console.log(`----------------------------------------`);
    console.log(`SUBAGENTS (${subagentsStats.count} total):`);
    console.log(
      `  Input Tokens:          ${subagentsStats.input_tokens.toLocaleString()}`,
    );
    console.log(
      `  Output Tokens:         ${subagentsStats.output_tokens.toLocaleString()}`,
    );
    console.log(
      `  Cache Creation Input:  ${subagentsStats.cache_creation_input_tokens.toLocaleString()}`,
    );
    console.log(
      `  Cache Read Input:      ${subagentsStats.cache_read_input_tokens.toLocaleString()}`,
    );
  }

  console.log(`----------------------------------------`);
  console.log(`TOTAL USAGE:`);
  console.log(
    `  Total Input Tokens:    ${totalStats.input_tokens.toLocaleString()}`,
  );
  console.log(
    `  Total Output Tokens:   ${totalStats.output_tokens.toLocaleString()}`,
  );
  console.log(
    `  Total Cache Creation:  ${totalStats.cache_creation_input_tokens.toLocaleString()}`,
  );
  console.log(
    `  Total Cache Read:      ${totalStats.cache_read_input_tokens.toLocaleString()}`,
  );
  console.log(`----------------------------------------`);
  console.log(
    `GRAND TOTAL TOKENS:      ${(totalStats.input_tokens + totalStats.output_tokens + totalStats.cache_creation_input_tokens + totalStats.cache_read_input_tokens).toLocaleString()}`,
  );
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
