#!/usr/bin/env node
/**
 * Node.js test runner — runs unit + docs-browser test files.
 *
 * 【Why 不用 `node --test`】Node 22 的 `--test` 会按文件 fork 子进程，并把子进程
 * stdout 当 TAP/IPC；被测代码写 stdout 会污染父进程解析。故每文件以 entry 方式跑
 *（`node --import <tsx> <file>`，无 `--test`），由 `node:test` 在进程内自动执行。
 *
 * 【共享 docs server】每文件 `--test-force-exit` 常跳过 afterAll，子进程留下的 Deno
 * docs 会占满 3000+ 端口（Node mac「50 次无法 bind」）。由本父进程先起一台 docs，
 * 经 `UI_VIEW_DOCS_E2E_BASE_URL` 交给各子进程复用。
 *
 * 【tsx 绝对路径】Windows CI 在长跑 DIG 后偶发解析不到 `tsx` package 名；改用
 * `import.meta.resolve("tsx")` 得到 file URL 再 `--import`。
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.CI = "true";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const DOCS_ROOT = join(ROOT, "docs");

function collectTestFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectTestFiles(full, out);
    else if (/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Resolve tsx loader to an absolute file URL (Windows-safe). */
function resolveTsxImport() {
  try {
    if (typeof import.meta.resolve === "function") {
      return import.meta.resolve("tsx");
    }
  } catch {
    /* fall through to file candidates */
  }
  const candidates = [
    join(ROOT, "node_modules", "tsx", "dist", "loader.mjs"),
    join(ROOT, "node_modules", "tsx", "dist", "esm", "index.mjs"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return pathToFileURL(c).href;
  }
  throw new Error(
    "tsx not found under node_modules; run `npm install` (devDependency tsx).",
  );
}

function canListen(port) {
  return new Promise((resolvePromise) => {
    const server = createServer();
    server.once("error", () => resolvePromise(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolvePromise(true));
    });
  });
}

async function findPort(start = 3000, maxAttempts = 200) {
  const offset = Math.abs(process.pid % 180);
  const base = start + offset;
  for (let i = 0; i < maxAttempts; i++) {
    const port = base + i;
    if (await canListen(port)) return port;
  }
  throw new Error(`test-node: no free port from ${base} (+${maxAttempts})`);
}

function waitHttpOk(url, deadlineMs) {
  const deadline = Date.now() + deadlineMs;
  return (async () => {
    while (Date.now() < deadline) {
      try {
        const res = await fetch(url);
        if (res.ok) return;
      } catch {
        /* not ready */
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(`test-node: docs server not ready within ${deadlineMs}ms: ${url}`);
  })();
}


/** Node <20 lacks --test-force-exit; omit so older local PATH nodes still run. */
function supportsTestForceExit() {
  try {
    const r = spawnSync(process.execPath, ["--test-force-exit", "--eval", "0"], {
      encoding: "utf8",
    });
    // Unknown option → non-zero + stderr mentions the flag; supported → eval runs.
    const err = `${r.stderr || ""}${r.stdout || ""}`;
    if (/bad option|unknown option|unrecognized/i.test(err)) return false;
    return r.status === 0 || !/bad option/i.test(err);
  } catch {
    return false;
  }
}
const TEST_FORCE_EXIT = supportsTestForceExit();

const tsxImport = resolveTsxImport();
console.log(`tsx loader: ${tsxImport}`);
console.log(`--test-force-exit: ${TEST_FORCE_EXIT ? "on" : "off (unsupported by this Node)"}`);

const unitFiles = ["tests/docs-sidebar-reconcile.test.ts"];
const browserFiles = collectTestFiles(resolve("tests/docs-browser"))
  .map((f) => relative(process.cwd(), f))
  .sort();
const testFiles = [...unitFiles, ...browserFiles];

const startMs = Number.parseInt(process.env.UI_VIEW_DOCS_DEV_START_MS || "180000", 10);
const port = await findPort(3000);
const baseUrl = `http://127.0.0.1:${port}`;
console.log(`▶ shared docs server on ${baseUrl}`);

const docsProc = spawn("deno", ["run", "-A", "src/main.ts"], {
  cwd: DOCS_ROOT,
  env: {
    ...process.env,
    PORT: String(port),
    UI_VIEW_DOCS_BROWSER_E2E: "1",
    CI: "true",
  },
  stdio: "inherit",
  detached: false,
});

function shutdownDocs() {
  try {
    if (docsProc && !docsProc.killed) docsProc.kill("SIGKILL");
  } catch {
    /* ignore */
  }
}
process.on("exit", shutdownDocs);
process.on("SIGTERM", () => {
  shutdownDocs();
  process.exit(1);
});
process.on("SIGINT", () => {
  shutdownDocs();
  process.exit(1);
});

try {
  await waitHttpOk(baseUrl + "/", Number.isFinite(startMs) ? startMs : 180000);
  console.log(`✓ docs server ready`);
} catch (e) {
  shutdownDocs();
  console.error(e);
  process.exit(1);
}

const childEnv = {
  ...process.env,
  CI: "true",
  UI_VIEW_DOCS_E2E_BASE_URL: baseUrl,
  UI_VIEW_DOCS_E2E_PORT: String(port),
  UI_VIEW_DOCS_DEV_START_MS: String(Number.isFinite(startMs) ? startMs : 180000),
};

let failed = 0;
for (const file of testFiles) {
  const full = resolve(file);
  const rel = relative(process.cwd(), full);
  console.log(`▶ ${rel}`);
  const result = spawnSync(
    process.execPath,
    TEST_FORCE_EXIT
      ? ["--import", tsxImport, "--test-force-exit", full]
      : ["--import", tsxImport, full],
    {
      stdio: "inherit",
      env: childEnv,
    },
  );
  if (result.status !== 0) {
    failed++;
    console.error(`✗ FAILED: ${rel}\n`);
  } else {
    console.log(`✓ ${rel}\n`);
  }
}

shutdownDocs();

console.log("=".repeat(60));
if (failed > 0) {
  console.error(`✗ ${failed}/${testFiles.length} test file(s) failed`);
  process.exit(1);
}
console.log(`✓ All ${testFiles.length} test files passed`);
