#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit): formats the edited file with Prettier, then
// reports TypeScript and ESLint results back to Claude via additionalContext so it can
// self-correct. Never blocks — this is feedback, not an approval gate.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function run(binPath, args, cwd) {
  try {
    const output = execFileSync(process.execPath, [binPath, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output };
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join('\n').trim();
    return { ok: false, output: output || err.message };
  }
}

const input = readStdin();
const filePath = input.tool_input?.file_path;

if (!filePath || !/\.(ts|tsx|vue)$/.test(filePath)) {
  process.exit(0);
}

const absFile = path.resolve(filePath);
const relFromRoot = path.relative(ROOT, absFile).replace(/\\/g, '/');
const isWebFile = relFromRoot.startsWith('web/');
const messages = [];

// (a) Prettier --write on the exact edited file
const prettierBin = path.join(ROOT, isWebFile ? 'web' : '.', 'node_modules/prettier/bin/prettier.cjs');
if (existsSync(prettierBin)) {
  const result = run(prettierBin, ['--write', absFile], ROOT);
  if (!result.ok) messages.push(`Prettier failed on ${relFromRoot}:\n${result.output}`);
}

// (b) Typecheck — project-wide (type errors aren't local to one file)
if (isWebFile) {
  const vueTscBin = path.join(ROOT, 'web/node_modules/vue-tsc/bin/vue-tsc.js');
  if (existsSync(vueTscBin)) {
    const result = run(vueTscBin, ['--noEmit'], path.join(ROOT, 'web'));
    if (!result.ok) messages.push(`vue-tsc found type errors:\n${result.output}`);
  }
} else {
  const tscBin = path.join(ROOT, 'node_modules/typescript/bin/tsc');
  if (existsSync(tscBin)) {
    const result = run(
      tscBin,
      ['--noEmit', '--incremental', '--tsBuildInfoFile', '.claude/cache/tsc-buildinfo.json'],
      ROOT,
    );
    if (!result.ok) messages.push(`tsc found type errors:\n${result.output}`);
  }
}

// (c) ESLint on the exact edited file (correct project's binary + config)
const eslintCwd = path.join(ROOT, isWebFile ? 'web' : '.');
const eslintBin = path.join(eslintCwd, 'node_modules/eslint/bin/eslint.js');
if (existsSync(eslintBin)) {
  const result = run(eslintBin, [absFile], eslintCwd);
  if (!result.ok) messages.push(`ESLint found issues in ${relFromRoot}:\n${result.output}`);
}

if (messages.length > 0) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: messages.join('\n\n---\n\n'),
      },
    }),
  );
}

process.exit(0);
