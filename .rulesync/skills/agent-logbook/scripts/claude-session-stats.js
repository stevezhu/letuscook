#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

async function getSessionFile(sessionId) {
  try {
    const projectDirs = await fs.promises.readdir(CLAUDE_PROJECTS_DIR);
    const results = await Promise.all(
      projectDirs.map(async (projectDir) => {
        const projectPath = path.join(CLAUDE_PROJECTS_DIR, projectDir);
        const stats = await fs.promises.stat(projectPath);
        if (stats.isDirectory()) {
          const sessionFile = path.join(projectPath, `${sessionId}.jsonl`);
          if (fs.existsSync(sessionFile)) {
            return sessionFile;
          }
        }
        return null;
      }),
    );

    return results.find((file) => file !== null) || null;
  } catch (error) {
    console.error('Error searching projects directory:', error.message);
  }
  return null;
}

async function aggregateStats(sessionFile) {
  const stats = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    models: new Set(),
  };

  const fileStream = fs.createReadStream(sessionFile);
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

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: claude-session-stats.js <session-id>');
    process.exit(1);
  }

  const sessionFile = await getSessionFile(sessionId);
  if (!sessionFile) {
    console.error(`Session file not found for ID: ${sessionId}`);
    process.exit(1);
  }

  const stats = await aggregateStats(sessionFile);

  console.log(`\nClaude Session Stats: ${sessionId}`);
  console.log(`========================================`);
  console.log(`Project File: ${sessionFile}`);
  console.log(`Models Used:  ${Array.from(stats.models).join(', ')}`);
  console.log(`----------------------------------------`);
  console.log(
    `Total Input Tokens:          ${stats.input_tokens.toLocaleString()}`,
  );
  console.log(
    `Total Output Tokens:         ${stats.output_tokens.toLocaleString()}`,
  );
  console.log(
    `Total Cache Creation Input:  ${stats.cache_creation_input_tokens.toLocaleString()}`,
  );
  console.log(
    `Total Cache Read Input:      ${stats.cache_read_input_tokens.toLocaleString()}`,
  );
  console.log(`----------------------------------------`);
  console.log(
    `Total Tokens:                ${(stats.input_tokens + stats.output_tokens + stats.cache_creation_input_tokens + stats.cache_read_input_tokens).toLocaleString()}`,
  );
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
