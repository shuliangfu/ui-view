#!/usr/bin/env node
/**
 * Node.js test runner — runs unit + docs-browser test files in the MAIN process
 * (no `node --test` flag; see prior TAP/IPC note).
 *
 * Browser E2E needs Playwright Chromium (`npx playwright install chromium`)
 * and Deno on PATH (docs dev server).
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

process.env.CI = "true";

function collectTestFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectTestFiles(full, out);
    else if (/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const unitFiles = [
  "tests/docs-sidebar-reconcile.test.ts",
];

const browserFiles = collectTestFiles(resolve("tests/docs-browser"))
  .map((f) => relative(process.cwd(), f))
  .sort();

const testFiles = [...unitFiles, ...browserFiles];

let failed = 0;
for (const file of testFiles) {
  const full = resolve(file);
  const rel = relative(process.cwd(), full);
  console.log(`▶ ${rel}`);
  const result = spawnSync(
    process.execPath(),
    ["--import", "tsx", "--test-force-exit", full],
    {
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    },
  );
  if (result.status !== 0) {
    failed++;
    console.error(`✗ FAILED: ${rel}\n`);
  } else {
    console.log(`✓ ${rel}\n`);
  }
}

console.log("=".repeat(60));
if (failed > 0) {
  console.error(`✗ ${failed}/${testFiles.length} test file(s) failed`);
  process.exit(1);
}
console.log(`✓ All ${testFiles.length} test files passed`);
