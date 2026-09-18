#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit): denies edits to lockfiles and .env (never
// .env.example). Lockfiles should only change via `npm install`; .env holds real secrets.
import { readFileSync } from 'node:fs';

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

const input = readStdin();
const filePath = input.tool_input?.file_path;

if (filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const isRootLock = /\/package-lock\.json$/.test(normalized);
  const isEnv = /\/\.env$/.test(normalized); // '.env.example' does not match this pattern

  if (isRootLock || isEnv) {
    const what = isEnv ? '.env' : 'package-lock.json';
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: isEnv
            ? '.env holds real secrets and is protected by project policy. Edit .env.example instead, or ask the user to change .env themselves.'
            : `${what} is protected by project policy — it should only change via \`npm install\`/\`npm ci\`, never a hand edit. Run the appropriate install command instead.`,
        },
      }),
    );
  }
}

process.exit(0);
